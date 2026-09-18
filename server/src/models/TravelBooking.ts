import mongoose, { Document, Schema } from 'mongoose';

export interface ITravelBooking extends Document {
  clientId: mongoose.Types.ObjectId;
  bookingId: string;

  customerName: string;
  customerPhone: string;
  customerEmail?: string;

  serviceType: 'travel' | 'rent_a_car';

  status:
    | 'enquiry'
    | 'confirmed'
    | 'driver_assigned'
    | 'vehicle_assigned'
    | 'trip_started'
    | 'trip_ended'
    | 'bill_generated'
    | 'payment_received'
    | 'cancelled'
    | 'completed';

  pickupLocation: string;
  dropLocation?: string;

  pickupDateTime?: Date;
  returnDateTime?: Date;

  driverId?: mongoose.Types.ObjectId;
  driverAssignedAt?: Date;

  vehicleId?: mongoose.Types.ObjectId;
  vehicleAssignedAt?: Date;

  tripStartedAt?: Date;
  tripEndedAt?: Date;

  initialKm?: number;
  finalKm?: number;

  billAmount?: number;
  paidAmount?: number;

  paymentStatus: 'pending' | 'partial' | 'paid';

  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const TravelBookingSchema = new Schema<ITravelBooking>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },

    bookingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },

    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },

    serviceType: {
      type: String,
      enum: ['travel', 'rent_a_car'],
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        'enquiry',
        'confirmed',
        'driver_assigned',
        'vehicle_assigned',
        'trip_started',
        'trip_ended',
        'bill_generated',
        'payment_received',
        'cancelled',
        'completed',
      ],
      default: 'enquiry',
      index: true,
    },

    pickupLocation: {
      type: String,
      required: true,
      trim: true,
    },

    dropLocation: {
      type: String,
      trim: true,
    },

    pickupDateTime: Date,
    returnDateTime: Date,

    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
      index: true,
    },

    driverAssignedAt: Date,

    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      index: true,
    },

    vehicleAssignedAt: Date,

    tripStartedAt: Date,
    tripEndedAt: Date,

    initialKm: {
      type: Number,
      min: 0,
    },

    finalKm: {
      type: Number,
      min: 0,
    },

    billAmount: {
      type: Number,
      min: 0,
    },

    paidAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'paid'],
      default: 'pending',
      index: true,
    },

    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'travel_bookings',
  }
);

TravelBookingSchema.index({ clientId: 1, createdAt: -1 });

TravelBookingSchema.index({
  clientId: 1,
  status: 1,
  pickupDateTime: 1,
});

export const TravelBooking = mongoose.model<ITravelBooking>(
  'TravelBooking',
  TravelBookingSchema
);
