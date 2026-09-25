import { Request, Response, NextFunction } from 'express';
import ClientTemplate from '../../models/ClientTemplate';
import { Client } from '../../models/Client';
import { NotificationTemplate } from '../../models/NotificationTemplate';
import Boom from '@hapi/boom';
import { z } from 'zod';
import mongoose from 'mongoose';

export const createClientTemplateSchema = z.object({
  clientId: z.string(),
  templateId: z.string(),
  enabled: z.boolean().optional(),
  customMessage: z.string().max(4000).optional(),
  customVariables: z.array(z.string()).optional(),
});

export const updateClientTemplateSchema = z.object({
  enabled: z.boolean().optional(),
  customMessage: z.string().max(4000).optional(),
  customVariables: z.array(z.string()).optional(),
});

export async function getClientTemplates(req: Request, res: Response, next: NextFunction) {
  try {
    const { clientId, templateId, enabled, page = 1, limit = 50 } = req.query;

    const query: any = {};
    if (clientId) query.clientId = clientId;
    if (templateId) query.templateId = templateId;
    if (enabled !== undefined) query.enabled = enabled === 'true';

    const skip = (Number(page) - 1) * Number(limit);
    
    const clientTemplates = await ClientTemplate.find(query)
      .populate('clientId', 'businessName slug status')
      .populate('templateId', 'name event message variables active')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await ClientTemplate.countDocuments(query);

    res.json({
      success: true,
      data: clientTemplates,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function createClientTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body;

    const client = await Client.findById(data.clientId);
    if (!client) throw Boom.notFound('Client not found');
    if (client.status !== 'active') throw Boom.badRequest('Client is not active');

    const template = await NotificationTemplate.findById(data.templateId);
    if (!template) throw Boom.notFound('Master template not found');
    if (!template.active) throw Boom.badRequest('Master template is not active');

    // Prevent duplicate assignment
    const existing = await ClientTemplate.findOne({
      clientId: client._id,
      templateId: template._id,
    });

    if (existing) {
      throw Boom.conflict('This template is already assigned to this client');
    }

    const clientTemplate = await ClientTemplate.create({
      clientId: client._id,
      templateId: template._id,
      enabled: data.enabled !== undefined ? data.enabled : true,
      customMessage: data.customMessage || undefined,
      customVariables: data.customVariables || [],
    });

    res.status(201).json({ success: true, data: clientTemplate });
  } catch (err) {
    next(err);
  }
}

export async function updateClientTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body;
    const clientTemplate = await ClientTemplate.findById(req.params.id);
    if (!clientTemplate) throw Boom.notFound('Client template not found');

    if (data.enabled !== undefined) clientTemplate.enabled = data.enabled;
    if (data.customMessage !== undefined) clientTemplate.customMessage = data.customMessage;
    if (data.customVariables !== undefined) clientTemplate.customVariables = data.customVariables;

    await clientTemplate.save();

    res.json({ success: true, data: clientTemplate });
  } catch (err) {
    next(err);
  }
}

export async function getClientApiKeys(req: Request, res: Response, next: NextFunction) {
  try {
    const { clientId } = req.params;
    
    const client = await Client.findById(clientId);
    if (!client) throw Boom.notFound('Client not found');

    const { ApiKey } = await import('../../models/ApiKey');
    
    // Only return safe metadata
    const apiKeys = await ApiKey.find({ clientId: client._id })
      .select('_id name status lastUsedAt createdAt updatedAt')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: apiKeys });
  } catch (err) {
    next(err);
  }
}
