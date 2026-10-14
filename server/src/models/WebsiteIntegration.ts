import mongoose, { Schema, Document, Model } from 'mongoose';

export type WebsiteIntegrationStatus = 'active' | 'revoked';
export type VerificationMethod = 'none' | 'whatsapp_inbound';

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
  verificationMethod?: VerificationMethod;
  requiresMobileVerification?: boolean;
  sinkNotification?: boolean;
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
    verificationMethod: {
      type: String,
      enum: ['none', 'whatsapp_inbound'],
      default: 'none',
    },
    requiresMobileVerification: {
      type: Boolean,
      default: false,
    },
    sinkNotification: {
      type: Boolean,
      default: false,
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
