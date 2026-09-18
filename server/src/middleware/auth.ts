import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Session } from '../models/Session';
import { User } from '../models/User';
import { Client } from '../models/Client';
import { hashToken } from '../utils/crypto';
import { logger } from '../config/logger';
import Boom from '@hapi/boom';

import { ApiKey } from '../models/ApiKey';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
    clientId?: string;
    apiKeyId?: string;
  };
}
export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Check for API Key (Headers)
    const apiKeyHeader =
      req.headers['x-api-key'] ||
      req.headers['authorization']?.replace('Bearer ', '');

    if (apiKeyHeader && typeof apiKeyHeader === 'string') {
      const keyHash = hashToken(apiKeyHeader);

      const apiKeyDoc = await ApiKey.findOne({
        keyHash,
        status: 'active',
      });

      if (apiKeyDoc) {
        // API key must belong to a valid Client.
        const client = await Client.findById(apiKeyDoc.clientId).select(
          '_id userId businessName status'
        );

        if (!client) {
          throw Boom.unauthorized('Client account not found');
        }

        if (client.status !== 'active') {
          throw Boom.forbidden('Client account is not active');
        }

        // Verify the Client's User still exists and is active.
        const user = await User.findById(client.userId).select(
          '_id username role isActive'
        );

        if (!user || !user.isActive) {
          throw Boom.unauthorized('Client user account not found or deactivated');
        }

        // Update lastUsedAt in the background.
        ApiKey.updateOne(
          { _id: apiKeyDoc._id },
          { lastUsedAt: new Date() }
        )
          .exec()
          .catch(() => {});

        // IMPORTANT:
        // Keep User ID here because existing Blastup WhatsApp services
        // use req.user.id as the WhatsApp instanceId.
        req.user = {
  id: user._id.toString(),
  username: `API_KEY_${apiKeyDoc.name}`,
  role: 'api',
  clientId: client._id.toString(),
  apiKeyId: apiKeyDoc._id.toString(),
};

        return next();
      }
    }

    // 2. Fallback to JWT (Cookie)
    const token = req.cookies?.wa_token;

    if (!token) {
      throw Boom.unauthorized(
        'Authentication required (Invalid API Key or missing Session Cookie)'
      );
    }

    // Verify JWT signature and expiry
    let decoded: jwt.JwtPayload;

    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    } catch (err) {
      throw Boom.unauthorized('Invalid or expired token');
    }

    // Verify session exists and is not revoked
    const tokenHash = hashToken(token);

    const session = await Session.findOne({
      tokenHash,
      isRevoked: false,
    });

    if (!session) {
      throw Boom.unauthorized('Session expired or revoked');
    }

    // Load user
    const user = await User.findById(decoded.sub).select(
      'username role isActive'
    );

    if (!user || !user.isActive) {
      throw Boom.unauthorized('User not found or deactivated');
    }

    req.user = {
      id: user._id.toString(),
      username: user.username,
      role: user.role,
    };

    // Track last seen — non-blocking background update
    User.updateOne(
      { _id: user._id },
      { lastSeenAt: new Date() }
    )
      .exec()
      .catch(() => {});

    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
    next(Boom.forbidden('Admin access required'));
    return;
  }

  next();
}

export function requireSuperadmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.user?.role !== 'superadmin') {
    next(Boom.forbidden('Superadmin access required'));
    return;
  }

  next();
}