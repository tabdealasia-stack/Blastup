import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Boom from '@hapi/boom';
import crypto from 'crypto';
import { WebsiteIntegration } from '../models/WebsiteIntegration';
import { decryptWebhookSecret } from '../utils/webhookCrypto';
import { sendNotificationEvent } from '../services/notification-event.service';
import { logger } from '../config/logger';
import { getRedisClient } from '../config/redis';
import {
  createWhatsAppChallenge,
  getChallengeStatus,
  isPhoneMatch,
} from '../services/whatsapp-verification.service';

export const publicIntegrationSchema = z.object({
  idempotencyKey: z.string().uuid('Invalid idempotency key').max(36),
  verificationToken: z.string().optional(),
  captchaToken: z.string().min(1, 'CAPTCHA token is required').max(10000),
  payload: z.object({
    customer_name: z.string().min(1).max(100),
    company_name: z.string().max(150).optional().default(''),
    designation: z.string().max(100).optional().default(''),
    mobile: z.string().min(10).max(15),
    email: z.union([
      z.string().email().max(254),
      z.literal(''),
    ]).optional().default(''),
    city: z.string().max(100).optional().default(''),
    requirement_type: z.string().max(100).optional().default(''),
    facility_type: z.string().max(100).optional().default(''),
    brief_requirement: z.string().max(1000).optional().default(''),
  }),
}).strict();

export const challengeRequestSchema = z.object({
  captchaToken: z.string().min(1, 'CAPTCHA token is required').max(10000),
}).strict();

export async function createWhatsAppChallengeHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { integrationId } = req.params;
    const { captchaToken } = challengeRequestSchema.parse(req.body);
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const origin = req.get('origin') || req.get('referer');

    const result = await createWhatsAppChallenge({
      integrationId,
      ip,
      captchaToken,
      origin,
    });

    res.json(result);
  } catch (error) {
    if (Boom.isBoom(error)) {
      if (error.output.statusCode >= 500) next(Boom.badImplementation(error.message));
      else next(error);
    } else {
      next(error);
    }
  }
}

export async function getWhatsAppChallengeStatusHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { integrationId, challengeId } = req.params;
    const pollToken = String(req.headers['x-poll-token'] || req.query.pollToken || '');
    if (!pollToken) {
      throw Boom.badRequest('Missing poll token');
    }
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';

    const result = await getChallengeStatus({
      integrationId,
      challengeId,
      pollToken,
      ip,
    });

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.json(result);
  } catch (error) {
    if (Boom.isBoom(error)) {
      if (error.output.statusCode >= 500) next(Boom.badImplementation(error.message));
      else next(error);
    } else {
      next(error);
    }
  }
}

