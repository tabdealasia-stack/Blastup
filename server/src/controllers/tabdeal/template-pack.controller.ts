import { Request, Response, NextFunction } from 'express';
import { TemplatePack } from '../../models/TemplatePack';
import { ClientCategory } from '../../models/ClientCategory';
import { Client } from '../../models/Client';
import { NotificationTemplate } from '../../models/NotificationTemplate';
import Boom from '@hapi/boom';
import { z } from 'zod';

export const createPackSchema = z.object({
  name: z.string().min(1).max(150),
  slug: z.string().min(1).max(150).regex(/^[a-z0-9-]+$/),
  categoryId: z.string(),
  description: z.string().max(500).optional().nullable(),
  active: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

export const updatePackSchema = createPackSchema.partial();

export async function getTemplatePacks(req: Request, res: Response, next: NextFunction) {
  try {
    const packs = await TemplatePack.find().populate('categoryId', 'name slug').sort({ createdAt: -1 });
    
    const result = await Promise.all(packs.map(async (pack) => {
      const templateCount = await NotificationTemplate.countDocuments({ templatePackId: pack._id });
      const clientCount = await Client.countDocuments({ templatePackId: pack._id });
      return { ...pack.toJSON(), templateCount, clientCount };
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function createTemplatePack(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body;

    const category = await ClientCategory.findById(data.categoryId);
    if (!category) throw Boom.notFound('Referenced Category not found');

    const existing = await TemplatePack.findOne({ categoryId: data.categoryId, slug: data.slug });
    if (existing) {
      throw Boom.conflict(`Template pack with slug '${data.slug}' already exists in this category.`);
    }

    const pack = await TemplatePack.create({
      name: data.name,
      slug: data.slug,
      categoryId: data.categoryId,
      description: data.description || null,
      active: data.active !== undefined ? data.active : true,
      isDefault: data.isDefault || false,
    });

    res.status(201).json({ success: true, data: pack });
  } catch (err) {
    next(err);
  }
}

export async function getTemplatePack(req: Request, res: Response, next: NextFunction) {
  try {
    const pack = await TemplatePack.findById(req.params.id).populate('categoryId', 'name slug');
    if (!pack) throw Boom.notFound('Template Pack not found');

    const templates = await NotificationTemplate.find({ templatePackId: pack._id }).sort({ eventName: 1 });

    res.json({ success: true, data: { ...pack.toJSON(), templates } });
  } catch (err) {
    next(err);
  }
}

export async function updateTemplatePack(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body;

    const pack = await TemplatePack.findById(req.params.id);
    if (!pack) throw Boom.notFound('Template Pack not found');

    if (data.categoryId) {
      const category = await ClientCategory.findById(data.categoryId);
      if (!category) throw Boom.notFound('Referenced Category not found');
    }

    const targetCategoryId = data.categoryId || pack.categoryId;
    const targetSlug = data.slug || pack.slug;

    if (targetCategoryId.toString() !== pack.categoryId.toString() || targetSlug !== pack.slug) {
      const existing = await TemplatePack.findOne({ categoryId: targetCategoryId, slug: targetSlug });
      if (existing && existing._id.toString() !== pack._id.toString()) {
        throw Boom.conflict(`Template pack with slug '${targetSlug}' already exists in this category.`);
      }
    }

    Object.assign(pack, data);
    await pack.save();

    res.json({ success: true, data: pack });
  } catch (err) {
    next(err);
  }
}

export async function deleteTemplatePack(req: Request, res: Response, next: NextFunction) {
  try {
    const pack = await TemplatePack.findById(req.params.id);
    if (!pack) throw Boom.notFound('Template Pack not found');

    const clientCount = await Client.countDocuments({ templatePackId: pack._id });
    if (clientCount > 0) {
      throw Boom.badRequest(`Cannot delete template pack because ${clientCount} client(s) depend on it. Please deactivate it instead.`);
    }

    const templateCount = await NotificationTemplate.countDocuments({ templatePackId: pack._id });
    if (templateCount > 0) {
      throw Boom.badRequest(`Cannot delete template pack because it contains ${templateCount} template(s). Delete them first.`);
    }

    await TemplatePack.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Template pack deleted successfully' });
  } catch (err) {
    next(err);
  }
}
