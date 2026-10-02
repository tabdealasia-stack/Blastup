import mongoose, { Schema, Document, Model } from 'mongoose';

export type WebhookDeliveryStatus = 'pending' | 'processing' | 'delivered' | 'failed' | 'exhausted';

export interface IWebhookDeliveryLog extends Document {
  webhookId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  eventId: string; // The client-provided eventId from NotificationEventLog
  event: string; // e.g. 'notification.sent', 'notification.accepted'
  attempt: number;
  status: WebhookDeliveryStatus;
  httpStatus: number | null;
  durationMs: number | null;
  nextAttemptAt: Date | null;
  lastError: string | null;
  lockedUntil: Date | null;
  lockedBy: string | null;
  payloadData: any; // The sanitized data to send
  createdAt: Date;
  updatedAt: Date;
}

const webhookDeliveryLogSchema = new Schema<IWebhookDeliveryLog>(
  {
    webhookId: {
      type: Schema.Types.ObjectId,
      ref: 'Webhook',
      required: true,
      index: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    eventId: {
      type: String,
      required: true,
    },
    event: {
      type: String,
      required: true,
    },
    attempt: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'delivered', 'failed', 'exhausted'],
      default: 'pending',
      index: true,
    },
    httpStatus: {
      type: Number,
      default: null,
    },
    durationMs: {
      type: Number,
      default: null,
    },
    nextAttemptAt: {
      type: Date,
      default: null,
      index: true,
    },
    lastError: {
      type: String,
      default: null,
    },
    lockedUntil: {
      type: Date,
      default: null,
      index: true,
    },
    lockedBy: {
      type: String,
      default: null,
    },
    payloadData: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'webhook_delivery_logs',
  }
);

// Unique index to prevent duplicate queueing of the same event state for the same webhook
webhookDeliveryLogSchema.index({ webhookId: 1, eventId: 1, event: 1 }, { unique: true });
webhookDeliveryLogSchema.index({ clientId: 1, createdAt: -1 });

export const WebhookDeliveryLog: Model<IWebhookDeliveryLog> = mongoose.model<IWebhookDeliveryLog>(
  'WebhookDeliveryLog',
  webhookDeliveryLogSchema
);
