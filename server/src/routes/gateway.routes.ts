import { Router } from 'express';
import express from 'express';
import {
  handleIntegration,
  publicIntegrationSchema,
  createWhatsAppChallengeHandler,
  getWhatsAppChallengeStatusHandler,
} from '../controllers/gateway.controller';
import { validate } from '../middleware/validate';

const router = Router();

// Strict 10kb body size limit per requirements to prevent payload exhaustion (DDoS)
router.post(
  '/integration/:integrationId',
  express.json({ limit: '10kb' }),
  validate(publicIntegrationSchema),
  handleIntegration
);

// Inbound WhatsApp Verification Endpoints
router.post(
  '/integration/:integrationId/whatsapp/challenge',
  express.json({ limit: '10kb' }),
  createWhatsAppChallengeHandler
);

router.get(
  '/integration/:integrationId/whatsapp/status/:challengeId',
  getWhatsAppChallengeStatusHandler
);

export default router;
