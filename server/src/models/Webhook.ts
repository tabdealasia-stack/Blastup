import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWebhook extends Document {
  clientId: mongoose.Types.ObjectId;
  name: string;
  url: string;
  enabled: boolean;
  events: string[];
  encryptedSecret: string;
  secretVersion: number;
  timeoutMs: number;
  maxAttempts: number;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const webhookSchema = new Schema<IWebhook>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    enabled: {
      type: Boolean,
      default: false,
    },
    events: {
      type: [String],
      required: true,
      default: [],
    },
    encryptedSecret: {
      type: String,
      required: true,
    },
    secretVersion: {
      type: Number,
      required: true,
      default: 1,
    },
    timeoutMs: {
      type: Number,
      default: 5000,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    createdBy: {
      type: String,
      default: null,
    },
    updatedBy: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'webhooks',
  }
);

webhookSchema.index({ clientId: 1, enabled: 1 });

export const Webhook: Model<IWebhook> = mongoose.model<IWebhook>('Webhook', webhookSchema);
