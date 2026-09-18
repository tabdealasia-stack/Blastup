import mongoose, { Schema, Document, Model } from 'mongoose';

export type WhatsAppAccountStatus =
  | 'connected'
  | 'disconnected'
  | 'connecting'
  | 'error';

export interface IWhatsAppAccount extends Document {
  clientId: mongoose.Types.ObjectId;

  phoneNumber?: string | null;
  displayName?: string | null;

  status: WhatsAppAccountStatus;

  // Existing Blastup WhatsApp instance identifier.
  // Currently this maps to the User ID.
  instanceId: string;

  sessionPath?: string | null;

  safeMode: boolean;

  connectedAt?: Date | null;
  lastSeenAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const whatsappAccountSchema = new Schema<IWhatsAppAccount>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      unique: true,
      index: true,
    },

    phoneNumber: {
      type: String,
      default: null,
      trim: true,
      maxlength: 20,
    },

    displayName: {
      type: String,
      default: null,
      trim: true,
      maxlength: 150,
    },

    status: {
      type: String,
      enum: ['connected', 'disconnected', 'connecting', 'error'],
      default: 'disconnected',
      index: true,
    },

    instanceId: {
      type: String,
      required: true,
      trim: true,
    },

    sessionPath: {
      type: String,
      default: null,
      trim: true,
      maxlength: 500,
    },

    safeMode: {
      type: Boolean,
      default: true,
    },

    connectedAt: {
      type: Date,
      default: null,
    },

    lastSeenAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'whatsapp_accounts',
  }
);

// Prevent accidental duplicate mapping of one WhatsApp instance.
whatsappAccountSchema.index(
  { instanceId: 1 },
  { unique: true }
);

export const WhatsAppAccount: Model<IWhatsAppAccount> =
  mongoose.model<IWhatsAppAccount>(
    'WhatsAppAccount',
    whatsappAccountSchema
  );
