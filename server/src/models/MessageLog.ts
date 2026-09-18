import mongoose, { Schema, Document, Model } from 'mongoose';

export type MessageStatus =
  | 'queued'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'failed';

export type MessageType = 'text' | 'template';

export interface IMessageLog extends Document {
  clientId: mongoose.Types.ObjectId;
  apiKeyId: mongoose.Types.ObjectId;
  whatsappAccountId?: mongoose.Types.ObjectId | null;

  to: string;
  messageType: MessageType;
  templateId?: mongoose.Types.ObjectId | null;

  // Store only a limited preview, not unnecessary sensitive content.
  messagePreview?: string | null;

  status: MessageStatus;

  providerMessageId?: string | null;

  errorCode?: string | null;
  errorMessage?: string | null;

  createdAt: Date;
  sentAt?: Date | null;
  deliveredAt?: Date | null;
  updatedAt: Date;
}

const messageLogSchema = new Schema<IMessageLog>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },

    apiKeyId: {
      type: Schema.Types.ObjectId,
      ref: 'ApiKey',
      required: true,
      index: true,
    },

    whatsappAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'WhatsAppAccount',
      default: null,
      index: true,
    },

    to: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
      index: true,
    },

    messageType: {
      type: String,
      enum: ['text', 'template'],
      required: true,
      index: true,
    },

    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'NotificationTemplate',
      default: null,
      index: true,
    },

    messagePreview: {
      type: String,
      default: null,
      maxlength: 500,
    },

    status: {
      type: String,
      enum: ['queued', 'sending', 'sent', 'delivered', 'failed'],
      required: true,
      default: 'queued',
      index: true,
    },

    providerMessageId: {
      type: String,
      default: null,
      index: true,
    },

    errorCode: {
      type: String,
      default: null,
      maxlength: 100,
    },

    errorMessage: {
      type: String,
      default: null,
      maxlength: 500,
    },

    sentAt: {
      type: Date,
      default: null,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'message_logs',
  }
);

// Common query pattern for client dashboards/API.
messageLogSchema.index({ clientId: 1, createdAt: -1 });

// Useful for status/history queries.
messageLogSchema.index({ clientId: 1, status: 1, createdAt: -1 });

export const MessageLog: Model<IMessageLog> = mongoose.model<IMessageLog>(
  'MessageLog',
  messageLogSchema
);