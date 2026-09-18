import { Request, Response, NextFunction } from 'express';
import { NotificationTemplate } from '../../models/NotificationTemplate';
import { TemplatePack } from '../../models/TemplatePack';
import { ClientCategory } from '../../models/ClientCategory';
import ClientTemplate from '../../models/ClientTemplate';
import { NotificationEventLog } from '../../models/NotificationEventLog';
import Boom from '@hapi/boom';
import { z } from 'zod';
import mongoose from 'mongoose';

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(150),
  event: z.string().min(1).max(100).regex(/^[a-z0-9_.]+$/, 'Event must contain only lowercase letters, numbers, underscores, and dots (e.g., booking.confirmed)'),
  categoryId: z.string(),
  templatePackId: z.string(),
  message: z.string().min(1).max(4000),
  variables: z.array(z.string()).default([]),
  active: z.boolean().optional(),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  event: z.string().min(1).max(100).regex(/^[a-z0-9_.]+$/).optional(),
  categoryId: z.string().optional(),
  templatePackId: z.string().optional(),
  message: z.string().min(1).max(4000).optional(),
  variables: z.array(z.string()).optional(),
  active: z.boolean().optional(),
});

export const updateTemplateStatusSchema = z.object({
  status: z.enum(['active', 'inactive']),
});

export async function getTemplates(req: Request, res: Response, next: NextFunction) {
  try {
    const { categoryId, templatePackId, event, status, search, page = 1, limit = 50 } = req.query;

    const query: any = {};
    if (templatePackId) query.templatePackId = templatePackId;
    else if (categoryId) {
      // Find packs for this category
      const packs = await TemplatePack.find({ categoryId }).select('_id');
      query.templatePackId = { $in: packs.map(p => p._id) };
    }
    
    if (event) query.event = { $regex: event, $options: 'i' };
    if (status) query.active = status === 'active';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { event: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const templates = await NotificationTemplate.find(query)
      .populate({
        path: 'templatePackId',
        select: 'name slug categoryId',
        populate: { path: 'categoryId', select: 'name slug' }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await NotificationTemplate.countDocuments(query);

    res.json({
      success: true,
      data: templates,
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

export async function createTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body;

    const pack = await TemplatePack.findById(data.templatePackId);
    if (!pack) throw Boom.notFound('Template pack not found');

    if (pack.categoryId.toString() !== data.categoryId) {
      throw Boom.badRequest('Template pack does not belong to the selected category');
    }

    const normalizedEvent = data.event.trim().toLowerCase();
    
    // Enforce one active template per event per pack
    if (data.active !== false) {
      const existingActive = await NotificationTemplate.findOne({
        templatePackId: pack._id,
        event: normalizedEvent,
        active: true
      });
      if (existingActive) {
        throw Boom.conflict(`An active template for event '${normalizedEvent}' already exists in this pack`);
      }
    }

    let slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slugExists = await NotificationTemplate.findOne({ templatePackId: pack._id, slug });
    if (slugExists) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const template = await NotificationTemplate.create({
      name: data.name,
      slug,
      templatePackId: pack._id,
      event: normalizedEvent,
      message: data.message,
      variables: data.variables || [],
      active: data.active !== undefined ? data.active : true,
    });

    res.status(201).json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
}

export async function getTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const template = await NotificationTemplate.findById(req.params.id)
      .populate({
        path: 'templatePackId',
        select: 'name slug categoryId',
        populate: { path: 'categoryId', select: 'name slug' }
      });
      
    if (!template) throw Boom.notFound('Template not found');
    res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
}

export async function updateTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body;
    const template = await NotificationTemplate.findById(req.params.id);
    if (!template) throw Boom.notFound('Template not found');

    if (data.templatePackId && data.templatePackId !== template.templatePackId.toString()) {
      const pack = await TemplatePack.findById(data.templatePackId);
      if (!pack) throw Boom.notFound('Target template pack not found');
      if (data.categoryId && pack.categoryId.toString() !== data.categoryId) {
        throw Boom.badRequest('Target template pack does not belong to the selected category');
      }
    }

    if (data.event || data.active !== undefined) {
      const targetEvent = (data.event || template.event).trim().toLowerCase();
      const targetActive = data.active !== undefined ? data.active : template.active;
      const targetPackId = data.templatePackId || template.templatePackId;

      if (targetActive) {
        const existingActive = await NotificationTemplate.findOne({
          _id: { $ne: template._id },
          templatePackId: targetPackId,
          event: targetEvent,
          active: true
        });
        if (existingActive) {
          throw Boom.conflict(`An active template for event '${targetEvent}' already exists in this pack`);
        }
      }
      
      if (data.event) {
        data.event = targetEvent;
      }
    }

    Object.assign(template, data);
    await template.save();

    res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
}

export async function updateTemplateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = req.body;
    const template = await NotificationTemplate.findById(req.params.id);
    if (!template) throw Boom.notFound('Template not found');

    const targetActive = status === 'active';

    if (targetActive) {
      const existingActive = await NotificationTemplate.findOne({
        _id: { $ne: template._id },
        templatePackId: template.templatePackId,
        event: template.event,
        active: true
      });
      if (existingActive) {
        throw Boom.conflict(`An active template for event '${template.event}' already exists in this pack`);
      }
    }

    template.active = targetActive;
    await template.save();

    res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
}

export async function deleteTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const template = await NotificationTemplate.findById(req.params.id);
    if (!template) throw Boom.notFound('Template not found');

    const clientTemplateCount = await ClientTemplate.countDocuments({ templateId: template._id });
    if (clientTemplateCount > 0) {
      throw Boom.badRequest(`Cannot delete template because it is assigned to ${clientTemplateCount} client(s). Please disable it instead.`);
    }
    
    // Check NotificationEventLog indirectly? We just check ClientTemplate.
    // If it was never assigned, it probably has no logs. But let's be safe.
    
    await NotificationTemplate.findByIdAndDelete(template._id);

    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (err) {
    next(err);
  }
}
