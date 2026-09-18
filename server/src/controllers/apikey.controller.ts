import { Response, NextFunction } from 'express';
import { ApiKey } from '../models/ApiKey';
import { Client } from '../models/Client';
import { hashToken } from '../utils/crypto';
import crypto from 'crypto';
import Boom from '@hapi/boom';
import { writeLog } from '../services/log.service';
import { AuthRequest } from '../middleware/auth';

export async function createApiKey(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name } = req.body;

    if (!req.user?.id) {
      throw Boom.unauthorized('Authentication required');
    }

    // 1. Resolve the authenticated User to its Client.
    const client = await Client.findOne({
      userId: req.user.id,
    });

    if (!client) {
      throw Boom.notFound('Client account not found');
    }

    if (client.status !== 'active') {
      throw Boom.forbidden('Client account is not active');
    }

    // 2. Generate a secure API key.
    const rawKey = 'wa_' + crypto.randomBytes(24).toString('hex');

    // 3. Store only the hash. Never store the raw key.
    const keyHash = hashToken(rawKey);

    // Safe identifier for dashboards/logs.
    const keyPrefix = rawKey.substring(0, 11);

    const apiKey = await ApiKey.create({
      name,
      keyHash,
      keyPrefix,
      clientId: client._id,
      userId: client.userId,
      status: 'active',
    });

    await writeLog({
      level: 'info',
      category: 'system',
      message: `API Key created: ${name}`,
      userId: req.user.id,
      ip: req.ip || req.ips[0],
    });

    // Raw key is returned ONLY ONCE.
    res.status(201).json({
      success: true,
      message:
        'API Key created successfully. Please copy it now as it will not be shown again.',
      data: {
        id: apiKey._id,
        name: apiKey.name,
        key: rawKey,
        keyPrefix: apiKey.keyPrefix,
        clientId: apiKey.clientId,
        status: apiKey.status,
        createdAt: apiKey.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function listApiKeys(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.id) {
      throw Boom.unauthorized('Authentication required');
    }

    const client = await Client.findOne({
      userId: req.user.id,
    }).select('_id');

    if (!client) {
      throw Boom.notFound('Client account not found');
    }

    const keys = await ApiKey.find({
      clientId: client._id,
    })
      .select('-key -keyHash')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: keys,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteApiKey(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.id) {
      throw Boom.unauthorized('Authentication required');
    }

    const { id } = req.params;

    const client = await Client.findOne({
      userId: req.user.id,
    }).select('_id');

    if (!client) {
      throw Boom.notFound('Client account not found');
    }

    const key = await ApiKey.findOneAndDelete({
      _id: id,
      clientId: client._id,
    });

    if (!key) {
      throw Boom.notFound('API Key not found');
    }

    await writeLog({
      level: 'info',
      category: 'system',
      message: `API Key deleted: ${key.name}`,
      userId: req.user.id,
      ip: req.ip || req.ips[0],
    });

    res.json({
      success: true,
      message: 'API Key deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}