import mongoose from 'mongoose';
import { User } from '../models/User';
import { Client } from '../models/Client';
import { ClientCategory } from '../models/ClientCategory';
import { TemplatePack } from '../models/TemplatePack';
import { NotificationTemplate } from '../models/NotificationTemplate';
import ClientTemplate from '../models/ClientTemplate';
import { WhatsAppAccount } from '../models/WhatsAppAccount';
import { provisionWhatsAppInstance } from './whatsapp.service';

export interface CreateClientInput {
  username: string;
  password: string;
  businessName: string;
  slug: string;
  email?: string;
  phone?: string;
  categoryId: string;
  planId?: string;
  timezone?: string;
  defaultCountryCode?: string;
}

export async function createClient(input: CreateClientInput) {
  const {
    username,
    password,
    businessName,
    slug,
    email,
    phone,
    categoryId,
    planId = 'internal',
    timezone = 'Asia/Kolkata',
    defaultCountryCode = '91',
  } = input;

  const normalizedUsername = username.trim().toLowerCase();
  const normalizedSlug = slug.trim().toLowerCase();
  const normalizedPhone = phone?.trim() || undefined;

  if (!normalizedUsername || !password || !businessName.trim() || !normalizedSlug) {
    throw new Error('Username, password, business name and slug are required');
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new Error('Invalid categoryId');
  }

  const category = await ClientCategory.findById(categoryId).lean();

  if (!category || !category.active) {
    throw new Error('Client category not found or inactive');
  }

  if (!category.defaultTemplatePackId) {
    throw new Error('No default template pack configured for this category');
  }

  const pack = await TemplatePack.findOne({
    _id: category.defaultTemplatePackId,
    categoryId: category._id,
    active: true,
  }).lean();

  if (!pack) {
    throw new Error('Default template pack not found or inactive');
  }

  const existingUser = await User.findOne({
    $or: [
      { username: normalizedUsername },
      ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
    ],
  }).lean();

  if (existingUser) {
    throw new Error('A user already exists with this username or phone number');
  }

  const existingClient = await Client.findOne({
    slug: normalizedSlug,
  }).lean();

  if (existingClient) {
    throw new Error('A client already exists with this slug');
  }

  const user = await User.create({
    username: normalizedUsername,
    phone: normalizedPhone,
    password,
    role: 'user',
    isActive: true,
  });

  try {
    const client = await Client.create({
      userId: user._id,
      businessName: businessName.trim(),
      slug: normalizedSlug,
      email: email?.trim().toLowerCase() || undefined,
      phone: normalizedPhone,
      status: 'active',
      planId,
      settings: {
        timezone,
        defaultCountryCode,
      },
    });

    const templates = await NotificationTemplate.find({
      templatePackId: pack._id,
      active: true,
    })
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean();

    if (templates.length > 0) {
      await ClientTemplate.insertMany(
        templates.map((template) => ({
          clientId: client._id,
          templateId: template._id,
          enabled: true,
          customVariables: [],
        })),
        { ordered: true }
      );
    }

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
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    return {
      client,
      user: {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
      },
      category,
      templatePack: pack,
      templatesProvisioned: templates.length,
    };
  } catch (error) {
    // Prevent an orphaned user if client provisioning fails.
    await User.deleteOne({ _id: user._id });
    throw error;
  }
}

