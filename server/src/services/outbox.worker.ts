import mongoose from 'mongoose';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { NotificationEventLog, INotificationEventLog } from '../models/NotificationEventLog';
import { Client } from '../models/Client';
import ClientTemplate from '../models/ClientTemplate';
import { NotificationTemplate } from '../models/NotificationTemplate';
import { WhatsAppAccount } from '../models/WhatsAppAccount';
import { MessageLog } from '../models/MessageLog';
import * as messageService from './message.service';
import Boom from '@hapi/boom';

let workerInterval: NodeJS.Timeout | null = null;
let isShuttingDown = false;

// Config
const POLL_INTERVAL_MS = 10000;
const LEASE_DURATION_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 3;

// Environment flag for safety
const OUTBOX_WORKER_ENABLED = process.env.OUTBOX_WORKER_ENABLED !== 'false'; // Enabled by default unless explicitly disabled

export function initOutboxWorker() {
  if (!OUTBOX_WORKER_ENABLED) {
    logger.info('OutboxWorker is disabled via OUTBOX_WORKER_ENABLED');
    return;
  }
  
  if (workerInterval) return;
  
  logger.info('Starting MongoDB Durable OutboxWorker');
  workerInterval = setInterval(() => {
    if (!isShuttingDown) {
      pollOutbox().catch((err) => {
        logger.error('OutboxWorker poll error', { error: err.message });
      });
    }
  }, POLL_INTERVAL_MS);
  
  workerInterval.unref();
}

export function stopOutboxWorker() {
  isShuttingDown = true;
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
    logger.info('Stopped OutboxWorker polling');
  }
}

async function pollOutbox() {
  // Find one eligible event atomically and lock it
  const now = new Date();
  
  const eventLog = await NotificationEventLog.findOneAndUpdate(
    {
      status: 'processing',
      attempts: { $lt: MAX_ATTEMPTS },
      $or: [
        { lockedUntil: null },
        { lockedUntil: { $lte: now } } // Stale lease recovery
      ]
    },
    {
      $set: {
        lockedUntil: new Date(now.getTime() + LEASE_DURATION_MS)
      },
      $inc: { attempts: 1 }
    },
    { new: true, sort: { createdAt: 1 } }
  );

  if (!eventLog) return; // Nothing to process

  // Safely skip historical events from Phase 9A live tests that lack recipient payloads
  if (!eventLog.recipient) {
    await NotificationEventLog.updateOne(
      { _id: eventLog._id },
      { 
        $set: { 
          status: 'failed', 
          errorMessage: 'Legacy processing event (missing recipient payload)',
          lockedUntil: null
        } 
      }
    );
    return;
  }

  await processEvent(eventLog);
  
  // Call pollOutbox again immediately to drain queue if we found something
  if (!isShuttingDown) {
    setImmediate(() => pollOutbox().catch(() => {}));
  }
}

