import { Request, Response, NextFunction } from 'express';
import { Client } from '../../models/Client';
import { User } from '../../models/User';
import { ClientCategory } from '../../models/ClientCategory';
import { TemplatePack } from '../../models/TemplatePack';
import { NotificationTemplate } from '../../models/NotificationTemplate';
import ClientTemplate from '../../models/ClientTemplate';
import { WhatsAppAccount } from '../../models/WhatsAppAccount';
import { ApiKey } from '../../models/ApiKey';
import { provisionWhatsAppInstance } from '../../services/whatsapp.service';
import { hashToken } from '../../utils/crypto';
import Boom from '@hapi/boom';
import crypto from 'crypto';
import { z } from 'zod';
import mongoose from 'mongoose';

export const createClientSchema = z.object({
  businessName: z.string().min(1).max(150),
  categoryId: z.string().min(1),
  whatsappNumber: z.string().max(20).optional().nullable(),
  website: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  timezone: z.string().default('Asia/Kolkata'),
  defaultCountryCode: z.string().default('91'),
});

export const updateClientSchema = z.object({
  businessName: z.string().min(1).max(150).optional(),
  categoryId: z.string().min(1).optional(),
  whatsappNumber: z.string().max(20).optional().nullable(),
  website: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  timezone: z.string().optional(),
  defaultCountryCode: z.string().optional(),
  status: z.enum(['active', 'suspended', 'inactive']).optional(),
});

export const updateClientStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'inactive']),
});

export async function getClients(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, categoryId, status, page = 1, limit = 50 } = req.query;

    const query: any = {};
    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }
    if (categoryId) query.categoryId = categoryId;
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    
    const clients = await Client.find(query)
      .populate('categoryId', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Client.countDocuments(query);

    const result = await Promise.all(clients.map(async (client) => {
      const waAccount = await WhatsAppAccount.findOne({ clientId: client._id });
      const templateCount = await ClientTemplate.countDocuments({ clientId: client._id, enabled: true });
      
      return {
        _id: client._id,
        businessName: client.businessName,
        slug: client.slug,
        categoryId: client.categoryId,
        status: client.status,
        whatsappStatus: waAccount?.status || 'disconnected',
        whatsappNumber: waAccount?.phoneNumber || client.phone,
        templateCount,
        integrationStatus: 'active', // Placeholder
        createdAt: client.createdAt,
      };
    }));

    res.json({
      success: true,
      data: result,
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

export async function createClient(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body;

    const category = await ClientCategory.findById(data.categoryId);
    if (!category || !category.active) {
      throw Boom.badRequest('Client category not found or inactive');
    }

    if (!category.defaultTemplatePackId) {
      throw Boom.badRequest('No default template pack configured for this category');
    }

    const pack = await TemplatePack.findOne({
      _id: category.defaultTemplatePackId,
      categoryId: category._id,
      active: true,
    });

    if (!pack) {
      throw Boom.badRequest('Default template pack not found or inactive');
    }

    const slug = data.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const existingClient = await Client.findOne({ slug });
    if (existingClient) {
      throw Boom.conflict(`A client with slug '${slug}' already exists`);
    }
    
    if (data.email) {
      const existingEmail = await Client.findOne({ email: data.email });
      if (existingEmail) throw Boom.conflict(`A client with email '${data.email}' already exists`);
    }

    const username = `${slug}_${crypto.randomBytes(3).toString('hex')}`;
    const password = crypto.randomBytes(16).toString('hex'); // Generate secure random password

    const user = await User.create({
      username,
      password,
      role: 'user',
      isActive: true,
    });

    let rawApiKey: string | null = null;

    try {
      const client = await Client.create({
        userId: user._id,
        businessName: data.businessName.trim(),
        slug,
        categoryId: category._id,
        templatePackId: pack._id,
        email: data.email?.trim().toLowerCase() || null,
        phone: data.whatsappNumber?.trim() || null,
        status: 'active',
        settings: {
          timezone: data.timezone,
          defaultCountryCode: data.defaultCountryCode,
        },
      });

      // Provision Templates
      const templates = await NotificationTemplate.find({
        templatePackId: pack._id,
        active: true,
      });

      if (templates.length > 0) {
        await ClientTemplate.insertMany(
          templates.map((template) => ({
            clientId: client._id,
            templateId: template._id,
            enabled: true,
            customVariables: [],
          })),
          { ordered: false } // Ignore duplicate errors if idempotent
        );
      }

      // Provision WhatsApp Account
      const instanceId = user._id.toString();
      await provisionWhatsAppInstance(instanceId);

      await WhatsAppAccount.findOneAndUpdate(
        { clientId: client._id },
        {
          $setOnInsert: {
            clientId: client._id,
            instanceId,
            status: 'disconnected',
            sessionPath: '',
            safeMode: true,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Provision API Key
      const existingKey = await ApiKey.findOne({ clientId: client._id, status: 'active' });
      if (!existingKey) {
        rawApiKey = 'wa_' + crypto.randomBytes(24).toString('hex');
        const keyHash = hashToken(rawApiKey);
        const keyPrefix = rawApiKey.substring(0, 11);

        await ApiKey.create({
          name: 'Default API Key',
          keyHash,
          keyPrefix,
          clientId: client._id,
          userId: user._id,
          status: 'active',
        });
      }

      res.status(201).json({
        success: true,
        data: {
          clientId: client._id,
          businessName: client.businessName,
          slug: client.slug,
          apiKey: rawApiKey, // Returned ONLY ONCE
          templatesProvisioned: templates.length,
          whatsappProvisioned: true,
        }
      });
    } catch (error) {
      await User.deleteOne({ _id: user._id });
      throw error;
    }
  } catch (err) {
    next(err);
  }
}

export async function getClient(req: Request, res: Response, next: NextFunction) {
  try {
    const client = await Client.findById(req.params.id).populate('categoryId', 'name slug');
    if (!client) throw Boom.notFound('Client not found');

    const waAccount = await WhatsAppAccount.findOne({ clientId: client._id });
    const templates = await ClientTemplate.find({ clientId: client._id }).populate('templateId');
    const apiKeys = await ApiKey.find({ clientId: client._id }).select('-keyHash -key');
    
    res.json({
      success: true,
      data: {
        ...client.toJSON(),
        whatsapp: waAccount,
        templates,
        apiKeys,
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function updateClient(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body;
    const client = await Client.findById(req.params.id);
    if (!client) throw Boom.notFound('Client not found');

    if (data.categoryId && data.categoryId !== client.categoryId?.toString()) {
      const category = await ClientCategory.findById(data.categoryId);
      if (!category) throw Boom.badRequest('Category not found');
    }

    Object.assign(client, data);
    await client.save();

    res.json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
}

export async function updateClientStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = req.body;
    const client = await Client.findById(req.params.id);
    if (!client) throw Boom.notFound('Client not found');

    client.status = status;
    await client.save();

    res.json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
}
