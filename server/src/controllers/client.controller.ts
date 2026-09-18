import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createClient } from '../services/client.service';

export async function createClientController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const {
      username,
      password,
      businessName,
      slug,
      email,
      phone,
      categoryId,
      planId,
      timezone,
      defaultCountryCode,
    } = req.body;

    if (
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      typeof businessName !== 'string' ||
      typeof slug !== 'string' ||
      typeof categoryId !== 'string'
    ) {
      res.status(400).json({
        success: false,
        message: 'username, password, businessName, slug and categoryId are required',
      });
      return;
    }

    const result = await createClient({
      username,
      password,
      businessName,
      slug,
      email,
      phone,
      categoryId,
      planId,
      timezone,
      defaultCountryCode,
    });

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: {
        client: result.client,
        user: result.user,
        category: {
          id: result.category._id,
          name: result.category.name,
          slug: result.category.slug,
        },
        templatePack: {
          id: result.templatePack._id,
          name: result.templatePack.name,
          slug: result.templatePack.slug,
        },
        templatesProvisioned: result.templatesProvisioned,
      },
    });
  } catch (err) {
    next(err);
  }
}
