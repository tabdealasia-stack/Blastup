import mongoose from 'mongoose';
import { TravelBooking } from '../models/TravelBooking';
import { Driver } from '../models/Driver';
import { Vehicle } from '../models/Vehicle';

function requireObjectId(value: string, fieldName: string) {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error(`Invalid ${fieldName}`);
  }

  return new mongoose.Types.ObjectId(value);
}

async function getClientBooking(
  bookingId: string,
  clientId: string
) {
  const booking = await TravelBooking.findOne({
    bookingId,
    clientId: requireObjectId(clientId, 'clientId'),
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  return booking;
}

export async function assignDriverAndVehicle(
  bookingId: string,
  clientId: string,
  driverId: string,
  vehicleId: string
) {
  const booking = await getClientBooking(bookingId, clientId);

  if (
    booking.status !== 'confirmed' &&
    booking.status !== 'driver_assigned' &&
    booking.status !== 'vehicle_assigned'
  ) {
    throw new Error(
      'Driver and vehicle can only be assigned after booking confirmation'
    );
  }

  const driverObjectId = requireObjectId(driverId, 'driverId');
  const vehicleObjectId = requireObjectId(vehicleId, 'vehicleId');

  const [driver, vehicle] = await Promise.all([
    Driver.findOne({
      _id: driverObjectId,
      clientId: booking.clientId,
      status: 'active',
    }),
    Vehicle.findOne({
      _id: vehicleObjectId,
      clientId: booking.clientId,
      status: 'active',
    }),
  ]);

  if (!driver) {
    throw new Error('Active driver not found for this client');
  }

  if (!vehicle) {
    throw new Error('Active vehicle not found for this client');
  }

  booking.driverId = driver._id;
  booking.driverAssignedAt = new Date();

  booking.vehicleId = vehicle._id;
  booking.vehicleAssignedAt = new Date();

  booking.status = 'vehicle_assigned';

  await booking.save();

  return booking;
}
export async function assignVehicle(
  bookingId: string,
  clientId: string,
  vehicleId: string
) {
  const booking = await getClientBooking(bookingId, clientId);

  if (
    booking.status === 'cancelled' ||
    booking.status === 'completed' ||
    booking.status === 'trip_ended'
  ) {
    throw new Error('Vehicle cannot be assigned to this booking');
  }

  const vehicle = await Vehicle.findOne({
    _id: requireObjectId(vehicleId, 'vehicleId'),
    clientId: booking.clientId,
    status: 'active',
  });

  if (!vehicle) {
    throw new Error('Active vehicle not found for this client');
  }

  booking.vehicleId = vehicle._id;
  booking.vehicleAssignedAt = new Date();

  if (
    booking.driverId &&
    (booking.status === 'confirmed' ||
      booking.status === 'driver_assigned')
  ) {
    booking.status = 'vehicle_assigned';
  }

  await booking.save();

  return booking;
}

export async function startTrip(
  bookingId: string,
  clientId: string,
  initialKm: number
) {
  const booking = await getClientBooking(bookingId, clientId);

  if (
    booking.status !== 'vehicle_assigned' &&
    booking.status !== 'driver_assigned'
  ) {
    throw new Error(
      'Trip can only be started after driver and vehicle assignment'
    );
  }

  if (!booking.driverId) {
    throw new Error('Driver must be assigned before trip start');
  }

  if (!booking.vehicleId) {
    throw new Error('Vehicle must be assigned before trip start');
  }

  if (!Number.isFinite(initialKm) || initialKm < 0) {
    throw new Error('Initial KM must be a valid non-negative number');
  }

  booking.initialKm = initialKm;
  booking.tripStartedAt = new Date();
  booking.status = 'trip_started';

  await booking.save();

  await Driver.updateOne(
    {
      _id: booking.driverId,
      clientId: booking.clientId,
    },
    {
      $set: { status: 'on_trip' },
    }
  );

  await Vehicle.updateOne(
    {
      _id: booking.vehicleId,
      clientId: booking.clientId,
    },
    {
      $set: { status: 'on_trip' },
    }
  );

  return booking;
}

export async function endTrip(
  bookingId: string,
  clientId: string,
  finalKm: number
) {
  const booking = await getClientBooking(bookingId, clientId);

  if (booking.status !== 'trip_started') {
    throw new Error('Only an active trip can be ended');
  }

  if (!Number.isFinite(finalKm) || finalKm < 0) {
    throw new Error('Final KM must be a valid non-negative number');
  }

  if (
    booking.initialKm !== undefined &&
    finalKm < booking.initialKm
  ) {
    throw new Error('Final KM cannot be less than initial KM');
  }

  booking.finalKm = finalKm;
  booking.tripEndedAt = new Date();
  booking.status = 'trip_ended';

  await booking.save();

  if (booking.driverId) {
    await Driver.updateOne(
      {
        _id: booking.driverId,
        clientId: booking.clientId,
      },
      {
        $set: { status: 'active' },
      }
    );
  }

  if (booking.vehicleId) {
    await Vehicle.updateOne(
      {
        _id: booking.vehicleId,
        clientId: booking.clientId,
      },
      {
        $set: { status: 'active' },
      }
    );
  }

  return booking;
}

export async function markBookingConfirmed(
  bookingId: string,
  clientId: string
) {
  const booking = await getClientBooking(bookingId, clientId);

  if (booking.status !== 'enquiry') {
    throw new Error('Only enquiry bookings can be confirmed');
  }

  booking.status = 'confirmed';

  await booking.save();

  return booking;
}

