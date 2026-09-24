import mongoose, { Document, Model, Schema } from 'mongoose';

export type NotificationEventStatus =
  | 'processing'
  | 'sent'
  | 'failed'
  | 'skipped';

export interface INotificationEventLog extends Document {
  clientId: mongoose.Types.ObjectId;
  apiKeyId?: mongoose.Types.ObjectId;
  event: string;
  eventId: string;
  status: NotificationEventStatus;
  messageLogId?: mongoose.Types.ObjectId | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  
  // Phase 9A-7 Outbox Fields
  recipient?: string;
  variables?: Record<string, any>;
  attempts: number;
  lockedUntil?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const notificationEventLogSchema = new Schema<INotificationEventLog>(
  {
    apiKeyId: { type: Schema.Types.ObjectId, ref: 'ApiKey', required: false, index: true },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },

    event: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 100,
      index: true,
    },

    eventId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      index: true,
    },

    status: {
      type: String,
      enum: ['processing', 'sent', 'failed', 'skipped'],
      required: true,
      default: 'processing',
      index: true,
    },

    messageLogId: {
      type: Schema.Types.ObjectId,
      ref: 'MessageLog',
      default: null,
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

    // Phase 9A-7 Outbox Fields
    recipient: {
      type: String,
      required: false,
    },
    
    variables: {
      type: Schema.Types.Mixed,
      default: {},
    },

    attempts: {
      type: Number,
      default: 0,
    },

    lockedUntil: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'notification_event_logs',
  }
);

notificationEventLogSchema.index(
  { clientId: 1, event: 1, eventId: 1 },
  { unique: true }
);

// Index to quickly find eligible pending outbox tasks
notificationEventLogSchema.index(
  { status: 1, lockedUntil: 1, attempts: 1 }
);

export const NotificationEventLog: Model<INotificationEventLog> =
  mongoose.model<INotificationEventLog>(
    'NotificationEventLog',
    notificationEventLogSchema
  );
