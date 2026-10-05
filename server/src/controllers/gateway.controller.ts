import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Boom from '@hapi/boom';
import crypto from 'crypto';
import { WebsiteIntegration } from '../models/WebsiteIntegration';
import { decryptWebhookSecret } from '../utils/webhookCrypto';
import { sendNotificationEvent } from '../services/notification-event.service';
import { logger } from '../config/logger';
import { getRedisClient } from '../config/redis';

// Very strict schema for the Minaj enquiry payload
export const publicIntegrationSchema = z.object({
  idempotencyKey: z.string().uuid('Invalid idempotency key').max(36),
  captchaToken: z.string().min(1, 'CAPTCHA token is required').max(10000),
  payload: z.object({
    customer_name: z.string().min(1).max(100),
    company_name: z.string().max(150).optional().default(''),
    designation: z.string().max(100).optional().default(''),
    mobile: z.string().min(10).max(15),
    email: z.string().email().max(254),
    city: z.string().max(100).optional().default(''),
    requirement_type: z.string().max(100).optional().default(''),
    facility_type: z.string().max(100).optional().default(''),
    brief_requirement: z.string().max(1000).optional().default(''),
  }),
}).strict(); // Reject any unknown fields

export async function handleIntegration(req: Request, res: Response, next: NextFunction) {
  try {
    const { integrationId } = req.params;
    const { idempotencyKey, captchaToken, payload } = req.body;

    // 1. Fetch integration
    const integration = await WebsiteIntegration.findOne({ integrationId, status: 'active' });
    
    if (!integration) {
      // Do not reveal whether it exists or is revoked
      throw Boom.forbidden('Integration invalid or revoked');
    }

    // Event Allowlist for Public Gateway
    const allowedEvents = ['internal.enquiry_received'];
    if (!allowedEvents.includes(integration.targetEvent)) {
      throw Boom.forbidden('Configured event is not allowed through the public gateway');
    }

    // 2. Domain Validation (Basic Defense in Depth)
    const origin = req.get('origin');
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

    // 3. Dynamic Rate Limiting (Per-IP and Per-Integration)
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const ipKey = `ratelimit:gateway:ip:${ip}`;
    const intKey = `ratelimit:gateway:int:${integrationId}`;

    const multi = redis.multi();
    multi.incr(ipKey);
    multi.expire(ipKey, 3600); // 1 hour
    multi.incr(intKey);
    multi.expire(intKey, 86400); // 1 day
    
    const limitResults = await multi.exec();
    
    if (limitResults) {
      const ipCount = limitResults[0][1] as number;
      const intCount = limitResults[2][1] as number;
      
      if (ipCount > integration.rateLimitPerIpPerHour || intCount > integration.rateLimitPerDay) {
        throw Boom.tooManyRequests('Rate limit exceeded');
      }
    }

    // 4. Idempotency Check (Redis)
    const idemKey = `idempotency:gateway:${integrationId}:${idempotencyKey}`;
    const isDuplicate = await redis.set(idemKey, '1', 'EX', 86400, 'NX'); // 24h
    if (!isDuplicate) {
      // Prevent double processing, but return success to the browser
      res.status(202).json({ success: true, message: 'Your request has been received.' });
      return;
    }

    // 5. CAPTCHA Attestation
    if (integration.captcha.provider === 'turnstile') {
      const secret = decryptWebhookSecret(integration.captcha.encryptedSecret);
      
      const formData = new URLSearchParams();
      formData.append('secret', secret);
      formData.append('response', captchaToken);

      // If available, pass remoteip to provider
      if (ip !== 'unknown') formData.append('remoteip', ip);

      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: formData,
      });

      const outcome = await verifyRes.json() as any;
      if (!outcome.success) {
        logger.warn('CAPTCHA attestation failed', { integrationId, outcome });
        // Clear idempotency key on failure so they can try again if it was a false negative
        await redis.del(idemKey);
        throw Boom.forbidden('Attestation failed');
      }
    } else {
      await redis.del(idemKey);
      throw Boom.badImplementation('Unsupported CAPTCHA provider');
    }

    // 6. Build the Internal Event
    const eventId = `wig-${Date.now()}-${crypto.randomUUID()}`;

    await integration.populate('clientId');
    const client = integration.clientId as any;
    
    const recipient = client.whatsappNumber;
    if (!recipient) {
      logger.error('Client has no WhatsApp number configured for internal alert', { clientId: client._id });
      throw Boom.badImplementation('Internal configuration error');
    }

    // 7. Dispatch to NotificationService
    // We unconditionally pass through the pipeline. SafeMode will intercept it normally.
    await sendNotificationEvent({
      clientId: client._id.toString(),
      apiKeyId: integration._id.toString(), // Using integration ID to satisfy schema
      event: integration.targetEvent,
      eventId: eventId,
      to: recipient,
      variables: {
        ...payload,
        source: 'website_gateway',
      },
    });

    // 8. Generic Public Success
    res.status(202).json({ success: true, message: 'Your request has been received.' });
  } catch (error) {
    // 9. Generic Public Error
    console.error(error); logger.error('Gateway processing error', { error });
    if (Boom.isBoom(error)) {
      // Only pass public-safe Boom errors to next
      if (error.output.statusCode >= 500) {
        next(Boom.badImplementation('An internal error occurred while processing your request.'));
      } else {
        next(error);
      }
    } else {
      next(Boom.badImplementation('An internal error occurred while processing your request.'));
    }
  }
}
