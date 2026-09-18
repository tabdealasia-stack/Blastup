import { Router } from 'express';
import { authenticate, requireSuperadmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as categoryController from '../controllers/tabdeal/category.controller';
import * as templatePackController from '../controllers/tabdeal/template-pack.controller';
import * as clientController from '../controllers/tabdeal/client.controller';
import * as templateController from '../controllers/tabdeal/template.controller';

const router = Router();

// Protect all /api/tabdeal routes
router.use(authenticate, requireSuperadmin);

// Health / Base route
router.get('/', (req, res) => {
  res.json({ success: true, message: 'TABDEAL Management API is online' });
});

// Categories
router.get('/categories', categoryController.getCategories);
router.post('/categories', validate(categoryController.createCategorySchema), categoryController.createCategory);
router.get('/categories/:id', categoryController.getCategory);
router.patch('/categories/:id', validate(categoryController.updateCategorySchema), categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// Template Packs
router.get('/template-packs', templatePackController.getTemplatePacks);
router.post('/template-packs', validate(templatePackController.createPackSchema), templatePackController.createTemplatePack);
router.get('/template-packs/:id', templatePackController.getTemplatePack);
router.patch('/template-packs/:id', validate(templatePackController.updatePackSchema), templatePackController.updateTemplatePack);
router.delete('/template-packs/:id', templatePackController.deleteTemplatePack);

// Clients
router.get('/clients', clientController.getClients);
router.post('/clients', validate(clientController.createClientSchema), clientController.createClient);
router.get('/clients/:id', clientController.getClient);
router.patch('/clients/:id', validate(clientController.updateClientSchema), clientController.updateClient);
router.patch('/clients/:id/status', validate(clientController.updateClientStatusSchema), clientController.updateClientStatus);

// Client Lifecycle
import * as lifecycleController from '../controllers/tabdeal/client-lifecycle.controller';
router.get('/clients/:id/dependencies', lifecycleController.getDependencies);
router.post('/clients/:id/disconnect', lifecycleController.disconnectClient);
router.post('/clients/:id/suspend', lifecycleController.suspend);
router.post('/clients/:id/deletion-request', lifecycleController.requestDeletion);

// Templates
router.get('/templates', templateController.getTemplates);
router.post('/templates', validate(templateController.createTemplateSchema), templateController.createTemplate);
router.get('/templates/:id', templateController.getTemplate);
router.patch('/templates/:id', validate(templateController.updateTemplateSchema), templateController.updateTemplate);
router.patch('/templates/:id/status', validate(templateController.updateTemplateStatusSchema), templateController.updateTemplateStatus);
router.delete('/templates/:id', templateController.deleteTemplate);

import * as logController from '../controllers/tabdeal/log.controller';

// ... other routes ...

// Dashboard Metrics
router.get('/dashboard-metrics', logController.getDashboardMetrics);

// Logs
router.get('/message-logs', logController.getMessageLogs);
router.get('/message-logs/:id', logController.getMessageLog);
router.get('/event-logs', logController.getEventLogs);
router.get('/event-logs/:id', logController.getEventLog);

// Placeholders for future phases
// ...
router.get('/api-keys', (req, res) => res.json({ data: [] }));
router.get('/integrations', (req, res) => res.json({ data: [] }));

export default router;
