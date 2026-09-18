import mongoose, { Document, Schema } from 'mongoose';

export interface IVehicle extends Document {
  clientId: mongoose.Types.ObjectId;
  vehicleNumber: string;
  vehicleType: string;
  make?: string;
  vehicleModel?: string;
  seatingCapacity?: number;
  status: 'active' | 'inactive' | 'on_trip' | 'maintenance';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },

    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    vehicleType: {
      type: String,
      required: true,
      trim: true,
    },

    make: {
      type: String,
      trim: true,
    },

    vehicleModel: {
      type: String,
      trim: true,
    },

    seatingCapacity: {
      type: Number,
      min: 1,
    },

    status: {
      type: String,
      enum: ['active', 'inactive', 'on_trip', 'maintenance'],
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
    collection: 'vehicles',
  }
);

VehicleSchema.index(
  { clientId: 1, vehicleNumber: 1 },
  { unique: true }
);

VehicleSchema.index({ clientId: 1, status: 1 });

export const Vehicle = mongoose.model<IVehicle>(
  'Vehicle',
  VehicleSchema
);
