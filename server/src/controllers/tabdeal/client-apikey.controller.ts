import { Request, Response, NextFunction } from 'express';
import { Client } from '../../models/Client';
import { ApiKey } from '../../models/ApiKey';
import { hashToken } from '../../utils/crypto';
import crypto from 'crypto';
import Boom from '@hapi/boom';
import { AuthRequest } from '../../middleware/auth';
import { writeLog } from '../../services/log.service';

export async function getClientApiKeys(req: Request, res: Response, next: NextFunction) {
  try {
    const { clientId } = req.params;
    
    const client = await Client.findById(clientId);
    if (!client) throw Boom.notFound('Client not found');

    // Only return safe metadata
    const apiKeys = await ApiKey.find({ clientId: client._id })
      .select('_id name status lastUsedAt createdAt updatedAt keyPrefix')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: apiKeys });
  } catch (err) {
    next(err);
  }
}

export async function createClientApiKey(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { clientId } = req.params;
    const { name } = req.body;

    const client = await Client.findById(clientId);
    if (!client) throw Boom.notFound('Client not found');
    if (client.status !== 'active') throw Boom.badRequest('Client is not active');

    // Generate a secure API key.
    const rawKey = 'wa_' + crypto.randomBytes(24).toString('hex');
    const keyHash = hashToken(rawKey);
    const keyPrefix = rawKey.substring(0, 11);

    const apiKey = await ApiKey.create({
      name: name || 'API Key',
      keyHash,
      keyPrefix,
      clientId: client._id,
      userId: client.userId,
      status: 'active',
    });

    if (req.user?.id) {
      await writeLog({
        level: 'info',
        category: 'system',
        message: `API Key created for Client ${clientId}: ${apiKey.name}`,
        userId: req.user.id,
        ip: req.ip || req.ips[0] || '127.0.0.1',
      });
    }

    // Return the raw API key EXACTLY ONCE
    res.status(201).json({
      success: true,
      message: 'API Key created successfully. Please copy it now as it will not be shown again.',
      data: {
        id: apiKey._id,
        name: apiKey.name,
        apiKey: rawKey,
        keyPrefix: apiKey.keyPrefix,
        status: apiKey.status,
        createdAt: apiKey.createdAt,
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteClientApiKey(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { clientId, keyId } = req.params;

    const client = await Client.findById(clientId);
    if (!client) throw Boom.notFound('Client not found');

    const key = await ApiKey.findOneAndDelete({
      _id: keyId,
      clientId: client._id,
    });

    if (!key) throw Boom.notFound('API Key not found');

    if (req.user?.id) {
      await writeLog({
        level: 'info',
        category: 'system',
        message: `API Key deleted for Client ${clientId}: ${key.name}`,
        userId: req.user.id,
        ip: req.ip || req.ips[0] || '127.0.0.1',
      });
    }

    res.json({
      success: true,
      message: 'API Key deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}
