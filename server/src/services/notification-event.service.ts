import mongoose from 'mongoose';
import Boom from '@hapi/boom';
import { Client } from '../models/Client';
import ClientTemplate from '../models/ClientTemplate';
import { NotificationTemplate } from '../models/NotificationTemplate';
import { WhatsAppAccount } from '../models/WhatsAppAccount';
import { NotificationEventLog } from '../models/NotificationEventLog';

export interface NotificationEventParams {
  clientId: string;
  apiKeyId: string;
  event: string;
  eventId: string;
  to: string;
  variables?: Record<string, any>;
}

export async function sendNotificationEvent(params: NotificationEventParams) {
  const {
    clientId,
    apiKeyId,
    event,
    eventId,
    to,
    variables = {},
  } = params;

  if (!mongoose.isValidObjectId(clientId)) {
    throw Boom.badRequest('Invalid client ID');
  }

  if (!mongoose.isValidObjectId(apiKeyId)) {
    throw Boom.badRequest('Invalid API key ID');
  }

  const normalizedEvent = event.trim().toLowerCase();
  const normalizedEventId = eventId.trim();

  if (!normalizedEvent) {
    throw Boom.badRequest('Event is required');
  }

  if (!normalizedEventId) {
    throw Boom.badRequest('Event ID is required');
  }

  if (!to || !to.trim()) {
    throw Boom.badRequest('Recipient phone number is required');
  }

  const client = await Client.findById(clientId).select('_id status');
  if (!client) {
    throw Boom.notFound('Client not found');
  }
  if (client.status !== 'active') {
    throw Boom.forbidden('Client is not active');
  }

  const account = await WhatsAppAccount.findOne({
    clientId: client._id,
    status: 'connected',
  }).select('_id');
  if (!account) {
    throw Boom.serverUnavailable('WhatsApp is not connected for this client');
  }

  const templateAssignments = await ClientTemplate.find({
    clientId: client._id,
    enabled: true,
  }).select('templateId');
  if (!templateAssignments.length) {
    throw Boom.notFound('No enabled notification templates found');
  }

  const templateIds = templateAssignments.map((a) => a.templateId);
  const template = await NotificationTemplate.findOne({
    _id: { $in: templateIds },
    event: normalizedEvent,
    active: true,
  }).select('_id');

  if (!template) {
    return {
      success: true,
      status: 'skipped',
      reason: 'No active template configured for this event',
    };
  }

  let eventLog = await NotificationEventLog.findOneAndUpdate(
    {
      clientId: client._id,
      event: normalizedEvent,
      eventId: normalizedEventId,
      status: 'failed',
    },
    {
      $set: {
        status: 'processing',
        apiKeyId,
        errorCode: null,
        errorMessage: null,
        recipient: to,
        variables,
        attempts: 0,
        lockedUntil: null,
      },
    },
    { new: true }
  );

  if (!eventLog) {
    try {
      eventLog = await NotificationEventLog.create({
        clientId: client._id,
        event: normalizedEvent,
        eventId: normalizedEventId,
        status: 'processing',
        apiKeyId,
        recipient: to,
        variables,
        attempts: 0,
        lockedUntil: null,
      });
    } catch (error: any) {
      if (error.code === 11000) {
        const duplicateEvent = await NotificationEventLog.findOne({
          clientId: client._id,
          event: normalizedEvent,
          eventId: normalizedEventId,
        });

        if (!duplicateEvent) {
          throw Boom.internal('Race condition creating event log');
        }

        return {
          success: true,
          status: 'duplicate',
          eventLogId: duplicateEvent._id,
          messageLogId: duplicateEvent.messageLogId || null,
        };
      }
      throw error;
    }
  }

  return {
    success: true,
    status: 'accepted',
    eventLogId: eventLog._id,
  };
}

