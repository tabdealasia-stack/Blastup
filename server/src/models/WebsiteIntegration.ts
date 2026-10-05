import mongoose, { Schema, Document, Model } from 'mongoose';

export type WebsiteIntegrationStatus = 'active' | 'revoked';

export interface IWebsiteIntegration extends Document {
  integrationId: string;
  clientId: mongoose.Types.ObjectId;
  name: string;
  targetEvent: string;
  allowedDomains: string[];
  captcha: {
    provider: string; // e.g. 'turnstile'
    siteKey: string;
    encryptedSecret: string;
  };
  rateLimitPerIpPerHour: number;
  rateLimitPerDay: number;
  status: WebsiteIntegrationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const websiteIntegrationSchema = new Schema<IWebsiteIntegration>(
  {
    integrationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
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
      maxlength: 150,
    },
    targetEvent: {
      type: String,
      required: true,
      trim: true,
    },
    allowedDomains: {
      type: [String],
      required: true,
    },
    captcha: {
      provider: { type: String, required: true },
      siteKey: { type: String, required: true },
      encryptedSecret: { type: String, required: true },
    },
    rateLimitPerIpPerHour: {
      type: Number,
      required: true,
      default: 5,
    },
    rateLimitPerDay: {
      type: Number,
      required: true,
      default: 50,
    },
    status: {
      type: String,
      enum: ['active', 'revoked'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'website_integrations',
  }
);

export const WebsiteIntegration: Model<IWebsiteIntegration> = mongoose.model<IWebsiteIntegration>(
  'WebsiteIntegration',
  websiteIntegrationSchema
);
