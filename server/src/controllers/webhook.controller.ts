import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import Boom from '@hapi/boom';
import { Webhook } from '../models/Webhook';
import { Client } from '../models/Client';
import { Log } from '../models/Log';
import { validateWebhookUrl, SSRFError } from '../utils/ssrf';
import { encryptWebhookSecret, generateWebhookSecret, generateWebhookSignature } from '../utils/webhookCrypto';
import mongoose from 'mongoose';

const ALLOWED_EVENTS = ['notification.accepted', 'notification.sent', 'notification.failed', 'notification.skipped'];

export async function createWebhook(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { clientId } = req.params;
    const { name, url, events, enabled } = req.body;

    if (!mongoose.isValidObjectId(clientId)) throw Boom.badRequest('Invalid client ID');
    if (!name || !name.trim()) throw Boom.badRequest('Name is required');
    if (!url || !url.trim()) throw Boom.badRequest('URL is required');
    if (!Array.isArray(events) || events.length === 0) throw Boom.badRequest('At least one event must be selected');

    for (const e of events) {
      if (!ALLOWED_EVENTS.includes(e)) throw Boom.badRequest(`Invalid event: ${e}`);
    }

    const client = await Client.findById(clientId);
    if (!client || client.status !== 'active') throw Boom.notFound('Client not found or inactive');

    try {
      await validateWebhookUrl(url);
    } catch (err: any) {
      if (err instanceof SSRFError) throw Boom.badRequest(err.message);
      throw err;
    }

    const rawSecret = generateWebhookSecret();
    const encryptedSecret = encryptWebhookSecret(rawSecret);

    const webhook = new Webhook({
      clientId: client._id,
      name,
      url,
      events,
      enabled: !!enabled,
      encryptedSecret,
      secretVersion: 1,
    });

    await webhook.save();

    await Log.create({
      level: 'info',
      category: 'security',
      message: 'Webhook created',
      meta: { clientId, webhookId: webhook._id },
      userId: req.user?.id || null,
    });

    res.status(201).json({
      success: true,
      data: {
        _id: webhook._id,
        clientId: webhook.clientId,
        name: webhook.name,
        url: webhook.url,
        enabled: webhook.enabled,
        events: webhook.events,
        secret: rawSecret, // Returned ONLY ONCE
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getWebhooks(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { clientId } = req.params;
    if (!mongoose.isValidObjectId(clientId)) throw Boom.badRequest('Invalid client ID');

    const webhooks = await Webhook.find({ clientId }).select('-encryptedSecret');
    res.json({ success: true, data: webhooks });
  } catch (err) {
    next(err);
  }
}

export async function updateWebhook(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { clientId, webhookId } = req.params;
    const { name, url, events, enabled } = req.body;

    if (!mongoose.isValidObjectId(clientId)) throw Boom.badRequest('Invalid client ID');
    if (!mongoose.isValidObjectId(webhookId)) throw Boom.badRequest('Invalid webhook ID');

    const webhook = await Webhook.findOne({ _id: webhookId, clientId });
    if (!webhook) throw Boom.notFound('Webhook not found');

    if (name) webhook.name = name;
    if (enabled !== undefined) webhook.enabled = !!enabled;

    if (events) {
      if (!Array.isArray(events) || events.length === 0) throw Boom.badRequest('At least one event must be selected');
      for (const e of events) {
        if (!ALLOWED_EVENTS.includes(e)) throw Boom.badRequest(`Invalid event: ${e}`);
      }
      webhook.events = events;
    }

    if (url) {
      try {
        await validateWebhookUrl(url);
      } catch (err: any) {
        if (err instanceof SSRFError) throw Boom.badRequest(err.message);
        throw err;
      }
      webhook.url = url;
    }

    await webhook.save();

    await Log.create({
      level: 'info',
      category: 'security',
      message: 'Webhook updated',
      meta: { clientId, webhookId: webhook._id },
      userId: req.user?.id || null,
    });

    const safeWebhook = webhook.toObject();
    delete (safeWebhook as any).encryptedSecret;

    res.json({ success: true, data: safeWebhook });
  } catch (err) {
    next(err);
  }
}

export async function rotateWebhookSecret(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { clientId, webhookId } = req.params;

    if (!mongoose.isValidObjectId(clientId)) throw Boom.badRequest('Invalid client ID');
    if (!mongoose.isValidObjectId(webhookId)) throw Boom.badRequest('Invalid webhook ID');

    const webhook = await Webhook.findOne({ _id: webhookId, clientId });
    if (!webhook) throw Boom.notFound('Webhook not found');

    const rawSecret = generateWebhookSecret();
    const encryptedSecret = encryptWebhookSecret(rawSecret);

    webhook.encryptedSecret = encryptedSecret;
    webhook.secretVersion += 1;
    await webhook.save();

    await Log.create({
      level: 'info',
      category: 'security',
      message: 'Webhook secret rotated',
      meta: { clientId, webhookId: webhook._id, version: webhook.secretVersion },
      userId: req.user?.id || null,
    });

    res.json({
      success: true,
      data: {
        secret: rawSecret, // Returned ONLY ONCE
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function testWebhook(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { clientId, webhookId } = req.params;

    if (!mongoose.isValidObjectId(clientId)) throw Boom.badRequest('Invalid client ID');
    if (!mongoose.isValidObjectId(webhookId)) throw Boom.badRequest('Invalid webhook ID');

    const webhook = await Webhook.findOne({ _id: webhookId, clientId });
    if (!webhook) throw Boom.notFound('Webhook not found');

    // Validation-only behavior as requested
    try {
      await validateWebhookUrl(webhook.url);
    } catch (err: any) {
      if (err instanceof SSRFError) throw Boom.badRequest(`Test validation failed: ${err.message}`);
      throw err;
    }
    
    // Test signing works without crashing
    const dummyPayload = JSON.stringify({ test: true });
    const timestamp = Math.floor(Date.now() / 1000).toString();
    try {
      generateWebhookSignature('dummy_secret_test', timestamp, dummyPayload);
    } catch (err: any) {
      throw Boom.internal(`Signature generation failed: ${err.message}`);
    }

    res.json({
      success: true,
      message: 'Webhook configuration and signature generation validated successfully. (No external delivery performed)',
    });
  } catch (err) {
    next(err);
  }
}
