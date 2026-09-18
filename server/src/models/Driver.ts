import mongoose, { Document, Schema } from 'mongoose';

export interface IDriver extends Document {
  clientId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  licenseNumber?: string;
  status: 'active' | 'inactive' | 'on_trip';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DriverSchema = new Schema<IDriver>(
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
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    licenseNumber: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ['active', 'inactive', 'on_trip'],
      default: 'active',
      index: true,
    },

    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'drivers',
  }
);

DriverSchema.index({ clientId: 1, phone: 1 });
DriverSchema.index({ clientId: 1, status: 1 });

export const Driver = mongoose.model<IDriver>('Driver', DriverSchema);
