import mongoose, { Schema, Document, Model } from 'mongoose';

export type ClientStatus =
  | 'active'
  | 'suspended'
  | 'inactive'
  | 'deletion_requested'
  | 'cleanup_in_progress'
  | 'cleanup_failed';

export interface IClient extends Document {
  userId: mongoose.Types.ObjectId;
  businessName: string;
  slug: string;
  email?: string | null;
  phone?: string | null;
  status: ClientStatus;
  deletionRequestedAt?: Date | null;
  deletionRequestedBy?: mongoose.Types.ObjectId | null;
  cleanupLockedAt?: Date | null;
  cleanupAttempts: number;
  cleanupError?: string | null;
  planId?: string | null;
  categoryId?: mongoose.Types.ObjectId | null;
  templatePackId?: mongoose.Types.ObjectId | null;
  settings: {
    timezone: string;
    defaultCountryCode: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new Schema<IClient>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    businessName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 100,
      index: true,
    },

    email: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },

    phone: {
      type: String,
      default: null,
      trim: true,
      maxlength: 20,
    },

    status: {
      type: String,
      enum: ['active', 'suspended', 'inactive', 'deletion_requested', 'cleanup_in_progress', 'cleanup_failed'],
      default: 'active',
      index: true,
    },

    deletionRequestedAt: {
      type: Date,
      default: null,
    },

    deletionRequestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    cleanupLockedAt: {
      type: Date,
      default: null,
    },

    cleanupAttempts: {
      type: Number,
      default: 0,
    },

    cleanupError: {
      type: String,
      default: null,
    },

    planId: {
      type: String,
      default: null,
      trim: true,
      maxlength: 100,
    },

    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'ClientCategory',
      default: null,
      index: true,
    },

    templatePackId: {
      type: Schema.Types.ObjectId,
      ref: 'TemplatePack',
      default: null,
      index: true,
    },

    settings: {
      timezone: {
        type: String,
        default: 'Asia/Kolkata',
      },
      defaultCountryCode: {
        type: String,
        default: '91',
      },
    },
  },
  {
    timestamps: true,
    collection: 'clients',
  }
);

// Polling index for background lifecycle worker
clientSchema.index({ status: 1, cleanupLockedAt: 1 });

export const Client: Model<IClient> = mongoose.model<IClient>(
  'Client',
  clientSchema
);