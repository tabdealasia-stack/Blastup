import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import Boom from '@hapi/boom';
import { WebhookDeliveryLog } from '../models/WebhookDeliveryLog';

export async function getWebhookDeliveryLogs(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) throw Boom.unauthorized();

    // Reusing the same tenant isolation logic as telemetry:
    const { Client } = await import('../models/Client');
    const client = await Client.findOne({ 'users.userId': userId }).select('_id');
    if (!client) throw Boom.notFound('Client not found for user');

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const skip = (page - 1) * limit;
    
    // Optional filters
    const filter: any = { clientId: client._id };
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.event) {
      filter.event = req.query.event;
    }
    if (req.query.webhookId) {
      filter.webhookId = req.query.webhookId;
    }

    const logs = await WebhookDeliveryLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await WebhookDeliveryLog.countDocuments(filter);

    res.json({
      success: true,
      data: logs,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}
