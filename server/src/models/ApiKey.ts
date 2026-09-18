import mongoose, { Schema, Document, Model } from 'mongoose';

export type ApiKeyStatus = 'active' | 'revoked';

export interface IApiKey extends Document {
  name: string;

  // Legacy field kept temporarily for migration/backward compatibility.
  // New API keys will NOT store the raw key.
  key?: string;

  keyHash: string;
  keyPrefix: string;

  // New Tabdeal tenancy relationship.
  clientId: mongoose.Types.ObjectId;

  // Kept temporarily because existing Blastup authentication uses userId
  // as the WhatsApp instance ID.
  userId: mongoose.Types.ObjectId;

  status: ApiKeyStatus;
  lastUsedAt: Date | null;
  expiresAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const apiKeySchema = new Schema<IApiKey>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    // LEGACY:
    // Existing API keys may still contain this field.
    // New keys created after migration will not write it.
    key: {
      type: String,
      required: false,
      select: false,
    },

    keyHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    keyPrefix: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
      index: true,
    },

    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },

    // Temporary compatibility with existing Blastup code.
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ['active', 'revoked'],
      default: 'active',
      index: true,
    },

    lastUsedAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'apikeys',
  }
);

export const ApiKey: Model<IApiKey> = mongoose.model<IApiKey>(
  'ApiKey',
  apiKeySchema
);