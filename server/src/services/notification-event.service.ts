import mongoose from 'mongoose';
import Boom from '@hapi/boom';
import { Client } from '../models/Client';
import ClientTemplate from '../models/ClientTemplate';
import { NotificationTemplate } from '../models/NotificationTemplate';
import { WhatsAppAccount } from '../models/WhatsAppAccount';
import { NotificationEventLog } from '../models/NotificationEventLog';
import * as messageService from './message.service';

export interface NotificationEventParams {
  clientId: string;
  apiKeyId: string;
  event: string;
  eventId: string;
  to: string;
  variables?: Record<string, string | number | boolean | null | undefined>;
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

  const client = await Client.findById(clientId).select(
    '_id businessName status'
  );

  if (!client) {
    throw Boom.notFound('Client not found');
  }

  if (client.status !== 'active') {
    throw Boom.forbidden('Client is not active');
  }

  const account = await WhatsAppAccount.findOne({
    clientId: client._id,
    status: 'connected',
  }).select('_id instanceId');

  if (!account) {
    throw Boom.serverUnavailable(
      'WhatsApp is not connected for this client'
    );
  }

  const templateAssignments = await ClientTemplate.find({
    clientId: client._id,
    enabled: true,
  }).select('templateId customMessage customVariables');

  if (!templateAssignments.length) {
    throw Boom.notFound('No enabled notification templates found');
  }

  const templateIds = templateAssignments.map(
    (assignment) => assignment.templateId
  );

  const template = await NotificationTemplate.findOne({
    _id: { $in: templateIds },
    event: normalizedEvent,
    active: true,
  }).select('_id message variables');

  if (!template) {
    return {
      success: true,
      status: 'skipped',
      reason: 'No active template configured for this event',
    };
  }

  const assignment = templateAssignments.find(
    (item) => item.templateId.toString() === template._id.toString()
  );

  const messageTemplate =
    assignment?.customMessage?.trim() || template.message;

  const mergedVariables: Record<string, string> = {};

  for (const [key, value] of Object.entries(variables)) {
    if (value !== null && value !== undefined) {
      mergedVariables[key] = String(value);
    }
  }

  if (assignment?.customVariables?.length) {
    for (const value of assignment.customVariables) {
      const separatorIndex = value.indexOf('=');

      if (separatorIndex > 0) {
        const key = value.substring(0, separatorIndex).trim();
        const replacement = value.substring(separatorIndex + 1).trim();

        if (key) {
          mergedVariables[key] = replacement;
        }
      }
    }
  }

  let message = messageTemplate;

  for (const [key, value] of Object.entries(mergedVariables)) {
    message = message
      .replace(new RegExp(`\\{\\{\\s*${escapeRegExp(key)}\\s*\\}\\}`, 'g'), value)
      .replace(new RegExp(`\\{${escapeRegExp(key)}\\}`, 'g'), value);
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
        errorCode: null,
        errorMessage: null,
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

  try {
    const result = await messageService.sendText(account.instanceId, {
      to,
      text: message,
    });

    const messageId = result?.key?.id || null;

    const { MessageLog } = await import('../models/MessageLog');

    const messageLog = await MessageLog.create({
      clientId: client._id,
      apiKeyId,
      whatsappAccountId: account._id,
      to,
      messageType: 'template',
      templateId: template._id,
      messagePreview: message.substring(0, 500),
      status: 'sent',
      providerMessageId: messageId,
      sentAt: new Date(),
    });

    eventLog.status = 'sent';
    eventLog.messageLogId = messageLog._id;
    await eventLog.save();

    return {
      success: true,
      status: 'sent',
      eventLogId: eventLog._id,
      messageLogId: messageLog._id,
      messageId,
    };
      } catch (error: any) {
      // Map SafeModeError to Boom so it gets the correct 429 status and EventLog captures it
      let finalError = error;
      if (error && error.name === 'SafeModeError') {
         const code = error.code;
         const httpStatus = (code === 'F13' || code === 'F15') ? 422 : 429;
         finalError = Boom.boomify(new Error(error.detail || error.message), { statusCode: httpStatus });
         finalError.output.payload.error = 'SafeModeError';
         finalError.output.payload.code = code;
         // Retain original name for fallback
         finalError.name = 'SafeModeError';
      }

      eventLog.status = 'failed';
      eventLog.errorCode =
        (finalError as { output?: { statusCode?: number } })?.output?.statusCode
          ? String(
              (finalError as { output: { statusCode: number } }).output.statusCode
            )
          : 'SEND_FAILED';
      eventLog.errorMessage =
        finalError instanceof Error ? finalError.message : String(finalError);
  
      await eventLog.save();
  
      throw finalError;
    }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


