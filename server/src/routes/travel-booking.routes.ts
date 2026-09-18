import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createTravelBookingController,
  confirmTravelBookingController,
  assignDriverAndVehicleController,
  startTripController,
  endTripController,
} from '../controllers/travel-booking.controller';

const router = Router();

router.use(authenticate);

router.post('/bookings', createTravelBookingController);

router.post(
  '/bookings/:bookingId/confirm',
  confirmTravelBookingController
);

router.post(
  '/bookings/:bookingId/assignment',
  assignDriverAndVehicleController
);

router.post(
  '/bookings/:bookingId/start',
  startTripController
);

router.post(
  '/bookings/:bookingId/end',
  endTripController
);

export default router;
