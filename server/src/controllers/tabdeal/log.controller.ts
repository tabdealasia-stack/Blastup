import { Request, Response } from 'express';
import Boom from '@hapi/boom';
import { z } from 'zod';
import { MessageLog } from '../../models/MessageLog';
import { NotificationEventLog } from '../../models/NotificationEventLog';
import { Client } from '../../models/Client';

// Schema for list queries
const logQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  clientId: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const messageLogQuerySchema = logQuerySchema.extend({
  messageType: z.string().optional(),
  templateId: z.string().optional(),
  search: z.string().optional(), // searches 'to' or 'providerMessageId'
});

const eventLogQuerySchema = logQuerySchema.extend({
  event: z.string().optional(),
  eventId: z.string().optional(),
  search: z.string().optional(), // searches event or eventId
});

export const getMessageLogs = async (req: Request, res: Response) => {
  const query = messageLogQuerySchema.parse(req.query);

  const filter: any = {};

  if (query.clientId) filter.clientId = query.clientId;
  if (query.status) filter.status = query.status;
  if (query.messageType) filter.messageType = query.messageType;
  if (query.templateId) filter.templateId = query.templateId;

  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
  }

  if (query.search) {
    filter.$or = [
      { to: { $regex: query.search, $options: 'i' } },
      { providerMessageId: { $regex: query.search, $options: 'i' } }
    ];
  }

  const skip = (query.page - 1) * query.limit;

  const [logs, total] = await Promise.all([
    MessageLog.find(filter)
      .populate('clientId', 'businessName slug')
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

export const getMessageLog = async (req: Request, res: Response) => {
  const log = await MessageLog.findById(req.params.id)
    .populate('clientId', 'businessName slug')
    .populate('templateId', 'name event')
    .populate('whatsappAccountId', 'status phoneNumber')
    .populate('apiKeyId', 'name keyPrefix')
    .lean();

  if (!log) {
    throw Boom.notFound('Message log not found');
  }

  res.json({ success: true, data: log });
};

export const getEventLogs = async (req: Request, res: Response) => {
  const query = eventLogQuerySchema.parse(req.query);

  const filter: any = {};

  if (query.clientId) filter.clientId = query.clientId;
  if (query.status) filter.status = query.status;
  if (query.event) filter.event = query.event;
  if (query.eventId) filter.eventId = query.eventId;

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
      .populate('clientId', 'businessName slug')
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

export const getEventLog = async (req: Request, res: Response) => {
  const log = await NotificationEventLog.findById(req.params.id)
    .populate('clientId', 'businessName slug')
    .populate('messageLogId')
    .lean();

  if (!log) {
    throw Boom.notFound('Event log not found');
  }

  res.json({ success: true, data: log });
};

export const getDashboardMetrics = async (req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    eventsToday,
    sentToday,
    failedToday,
    queuedToday,
    skippedEventsToday,
    duplicateEventsToday, // Assuming duplicate events are blocked, but maybe they are marked 'skipped' with 'Duplicate event' error. Let's count 'skipped' + Duplicate
    totalActiveClients
  ] = await Promise.all([
    NotificationEventLog.countDocuments({ createdAt: { $gte: today } }),
    MessageLog.countDocuments({ createdAt: { $gte: today }, status: 'sent' }),
    MessageLog.countDocuments({ createdAt: { $gte: today }, status: 'failed' }),
    MessageLog.countDocuments({ createdAt: { $gte: today }, status: 'queued' }),
    NotificationEventLog.countDocuments({ createdAt: { $gte: today }, status: 'skipped' }),
    NotificationEventLog.countDocuments({ createdAt: { $gte: today }, status: 'skipped', errorMessage: /duplicate/i }),
    Client.countDocuments({ status: 'active' })
  ]);

  res.json({
    success: true,
    data: {
      eventsToday,
      sentToday,
      failedToday,
      queuedToday,
      skippedEventsToday,
      duplicateEventsToday,
      totalActiveClients
    }
  });
};
