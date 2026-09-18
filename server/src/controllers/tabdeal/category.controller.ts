import { Request, Response, NextFunction } from 'express';
import { ClientCategory } from '../../models/ClientCategory';
import { TemplatePack } from '../../models/TemplatePack';
import { Client } from '../../models/Client';
import Boom from '@hapi/boom';
import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional().nullable(),
  active: z.boolean().optional(),
  defaultTemplatePackId: z.string().optional().nullable(),
});

export const updateCategorySchema = createCategorySchema.partial();

export async function getCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await ClientCategory.find().sort({ displayOrder: 1, createdAt: -1 });
    
    // Attach client counts and template pack counts for the frontend
    const result = await Promise.all(categories.map(async (cat) => {
      const clientCount = await Client.countDocuments({ categoryId: cat._id });
      const packCount = await TemplatePack.countDocuments({ categoryId: cat._id });
      return { ...cat.toJSON(), clientCount, packCount };
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body;
    
    const existing = await ClientCategory.findOne({ slug: data.slug });
    if (existing) {
      throw Boom.conflict(`Category with slug '${data.slug}' already exists.`);
    }

    const category = await ClientCategory.create({
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      active: data.active !== undefined ? data.active : true,
      defaultTemplatePackId: data.defaultTemplatePackId || null,
    });

    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

export async function getCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await ClientCategory.findById(req.params.id);
    if (!category) throw Boom.notFound('Category not found');
    res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body;

    const category = await ClientCategory.findById(req.params.id);
    if (!category) throw Boom.notFound('Category not found');

    if (data.slug && data.slug !== category.slug) {
      const existing = await ClientCategory.findOne({ slug: data.slug });
      if (existing) throw Boom.conflict(`Category with slug '${data.slug}' already exists.`);
    }

    Object.assign(category, data);
    await category.save();

    res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await ClientCategory.findById(req.params.id);
    if (!category) throw Boom.notFound('Category not found');

    const clientCount = await Client.countDocuments({ categoryId: category._id });
    if (clientCount > 0) {
      throw Boom.badRequest(`Cannot delete category because ${clientCount} client(s) depend on it. Please deactivate it instead.`);
    }

    const packCount = await TemplatePack.countDocuments({ categoryId: category._id });
    if (packCount > 0) {
      throw Boom.badRequest(`Cannot delete category because it has ${packCount} template pack(s) assigned.`);
    }

    await ClientCategory.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    next(err);
  }
}
