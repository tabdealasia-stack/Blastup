import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as clientTemplateController from '../controllers/client-template.controller';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/client-templates:
 *   get:
 *     summary: List ClientTemplates for the authenticated client
 *     tags: [Client Templates]
 *     security:
 *       - cookieAuth: []
 */
router.get('/', clientTemplateController.getMyClientTemplates);

export default router;
