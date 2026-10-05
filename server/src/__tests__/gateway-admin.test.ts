import { Request, Response, NextFunction } from "express";
import { updateTurnstileSecret } from "../controllers/tabdeal/gateway.controller";
import { WebsiteIntegration } from "../models/WebsiteIntegration";
import * as webhookCrypto from "../utils/webhookCrypto";
import Boom from "@hapi/boom";

jest.mock("../models/WebsiteIntegration");
jest.mock("../utils/webhookCrypto");

describe("Gateway Superadmin: updateTurnstileSecret", () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = {
      params: { id: "mongo_id" },
      body: {
        turnstileSecret: "test_secret_123",
      },
    };

    res = {
      json: jest.fn(),
    };

    next = jest.fn();

    (webhookCrypto.encryptWebhookSecret as jest.Mock).mockReturnValue(
      "encrypted_test_secret",
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockIntegration = {
    integrationId: "wig_test",
    captcha: {
      provider: "turnstile",
      encryptedSecret: "old_secret",
    },
    save: jest.fn().mockResolvedValue(true),
  };

  it("1. Unknown integration rejected", async () => {
    (WebsiteIntegration.findById as jest.Mock).mockResolvedValue(null);
    await updateTurnstileSecret(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Boom.Boom));
    expect(next.mock.calls[0][0].message).toBe("Integration not found");
  });

  it("2. Rejected if provider is not turnstile", async () => {
    (WebsiteIntegration.findById as jest.Mock).mockResolvedValue({
      ...mockIntegration,
      captcha: { provider: "recaptcha" },
    });
    await updateTurnstileSecret(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Boom.Boom));
    expect(next.mock.calls[0][0].message).toBe(
      "Integration is not configured for turnstile",
    );
  });

  it("3. Valid Superadmin secret update succeeds & stored value is encrypted", async () => {
    (WebsiteIntegration.findById as jest.Mock).mockResolvedValue(
      mockIntegration,
    );
    await updateTurnstileSecret(req, res, next);

    expect(webhookCrypto.encryptWebhookSecret).toHaveBeenCalledWith(
      "test_secret_123",
    );
    expect(mockIntegration.captcha.encryptedSecret).toBe(
      "encrypted_test_secret",
    );
    expect(mockIntegration.save).toHaveBeenCalled();

    // Plaintext secret is not returned
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        integrationId: "wig_test",
        captchaConfigured: true,
      },
    });
  });
});