async function processEvent(eventLog: INotificationEventLog) {
  try {
    const client = await Client.findById(eventLog.clientId).select('_id status');
    if (!client || client.status !== 'active') {
      throw Boom.notFound('Client not found or inactive');
    }

    const account = await WhatsAppAccount.findOne({
      clientId: client._id,
      status: 'connected',
    }).select('_id instanceId');
    
    if (!account) {
      throw Boom.serverUnavailable('WhatsApp disconnected');
    }

    const templateAssignments = await ClientTemplate.find({
      clientId: client._id,
      enabled: true,
    }).select('templateId customMessage customVariables');
    
    if (!templateAssignments.length) {
      throw Boom.notFound('No enabled templates');
    }

    const templateIds = templateAssignments.map((a) => a.templateId);
    const template = await NotificationTemplate.findOne({
      _id: { $in: templateIds },
      event: eventLog.event,
      active: true,
    }).select('_id message variables');

    if (!template) {
      // Skipped
      await NotificationEventLog.updateOne(
        { _id: eventLog._id },
        { $set: { status: 'skipped', lockedUntil: null, errorMessage: 'No active template configured' } }
      );
      return;
    }

    const assignment = templateAssignments.find(
      (item) => item.templateId.toString() === template._id.toString()
    );

    const messageTemplate = assignment?.customMessage?.trim() || template.message;
    const variables = eventLog.variables || {};
    const mergedVariables: Record<string, string> = {};

    for (const [key, value] of Object.entries(variables)) {
      if (value !== null && value !== undefined) {
        mergedVariables[key] = String(value);
      }
    }

    if (assignment?.customVariables?.length) {
      for (const value of assignment.customVariables) {
        const separatorIndex = value.indexOf('=');
        if (separatorIndex > 0) {
          const key = value.substring(0, separatorIndex).trim();
          const replacement = value.substring(separatorIndex + 1).trim();
          if (key) {
            mergedVariables[key] = replacement;
          }
        }
      }
    }

    let message = messageTemplate;
    for (const [key, value] of Object.entries(mergedVariables)) {
      message = message
        .replace(new RegExp(`\\{\\{\\s*${escapeRegExp(key)}\\s*\\}\\}`, 'g'), value)
        .replace(new RegExp(`\\{${escapeRegExp(key)}\\}`, 'g'), value);
    }

    let messageLog = await MessageLog.findOne({ clientId: client._id, eventId: eventLog.eventId });
    
    if (messageLog) {
      if (messageLog.status === 'sent' || messageLog.status === 'delivered') {
        eventLog.status = 'sent';
        eventLog.messageLogId = messageLog._id;
        eventLog.lockedUntil = null;
        eventLog.errorCode = null;
        eventLog.errorMessage = null;
        await eventLog.save();
        return;
      }
      if (messageLog.status === 'sending' || messageLog.status === 'queued') {
        const e: any = new Error('Worker crashed during previous dispatch attempt. Cannot safely retry without risking duplicates.');
        e.name = 'UncertainStateError';
        throw e;
      }
      
      messageLog.status = 'sending';
      messageLog.templateId = template._id;
      messageLog.messagePreview = message.substring(0, 500);
      await messageLog.save();
    } else {
      messageLog = new MessageLog({
        clientId: client._id,
        apiKeyId: eventLog.apiKeyId,
        whatsappAccountId: account._id,
        to: eventLog.recipient,
        messageType: 'template',
        templateId: template._id,
        messagePreview: message.substring(0, 500),
        status: 'sending',
        eventId: eventLog.eventId,
      });
      await messageLog.save();
    }

    try {
      const result = await messageService.sendText(account.instanceId, {
        to: eventLog.recipient as string,
        text: message,
      });

      const messageId = result?.key?.id || null;

      messageLog.status = 'sent';
      messageLog.providerMessageId = messageId;
      messageLog.sentAt = new Date();
      await messageLog.save();

      eventLog.status = 'sent';
      eventLog.messageLogId = messageLog._id;
      eventLog.lockedUntil = null;
      eventLog.errorCode = null;
      eventLog.errorMessage = null;
      await eventLog.save();

    } catch (dispatchError: any) {
      const isPreDispatchError = dispatchError.name === 'SafeModeError' || 
                                 dispatchError.name === 'ValidationError' || 
                                 dispatchError.isBoom === true;

      if (isPreDispatchError) {
        messageLog.status = 'failed';
        messageLog.errorCode = dispatchError.code || 'SEND_ERROR';
        messageLog.errorMessage = dispatchError.message;
        await messageLog.save().catch(() => {});
        
        throw dispatchError;
      } else {
        const e: any = new Error(`Ambiguous dispatch error: ${dispatchError.message}. Delivery uncertain.`);
        e.name = 'UncertainStateError';
        throw e;
      }
    }

  } catch (error: any) {
    let errorCode = 'SEND_FAILED';
    let isTerminal = false;

    // Map SafeModeError correctly
    if (error && error.name === 'SafeModeError') {
       errorCode = error.code || 'SAFEMODE_REJECTED';
       isTerminal = true; // SafeMode rejections should not be retried infinitely
    } else if (error && error.name === 'UncertainStateError') {
       errorCode = 'UNCERTAIN_STATE';
       isTerminal = true;
    } else if (error && error.name === 'ValidationError') {
         errorCode = 'VALIDATION_FAILED';
         isTerminal = true; // Schema validation errors shouldn't be retried
      } else if (error.isBoom) {
       errorCode = String(error.output.statusCode);
       isTerminal = true; // Validation errors shouldn't be retried
    }

    const maxAttemptsReached = eventLog.attempts >= MAX_ATTEMPTS;

    if (isTerminal || maxAttemptsReached) {
      // Fail permanently
      await NotificationEventLog.updateOne(
        { _id: eventLog._id },
        { 
          $set: { 
            status: 'failed',
            errorCode,
            errorMessage: error.message || String(error),
            lockedUntil: null
          } 
        }
      );

      logger.error('Outbox terminal failure', {
        eventLogId: eventLog._id.toString(),
        clientId: eventLog.clientId.toString(),
        event: eventLog.event,
        errorCode,
        errorMessage: error.message || String(error),
        isTerminal,
        maxAttemptsReached,
        attempts: eventLog.attempts
      });
    } else {
      // Unlock for backoff retry (15s backoff)
      await NotificationEventLog.updateOne(
        { _id: eventLog._id },
        { 
          $set: { 
            lockedUntil: new Date(Date.now() + 15 * 1000)
          } 
        }
      );
    }
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


