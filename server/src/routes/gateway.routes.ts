import { Router } from 'express';
import express from 'express';
import { handleIntegration, publicIntegrationSchema } from '../controllers/gateway.controller';
import { validate } from '../middleware/validate';

const router = Router();

// Endpoint for Website Integration Gateway
// Strict 10kb body size limit per requirements to prevent payload exhaustion (DDoS)
router.post(
  '/integration/:integrationId',
  express.json({ limit: '10kb' }), // Force limit
  validate(publicIntegrationSchema),
  handleIntegration
);

export default router;
