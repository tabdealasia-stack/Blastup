import { Request, Response } from 'express';
import Boom from '@hapi/boom';
import { z } from 'zod';
import { MessageLog } from '../models/MessageLog';
import { NotificationEventLog } from '../models/NotificationEventLog';
import { Client } from '../models/Client';
import { AuthRequest } from '../middleware/auth';

const logQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const messageLogQuerySchema = logQuerySchema.extend({
  search: z.string().optional(), // searches 'to'
});

const eventLogQuerySchema = logQuerySchema.extend({
  event: z.string().optional(),
  search: z.string().optional(), // searches event or eventId
});

const getClient = async (userId: string) => {
  const client = await Client.findOne({ userId }).lean();
  if (!client) {
    throw Boom.notFound('Client not found');
  }
  return client;
};

export const getClientEventLogs = async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) throw Boom.unauthorized('Authentication required');
  
  const client = await getClient(req.user.id);
  const query = eventLogQuerySchema.parse(req.query);

  const filter: any = { clientId: client._id };

  if (query.status) filter.status = query.status;
  if (query.event) filter.event = query.event;

  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
  }

  if (query.search) {
    filter.$or = [
      { event: { $regex: query.search, $options: 'i' } },
      { eventId: { $regex: query.search, $options: 'i' } }
    ];
  }

  const skip = (query.page - 1) * query.limit;

  const [logs, total] = await Promise.all([
    NotificationEventLog.find(filter)
      .select('-variables -lockedUntil')
      .populate('messageLogId', 'status to providerMessageId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit)
      .lean(),
    NotificationEventLog.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: logs,
    pagination: {
      total,
      page: query.page,
      limit: query.limit,
      pages: Math.ceil(total / query.limit)
    }
  });
};

export const getClientMessageLogs = async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) throw Boom.unauthorized('Authentication required');
  
  const client = await getClient(req.user.id);
  const query = messageLogQuerySchema.parse(req.query);

  const filter: any = { clientId: client._id };

  if (query.status) filter.status = query.status;

  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
  }

  if (query.search) {
    filter.to = { $regex: query.search, $options: 'i' };
  }

  const skip = (query.page - 1) * query.limit;

  const [logs, total] = await Promise.all([
    MessageLog.find(filter)
      .select('to status messageType messagePreview eventId providerMessageId errorCode errorMessage createdAt sentAt deliveredAt updatedAt')
      .populate('templateId', 'name event')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit)
      .lean(),
    MessageLog.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: logs,
    pagination: {
      total,
      page: query.page,
      limit: query.limit,
      pages: Math.ceil(total / query.limit)
    }
  });
};

export const getClientDashboardMetrics = async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) throw Boom.unauthorized('Authentication required');
  
  const client = await getClient(req.user.id);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    eventsToday,
    sentToday,
    failedToday,
    queuedToday,
    skippedEventsToday,
    duplicateEventsToday
  ] = await Promise.all([
    NotificationEventLog.countDocuments({ clientId: client._id, createdAt: { $gte: today } }),
    MessageLog.countDocuments({ clientId: client._id, createdAt: { $gte: today }, status: 'sent' }),
    MessageLog.countDocuments({ clientId: client._id, createdAt: { $gte: today }, status: 'failed' }),
    MessageLog.countDocuments({ clientId: client._id, createdAt: { $gte: today }, status: 'queued' }),
    NotificationEventLog.countDocuments({ clientId: client._id, createdAt: { $gte: today }, status: 'skipped' }),
    NotificationEventLog.countDocuments({ clientId: client._id, createdAt: { $gte: today }, status: 'skipped', errorMessage: /duplicate/i })
  ]);

  res.json({
    success: true,
    data: {
      eventsToday,
      sentToday,
      failedToday,
      queuedToday,
      skippedEventsToday,
      duplicateEventsToday
    }
  });
};
