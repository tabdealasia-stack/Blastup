import { Request, Response, NextFunction } from 'express';
import ClientTemplate from '../models/ClientTemplate';
import { Client } from '../models/Client';
import Boom from '@hapi/boom';
import { AuthRequest } from '../middleware/auth';

export async function getMyClientTemplates(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) throw Boom.unauthorized('User not authenticated');

    const client = await Client.findOne({ userId });
    if (!client) throw Boom.unauthorized('Client profile not found');
    if (client.status !== 'active') throw Boom.forbidden('Client is not active');

    const { enabled, page = 1, limit = 50 } = req.query;

    const query: any = { clientId: client._id };
    if (enabled !== undefined) query.enabled = enabled === 'true';

    const skip = (Number(page) - 1) * Number(limit);
    
    const clientTemplates = await ClientTemplate.find(query)
      .populate('templateId', 'name event message variables active')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await ClientTemplate.countDocuments(query);

    res.json({
      success: true,
      data: clientTemplates,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      }
    });
  } catch (err) {
    next(err);
  }
}
