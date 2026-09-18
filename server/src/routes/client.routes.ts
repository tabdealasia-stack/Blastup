import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import * as clientController from '../controllers/client.controller';

const router = Router();

// All client-management routes require authentication & admin role
router.use(authenticate, requireAdmin);

/**
 * @swagger
 * /api/admin/clients:
 *   post:
 *     summary: Create a new client with automatic template provisioning
 *     tags: [Admin - Clients]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - businessName
 *               - slug
 *               - categoryId
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *               businessName:
 *                 type: string
 *               slug:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               planId:
 *                 type: string
 *               timezone:
 *                 type: string
 *               defaultCountryCode:
 *                 type: string
 *     responses:
 *       201:
 *         description: Client created successfully
 *       400:
 *         description: Invalid request
 */
router.post('/clients', clientController.createClientController);

export default router;
