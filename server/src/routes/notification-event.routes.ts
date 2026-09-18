import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { sendLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { z } from 'zod';
import { sendEvent } from '../controllers/notification-event.controller';

const router = Router();

router.use(authenticate);
router.use(sendLimiter);

const notificationEventSchema = z.object({
  event: z.string().min(1).max(100),
  eventId: z.string().min(1).max(200),
  to: z.string().min(5).max(30),
  variables: z.record(z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
  ])).optional(),
});

router.post(
  '/event',
  validate(notificationEventSchema),
  sendEvent
);

export default router;
