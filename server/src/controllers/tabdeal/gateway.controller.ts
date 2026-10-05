import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import Boom from "@hapi/boom";
import crypto from "crypto";
import { WebsiteIntegration } from "../../models/WebsiteIntegration";
import { encryptWebhookSecret } from "../../utils/webhookCrypto";

export const createIntegrationSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  name: z.string().min(1, "Name is required").max(150),
  targetEvent: z.string().min(1, "Target Event is required"),
  allowedDomains: z.array(z.string()).min(1, "At least one domain is required"),
  captcha: z.object({
    provider: z.string().min(1, "Provider is required"),
    siteKey: z.string().min(1, "Site Key is required"),
    secret: z.string().min(1, "Secret is required"),
  }),
  rateLimitPerIpPerHour: z.number().int().min(1).default(5),
  rateLimitPerDay: z.number().int().min(1).default(50),
});

export const updateIntegrationSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  targetEvent: z.string().min(1).optional(),
  allowedDomains: z.array(z.string()).min(1).optional(),
  captcha: z
    .object({
      provider: z.string().min(1, "Provider is required"),
      siteKey: z.string().min(1, "Site Key is required"),
      secret: z.string().min(1, "Secret is required").optional(), // Only if updating
    })
    .optional(),
  rateLimitPerIpPerHour: z.number().int().min(1).optional(),
  rateLimitPerDay: z.number().int().min(1).optional(),
  status: z.enum(["active", "revoked"]).optional(),
});

export async function getIntegrations(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const integrations = await WebsiteIntegration.find()
      .select("-captcha.encryptedSecret")
      .populate("clientId", "businessName slug status")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: integrations });
  } catch (error) {
    next(error);
  }
}

export async function getIntegration(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const integration = await WebsiteIntegration.findById(req.params.id)
      .select("-captcha.encryptedSecret")
      .populate("clientId", "businessName slug status");
    if (!integration) {
      throw Boom.notFound("Integration not found");
    }
    res.json({ success: true, data: integration });
  } catch (error) {
    next(error);
  }
}

export async function createIntegration(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = req.body;

    // Generate public integrationId
    const integrationId = `wig_${crypto.randomBytes(16).toString("hex")}`;

    // Encrypt the CAPTCHA secret
    const encryptedSecret = encryptWebhookSecret(data.captcha.secret);

    const integration = new WebsiteIntegration({
      integrationId,
      clientId: data.clientId,
      name: data.name,
      targetEvent: data.targetEvent,
      allowedDomains: data.allowedDomains,
      captcha: {
        provider: data.captcha.provider,
        siteKey: data.captcha.siteKey,
        encryptedSecret,
      },
      rateLimitPerIpPerHour: data.rateLimitPerIpPerHour,
      rateLimitPerDay: data.rateLimitPerDay,
      status: "active",
    });

    await integration.save();

    const responseDoc = integration.toObject() as any;
    delete responseDoc.captcha.encryptedSecret;

    res.status(201).json({ success: true, data: responseDoc });
  } catch (error) {
    next(error);
  }
}

export async function updateIntegration(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = req.body;
    const integration = await WebsiteIntegration.findById(req.params.id);

    if (!integration) {
      throw Boom.notFound("Integration not found");
    }

    if (data.name) integration.name = data.name;
    if (data.targetEvent) integration.targetEvent = data.targetEvent;
    if (data.allowedDomains) integration.allowedDomains = data.allowedDomains;
    if (data.rateLimitPerIpPerHour !== undefined)
      integration.rateLimitPerIpPerHour = data.rateLimitPerIpPerHour;
    if (data.rateLimitPerDay !== undefined)
      integration.rateLimitPerDay = data.rateLimitPerDay;
    if (data.status) integration.status = data.status;

    if (data.captcha) {
      integration.captcha.provider = data.captcha.provider;
      integration.captcha.siteKey = data.captcha.siteKey;
      if (data.captcha.secret) {
        integration.captcha.encryptedSecret = encryptWebhookSecret(
          data.captcha.secret,
        );
      }
    }

    await integration.save();

    const responseDoc = integration.toObject() as any;
    delete responseDoc.captcha.encryptedSecret;

    res.json({ success: true, data: responseDoc });
  } catch (error) {
    next(error);
  }
}

export async function revokeIntegration(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const integration = await WebsiteIntegration.findById(req.params.id);

    if (!integration) {
      throw Boom.notFound("Integration not found");
    }

    integration.status = "revoked";
    await integration.save();

    res.json({ success: true, message: "Integration revoked successfully" });
  } catch (error) {
    next(error);
  }
}

export const updateTurnstileSecretSchema = z.object({
  turnstileSecret: z.string().min(1, "Secret is required"),
});

export async function updateTurnstileSecret(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { turnstileSecret } = req.body;
    const integration = await WebsiteIntegration.findById(req.params.id);

    if (!integration) {
      throw Boom.notFound("Integration not found");
    }

    if (integration.captcha.provider !== "turnstile") {
      throw Boom.badRequest("Integration is not configured for turnstile");
    }

    // Encrypt the CAPTCHA secret immediately
    const encryptedSecret = encryptWebhookSecret(turnstileSecret);
    integration.captcha.encryptedSecret = encryptedSecret;

    await integration.save();

    res.json({
      success: true,
      data: {
        integrationId: integration.integrationId,
        captchaConfigured: true,
      },
    });
  } catch (error) {
    next(error);
  }
}
