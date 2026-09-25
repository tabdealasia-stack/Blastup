import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getClientEventLogs, getClientMessageLogs, getClientDashboardMetrics } from '../controllers/telemetry.controller';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/event-logs:
 *   get:
 *     summary: List event logs for the authenticated client
 *     tags: [Client Telemetry]
 *     security:
 *       - cookieAuth: []
 */
router.get('/event-logs', getClientEventLogs);

/**
 * @swagger
 * /api/message-logs:
 *   get:
 *     summary: List message logs for the authenticated client
 *     tags: [Client Telemetry]
 *     security:
 *       - cookieAuth: []
 */
router.get('/message-logs', getClientMessageLogs);

/**
 * @swagger
 * /api/dashboard/metrics:
 *   get:
 *     summary: Get dashboard metrics for the authenticated client
 *     tags: [Client Telemetry]
 *     security:
 *       - cookieAuth: []
 */
router.get('/dashboard/metrics', getClientDashboardMetrics);

export default router;
