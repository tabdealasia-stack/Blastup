import { WebhookDeliveryLog } from '../models/WebhookDeliveryLog';
import { Webhook } from '../models/Webhook';
import { logger } from '../config/logger';
import { validateWebhookUrl, SSRFError } from '../utils/ssrf';
import { decryptWebhookSecret, generateWebhookSignature } from '../utils/webhookCrypto';
import { WebhookPayloadEnvelope } from '../services/webhook.service';
import https from 'https';

let workerInterval: NodeJS.Timeout | null = null;
let isShuttingDown = false;

// Config
const POLL_INTERVAL_MS = 5000;
const LEASE_DURATION_MS = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 5;
const REQUEST_TIMEOUT_MS = 5000;

const WEBHOOK_WORKER_ENABLED = process.env.WEBHOOK_WORKER_ENABLED !== 'false';

export function initWebhookWorker() {
  if (!WEBHOOK_WORKER_ENABLED) {
    logger.info('WebhookWorker is disabled via WEBHOOK_WORKER_ENABLED');
    return;
  }
  
  if (workerInterval) return;
  
  logger.info('Starting Webhook Delivery Worker');
  workerInterval = setInterval(() => {
    if (!isShuttingDown) {
      pollWebhookDeliveries().catch((err) => {
        logger.error('WebhookWorker poll error', { error: err.message });
      });
    }
  }, POLL_INTERVAL_MS);
  
  workerInterval.unref();
}

export function stopWebhookWorker() {
  isShuttingDown = true;
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
    logger.info('Stopped Webhook Delivery Worker polling');
  }
}

async function pollWebhookDeliveries() {
  const now = new Date();
  
  // Find one eligible delivery atomically and lock it
  const deliveryLog = await WebhookDeliveryLog.findOneAndUpdate(
    {
      status: { $in: ['pending', 'processing'] },
      $or: [
        { nextAttemptAt: null },
        { nextAttemptAt: { $lte: now } }
      ],
      $and: [
        { $or: [ { lockedUntil: null }, { lockedUntil: { $lte: now } } ] }
      ]
    },
    {
      $set: {
        status: 'processing',
        lockedUntil: new Date(now.getTime() + LEASE_DURATION_MS),
      },
      $inc: { attempt: 1 }
    },
    { new: true, sort: { nextAttemptAt: 1, createdAt: 1 } }
  );

  if (!deliveryLog) return; // Nothing to process

  await processDelivery(deliveryLog);
  
  if (!isShuttingDown) {
    setImmediate(() => pollWebhookDeliveries().catch(() => {}));
  }
}

async function processDelivery(deliveryLog: any) {
  const startTime = Date.now();
  let httpStatus: number | null = null;
  let errorMsg: string = '';
  let isTerminal = false;

  try {
    const webhook = await Webhook.findById(deliveryLog.webhookId);
    if (!webhook || !webhook.enabled) {
      throw new Error('Webhook disabled or deleted');
    }

    // SSRF Validation just before delivery
    const safeIp = await validateWebhookUrl(webhook.url);

    // Decrypt secret
    const secret = decryptWebhookSecret(webhook.encryptedSecret);

    // Prepare payload
    const payload: WebhookPayloadEnvelope = {
      id: deliveryLog._id.toString(),
      event: deliveryLog.event,
      occurredAt: deliveryLog.createdAt.toISOString(),
      client: {
        id: deliveryLog.clientId.toString(),
      },
      data: deliveryLog.payloadData,
    };

    const payloadString = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = generateWebhookSignature(secret, timestamp, payloadString);

    // Delivery request
    httpStatus = await sendWebhookRequest(webhook.url, payloadString, deliveryLog.event, deliveryLog._id.toString(), timestamp, signature);

    if (httpStatus >= 200 && httpStatus < 300) {
      // Success
      deliveryLog.status = 'delivered';
      deliveryLog.lockedUntil = null;
    } else if (httpStatus >= 400 && httpStatus < 500 && httpStatus !== 408 && httpStatus !== 429) {
      // Terminal 4xx (except 408 Timeout and 429 Rate Limit)
      throw new Error(`Terminal HTTP status: ${httpStatus}`);
    } else {
      // Retryable HTTP status
      throw new Error(`Retryable HTTP status: ${httpStatus}`);
    }
  } catch (error: any) {
    errorMsg = error.message;
    if (error instanceof SSRFError || errorMsg.startsWith('Terminal HTTP status') || errorMsg === 'Webhook disabled or deleted') {
      isTerminal = true;
    }
    
    if (deliveryLog.attempt >= MAX_ATTEMPTS || isTerminal) {
      deliveryLog.status = 'exhausted';
      deliveryLog.lockedUntil = null;
    } else {
      // Backoff (Exponential: 15s, 60s, 3m, 10m)
      const backoffMs = [15000, 60000, 180000, 600000][deliveryLog.attempt - 1] || 600000;
      deliveryLog.nextAttemptAt = new Date(Date.now() + backoffMs);
      deliveryLog.status = 'pending';
      deliveryLog.lockedUntil = null;
    }
  }

  deliveryLog.httpStatus = httpStatus;
  deliveryLog.lastError = errorMsg || null;
  deliveryLog.durationMs = Date.now() - startTime;
  
  await deliveryLog.save();
}

function sendWebhookRequest(url: string, payload: string, eventName: string, deliveryId: string, timestamp: string, signature: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      timeout: REQUEST_TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'X-Blastup-Event': eventName,
        'X-Blastup-Delivery': deliveryId,
        'X-Blastup-Timestamp': timestamp,
        'X-Blastup-Signature': signature,
      },
    };

    const req = https.request(options, (res) => {
      resolve(res.statusCode || 0);
      res.on('data', () => {}); // consume data to free memory
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}
