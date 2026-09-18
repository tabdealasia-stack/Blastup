import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { TravelBooking } from '../models/TravelBooking';
import {
  markBookingConfirmed,
  assignDriverAndVehicle,
  startTrip,
  endTrip,
} from '../services/travel-booking.service';

function getClientId(req: AuthRequest): string {
  const clientId = req.user?.clientId;

  if (!clientId) {
    throw new Error('Client context is required');
  }

  return clientId;
}

export async function createTravelBookingController(
  req: AuthRequest,
  res: Response
) {
  try {
    const clientId = getClientId(req);

    const {
      bookingId,
      customerName,
      customerPhone,
      customerEmail,
      serviceType,
      pickupLocation,
      dropLocation,
      pickupDateTime,
      returnDateTime,
      notes,
    } = req.body;

    if (!bookingId || !customerName || !customerPhone) {
      return res.status(400).json({
        success: false,
        message: 'bookingId, customerName and customerPhone are required',
      });
    }

    if (!['travel', 'rent_a_car'].includes(serviceType)) {
      return res.status(400).json({
        success: false,
        message: 'serviceType must be travel or rent_a_car',
      });
    }

    if (!pickupLocation) {
      return res.status(400).json({
        success: false,
        message: 'pickupLocation is required',
      });
    }

    const existing = await TravelBooking.findOne({
      bookingId: String(bookingId).trim(),
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Booking ID already exists',
      });
    }

    const booking = await TravelBooking.create({
      clientId,
      bookingId: String(bookingId).trim(),
      customerName: String(customerName).trim(),
      customerPhone: String(customerPhone).trim(),
      customerEmail: customerEmail
        ? String(customerEmail).trim().toLowerCase()
        : undefined,
      serviceType,
      status: 'enquiry',
      pickupLocation: String(pickupLocation).trim(),
      dropLocation: dropLocation
        ? String(dropLocation).trim()
        : undefined,
      pickupDateTime: pickupDateTime
        ? new Date(pickupDateTime)
        : undefined,
      returnDateTime: returnDateTime
        ? new Date(returnDateTime)
        : undefined,
      notes: notes ? String(notes).trim() : undefined,
    });

    return res.status(201).json({
      success: true,
      message: 'Travel booking created',
      data: booking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to create travel booking',
    });
  }
}

export async function confirmTravelBookingController(
  req: AuthRequest,
  res: Response
) {
  try {
    const booking = await markBookingConfirmed(
      String(req.params.bookingId),
      getClientId(req)
    );

    return res.json({
      success: true,
      message: 'Booking confirmed',
      data: booking,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to confirm booking',
    });
  }
}

export async function assignDriverAndVehicleController(
  req: AuthRequest,
  res: Response
) {
  try {
    const { driverId, vehicleId } = req.body;

    if (!driverId || !vehicleId) {
      return res.status(400).json({
        success: false,
        message: 'driverId and vehicleId are required',
      });
    }

    const booking = await assignDriverAndVehicle(
      String(req.params.bookingId),
      getClientId(req),
      String(driverId),
      String(vehicleId)
    );

    return res.json({
      success: true,
      message: 'Driver and vehicle assigned',
      data: booking,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to assign driver and vehicle',
    });
  }
}
export async function startTripController(
  req: AuthRequest,
  res: Response
) {
  try {
    const { initialKm } = req.body;

    if (typeof initialKm !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'initialKm must be a number',
      });
    }

    const booking = await startTrip(
      String(req.params.bookingId),
      getClientId(req),
      initialKm
    );

    return res.json({
      success: true,
      message: 'Trip started',
      data: booking,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to start trip',
    });
  }
}

export async function endTripController(
  req: AuthRequest,
  res: Response
) {
  try {
    const { finalKm } = req.body;

    if (typeof finalKm !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'finalKm must be a number',
      });
    }

    const booking = await endTrip(
      String(req.params.bookingId),
      getClientId(req),
      finalKm
    );

    return res.json({
      success: true,
      message: 'Trip ended',
      data: booking,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to end trip',
    });
  }
}