export async function handleIntegration(req: Request, res: Response, next: NextFunction) {
  let inProgressIdemKey: string | null = null;
  try {
    const { integrationId } = req.params;
    const { idempotencyKey, captchaToken, verificationToken, payload } = req.body;

    const integration = await WebsiteIntegration.findOne({ integrationId, status: 'active' });
    if (!integration) throw Boom.forbidden('Integration invalid or revoked');

    const allowedEvents = ['internal.enquiry_received'];
    if (!allowedEvents.includes(integration.targetEvent)) {
      throw Boom.forbidden('Configured event is not allowed through the public gateway');
    }

    const origin = req.get('origin') || req.get('referer');
    if (origin) {
      try {
        const originUrl = new URL(origin);
        if (!integration.allowedDomains.includes(originUrl.hostname) && !integration.allowedDomains.includes('*')) {
          throw Boom.forbidden('Origin not allowed');
        }
      } catch (e) {
        throw Boom.forbidden('Origin not allowed');
      }
    }

    const redis = getRedisClient();

    // 1. Idempotency Check with Deterministic Payload Hash Binding
    // Scoped strictly per-integration to prevent collision across integrations
    const payloadHash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    const idemKey = `idempotency:gateway:${integrationId}:${idempotencyKey}`;
    const existingIdemRaw = typeof redis.get === 'function' ? await redis.get(idemKey) : null;
    if (existingIdemRaw) {
      let existingIdem: any;
      try {
        existingIdem = JSON.parse(existingIdemRaw);
      } catch {
        existingIdem = { payloadHash, status: 'completed' };
      }

      // Reject if same idempotency key is used with a different request payload
      if (existingIdem.payloadHash && existingIdem.payloadHash !== payloadHash) {
        throw Boom.conflict('Idempotency key already used with a different request payload');
      }

      // If previously completed, return cached response safely without re-processing
      if (existingIdem.status === 'completed') {
        res.status(202).json(existingIdem.response || { success: true, message: 'Your request has been received.' });
        return;
      }

      // If still in progress, prevent concurrent duplicate execution
      if (existingIdem.status === 'in_progress') {
        throw Boom.conflict('Concurrent request in progress with the same idempotency key');
      }
    }

    // 2. Rate Limiting Check (IP & Integration)
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const ipKey = 'ratelimit:gateway:ip:' + ip;
    const intKey = 'ratelimit:gateway:int:' + integrationId;

    const multi = redis.multi();
    multi.incr(ipKey);
    multi.expire(ipKey, 3600);
    multi.incr(intKey);
    multi.expire(intKey, 86400);

    const limitResults = await multi.exec();
    if (limitResults) {
      const ipCount = limitResults[0][1] as number;
      const intCount = limitResults[2][1] as number;
      if (ipCount > integration.rateLimitPerIpPerHour || intCount > integration.rateLimitPerDay) {
        throw Boom.tooManyRequests('Rate limit exceeded');
      }
    }

    // 3. Cloudflare Turnstile Attestation Validation
    if (integration.captcha.provider === 'turnstile') {
      const secret = decryptWebhookSecret(integration.captcha.encryptedSecret);
      const formData = new URLSearchParams();
      formData.append('secret', secret);
      formData.append('response', captchaToken);
      if (ip !== 'unknown') formData.append('remoteip', ip as string);

      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: formData,
      });
      const outcome = (await verifyRes.json()) as any;
      if (!outcome.success) {
        logger.warn('CAPTCHA attestation failed', { integrationId, outcome });
        throw Boom.forbidden('Attestation failed');
      }
    } else {
      throw Boom.badImplementation('Unsupported CAPTCHA provider');
    }

    // 4. WhatsApp Verification Token Check & Atomic Consumption
    const isVerificationRequired =
      integration.verificationMethod === 'whatsapp_inbound' ||
      (integration.requiresMobileVerification && integration.verificationMethod !== 'none');

    if (isVerificationRequired) {
      if (!verificationToken) {
        throw Boom.forbidden('Please verify your mobile number via WhatsApp before submitting the enquiry.');
      }
      const vtKey = 'otp:verified:' + integrationId + ':' + verificationToken;

      // Check current token in Redis to verify mobile match before consuming
      const currentVerifiedMobile = await redis.get(vtKey);
      if (!currentVerifiedMobile) {
        throw Boom.forbidden('Invalid or expired verification token. Please verify via WhatsApp again.');
      }

      if (!isPhoneMatch(payload.mobile, currentVerifiedMobile)) {
        throw Boom.forbidden('Submitted mobile number does not match verified WhatsApp number.');
      }

      // Atomically consume token via getdel
      const consumedMobile = await redis.getdel(vtKey);
      if (!consumedMobile) {
        throw Boom.conflict('Verification token was already consumed by a concurrent request.');
      }
    }

    // 5. Acquire In-Progress Idempotency Lock
    inProgressIdemKey = idemKey;
    await redis.set(
      idemKey,
      JSON.stringify({ payloadHash, status: 'in_progress' }),
      'EX',
      300
    );

    // 6. Downstream Notification & Event Dispatch
    const eventId = 'wig-' + Date.now() + '-' + crypto.randomUUID();

    await integration.populate('clientId');
    const client = integration.clientId as any;

    const recipient = client.whatsappNumber;
    if (!recipient) {
      logger.error('Client has no WhatsApp number configured for internal alert', { clientId: client?._id });
      throw Boom.badImplementation('Internal configuration error');
    }

    await sendNotificationEvent({
      clientId: client._id.toString(),
      apiKeyId: integration._id.toString(),
      event: integration.targetEvent,
      eventId: eventId,
      to: recipient,
      variables: {
        ...payload,
        source: 'website_gateway',
      },
    });

    const successResponse = { success: true, message: 'Your request has been received.' };

    // Finalize idempotency record as completed with 24h TTL
    await redis.set(
      idemKey,
      JSON.stringify({ payloadHash, status: 'completed', response: successResponse }),
      'EX',
      86400
    );
    inProgressIdemKey = null;

    res.status(202).json(successResponse);
  } catch (error) {
    if (inProgressIdemKey) {
      try {
        const redis = getRedisClient();
        await redis.del(inProgressIdemKey);
      } catch (delErr) {
        logger.warn('Failed to clean in-progress idempotency key', { error: String(delErr) });
      }
    }
    if (Boom.isBoom(error)) {
      if (error.output.statusCode >= 500) next(Boom.badImplementation(error.message));
      else next(error);
    } else {
      console.log('UNHANDLED ERROR', error);
      next(error);
    }
  }
}