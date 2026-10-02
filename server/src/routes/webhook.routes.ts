import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireSuperadmin } from '../middleware/auth';
import {
  createWebhook,
  getWebhooks,
  updateWebhook,
  rotateWebhookSecret,
  testWebhook,
} from '../controllers/webhook.controller';
import { getWebhookDeliveryLogs } from '../controllers/webhook-delivery.controller';

const router = Router();

// Webhook Delivery Logs - Client accessible
router.get('/webhook-delivery-logs', authenticate, getWebhookDeliveryLogs);

// Webhook Configuration - Superadmin only
// Mounted under /api/tabdeal/clients/:clientId/webhooks in app.ts, but let's mount it here and handle clientId as a param
router.post('/tabdeal/clients/:clientId/webhooks', authenticate, requireSuperadmin, createWebhook);
router.get('/tabdeal/clients/:clientId/webhooks', authenticate, requireSuperadmin, getWebhooks);
router.patch('/tabdeal/clients/:clientId/webhooks/:webhookId', authenticate, requireSuperadmin, updateWebhook);
router.post('/tabdeal/clients/:clientId/webhooks/:webhookId/rotate-secret', authenticate, requireSuperadmin, rotateWebhookSecret);
router.post('/tabdeal/clients/:clientId/webhooks/:webhookId/test', authenticate, requireSuperadmin, testWebhook);

export default router;
