import { Request, Response, NextFunction } from 'express';
import { handleIntegration, publicIntegrationSchema } from '../gateway.controller';
import { WebsiteIntegration } from '../../models/WebsiteIntegration';
import * as notificationService from '../../services/notification-event.service';
import * as webhookCrypto from '../../utils/webhookCrypto';
import { logger } from '../../config/logger';
import Boom from '@hapi/boom';

jest.mock('../../models/WebsiteIntegration');
jest.mock('../../services/notification-event.service');
jest.mock('../../utils/webhookCrypto');
jest.mock('../../config/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockRedisStore: Record<string, string> = {};

jest.mock('../../config/redis', () => {
  return {
    getRedisClient: () => ({
      get: jest.fn(async (key: string) => mockRedisStore[key] || null),
      set: jest.fn(async (key: string, val: string) => {
        mockRedisStore[key] = val;
        return 'OK';
      }),
      del: jest.fn(async (key: string) => {
        delete mockRedisStore[key];
        return 1;
      }),
      getdel: jest.fn(async (key: string) => {
        const val = mockRedisStore[key] || null;
        delete mockRedisStore[key];
        return val;
      }),
      multi: () => ({
        incr: jest.fn(),
        expire: jest.fn(),
        exec: jest.fn().mockResolvedValue([
          [null, 1], // ip count
          [null, 1],
          [null, 1], // int count
          [null, 1],
        ]),
      }),
    }),
  };
});

describe('Phase 4.3Q: Staging Notification Sink Automated Unit Test Suite (Mocked)', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    // Clear in-memory mock Redis
    for (const k of Object.keys(mockRedisStore)) {
      delete mockRedisStore[k];
    }

    req = {
      params: { integrationId: 'wig_test_sink' },
      body: {
        idempotencyKey: '00000000-0000-4000-8000-000000000001',
        captchaToken: 'valid-turnstile-token',
        payload: {
          customer_name: 'Test Visitor',
          mobile: '919876543210',
          email: 'visitor@example.com',
          company_name: 'Acme Corp',
          city: 'Mumbai',
        },
      },
      get: jest.fn().mockReturnValue('https://minajshaikh.space'),
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
    };

    next = jest.fn();

    // Mock Turnstile success
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ success: true }),
    } as any);

    (webhookCrypto.decryptWebhookSecret as jest.Mock).mockReturnValue('decrypted_secret');
    (notificationService.sendNotificationEvent as jest.Mock).mockResolvedValue({
      success: true,
      status: 'accepted',
      eventLogId: 'mock_event_log_id',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const baseIntegration = {
    _id: 'db_id_123',
    integrationId: 'wig_test_sink',
    status: 'active',
    allowedDomains: ['minajshaikh.space'],
    targetEvent: 'internal.enquiry_received',
    rateLimitPerIpPerHour: 5,
    rateLimitPerDay: 50,
    verificationMethod: 'none',
    requiresMobileVerification: false,
    captcha: {
      provider: 'turnstile',
      siteKey: '0x4AAA_test',
      encryptedSecret: 'encrypted_secret_str',
    },
    clientId: {
      _id: 'client_id_456',
      whatsappNumber: '918698884383',
    },
    populate: jest.fn().mockResolvedValue(true),
  };

  it('1. Existing integration with sinkNotification absent follows original notification path', async () => {
    const integrationWithoutSink = { ...baseIntegration, sinkNotification: undefined };
    (WebsiteIntegration.findOne as jest.Mock).mockResolvedValue(integrationWithoutSink);

    await handleIntegration(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Your request has been received.',
    });
    expect(notificationService.sendNotificationEvent).toHaveBeenCalledTimes(1);
    expect(notificationService.sendNotificationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'client_id_456',
        to: '918698884383',
        event: 'internal.enquiry_received',
      })
    );
  });

  it('2. Existing integration with sinkNotification: false follows original notification path', async () => {
    const integrationSinkFalse = { ...baseIntegration, sinkNotification: false };
    (WebsiteIntegration.findOne as jest.Mock).mockResolvedValue(integrationSinkFalse);

    await handleIntegration(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(202);
    expect(notificationService.sendNotificationEvent).toHaveBeenCalledTimes(1);
  });

  it('3. Sink-enabled integration (sinkNotification: true) never calls sendNotificationEvent', async () => {
    const integrationSinkTrue = { ...baseIntegration, sinkNotification: true };
    (WebsiteIntegration.findOne as jest.Mock).mockResolvedValue(integrationSinkTrue);

    await handleIntegration(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Your request has been received.',
    });
    // Strict guarantee: sendNotificationEvent MUST NEVER be called
    expect(notificationService.sendNotificationEvent).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      'Staging notification sink active: enquiry accepted without dispatching outbound notification',
      expect.objectContaining({
        integrationId: 'wig_test_sink',
        eventId: expect.stringMatching(/^wig-\d+-/),
      })
    );
  });

  it('4. Sink-enabled integration does not create deliverable outbound events for worker', async () => {
    const integrationSinkTrue = { ...baseIntegration, sinkNotification: true };
    (WebsiteIntegration.findOne as jest.Mock).mockResolvedValue(integrationSinkTrue);

    await handleIntegration(req, res, next);

    // Because sendNotificationEvent was not called, NotificationEventLog is never inserted
    expect(notificationService.sendNotificationEvent).not.toHaveBeenCalled();
  });

  it('5. Sink mode does not require client.whatsappNumber and succeeds even if phone is null', async () => {
    // Client has no whatsappNumber configured
    const integrationSinkTrueNoPhone = {
      ...baseIntegration,
      sinkNotification: true,
      clientId: {
        _id: 'staging_client_id_no_phone',
        whatsappNumber: null,
      },
    };
    (WebsiteIntegration.findOne as jest.Mock).mockResolvedValue(integrationSinkTrueNoPhone);

    await handleIntegration(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(202);
    expect(notificationService.sendNotificationEvent).not.toHaveBeenCalled();
  });

  it('5b. Production mode (sinkNotification: false) throws 500 if client.whatsappNumber is missing', async () => {
    const integrationProdNoPhone = {
      ...baseIntegration,
      sinkNotification: false,
      clientId: {
        _id: 'client_id_no_phone',
        whatsappNumber: null,
      },
    };
    (WebsiteIntegration.findOne as jest.Mock).mockResolvedValue(integrationProdNoPhone);

    await handleIntegration(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Boom.Boom));
    const error = next.mock.calls[0][0];
    expect(error.output.statusCode).toBe(500);
    expect(error.message).toBe('Internal configuration error');
  });

  it('6. Sink mode cannot be enabled or overridden by public request-body fields (strict Zod schema)', () => {
    // Attempt to inject sinkNotification into public body
    const maliciousBody = {
      idempotencyKey: '00000000-0000-4000-8000-000000000001',
      captchaToken: 'valid-turnstile-token',
      sinkNotification: true, // Should be rejected by .strict()
      payload: {
        customer_name: 'Test Visitor',
        mobile: '919876543210',
      },
    };

    const parseResult = publicIntegrationSchema.safeParse(maliciousBody);
    expect(parseResult.success).toBe(false);
    if (!parseResult.success) {
      const unrecognized = parseResult.error.issues.flatMap((i: any) => i.keys || []);
      expect(unrecognized).toContain('sinkNotification');
    }
  });

  it('7. Security checks remain fully enforced in sink mode: rejects invalid origin', async () => {
    const integrationSinkTrue = { ...baseIntegration, sinkNotification: true };
    (WebsiteIntegration.findOne as jest.Mock).mockResolvedValue(integrationSinkTrue);

    req.get.mockReturnValue('https://unauthorized-evil-domain.com');

    await handleIntegration(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Boom.Boom));
    expect(next.mock.calls[0][0].output.statusCode).toBe(403);
    expect(next.mock.calls[0][0].message).toBe('Origin not allowed');
    expect(notificationService.sendNotificationEvent).not.toHaveBeenCalled();
  });

  it('7b. Security checks remain fully enforced in sink mode: rejects failed CAPTCHA', async () => {
    const integrationSinkTrue = { ...baseIntegration, sinkNotification: true };
    (WebsiteIntegration.findOne as jest.Mock).mockResolvedValue(integrationSinkTrue);

    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ success: false, 'error-codes': ['invalid-input-response'] }),
    } as any);

    await handleIntegration(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Boom.Boom));
    expect(next.mock.calls[0][0].output.statusCode).toBe(403);
    expect(next.mock.calls[0][0].message).toBe('Attestation failed');
  });

  it('7c. Security checks remain fully enforced in sink mode: rejects unverified mobile when verificationMethod is whatsapp_inbound', async () => {
    const integrationSinkTrueWithVerify = {
      ...baseIntegration,
      sinkNotification: true,
      verificationMethod: 'whatsapp_inbound',
    };
    (WebsiteIntegration.findOne as jest.Mock).mockResolvedValue(integrationSinkTrueWithVerify);

    // Request missing verificationToken
    await handleIntegration(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Boom.Boom));
    expect(next.mock.calls[0][0].output.statusCode).toBe(403);
    expect(next.mock.calls[0][0].message).toBe('Please verify your mobile number via WhatsApp before submitting the enquiry.');
  });

  it('8. Idempotent repeated submissions do not produce duplicate effects in sink mode', async () => {
    const integrationSinkTrue = { ...baseIntegration, sinkNotification: true };
    (WebsiteIntegration.findOne as jest.Mock).mockResolvedValue(integrationSinkTrue);

    // First submission
    await handleIntegration(req, res, next);
    expect(res.status).toHaveBeenCalledWith(202);
    expect(notificationService.sendNotificationEvent).not.toHaveBeenCalled();

    // Reset mocks for second submission with same idempotency key
    res.status.mockClear();
    res.json.mockClear();

    // Second submission with exact same key & payload
    await handleIntegration(req, res, next);
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Your request has been received.',
    });
    expect(notificationService.sendNotificationEvent).not.toHaveBeenCalled();
  });

  it('9. Errors do not leak credentials, tokens, or sensitive internal data', async () => {
    const integrationSinkTrue = { ...baseIntegration, sinkNotification: true };
    (WebsiteIntegration.findOne as jest.Mock).mockResolvedValue(integrationSinkTrue);

    // Force an internal error in Turnstile fetch
    global.fetch = jest.fn().mockRejectedValue(new Error('Turnstile API unreachable'));

    await handleIntegration(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    const passedError = next.mock.calls[0][0];
    expect(passedError.message).not.toContain('encrypted_secret_str');
    expect(passedError.message).not.toContain('decrypted_secret');
  });

  it('10. Normal production notification behaviour and response contracts remain unchanged', async () => {
    const integrationProd = { ...baseIntegration, sinkNotification: false };
    (WebsiteIntegration.findOne as jest.Mock).mockResolvedValue(integrationProd);

    await handleIntegration(req, res, next);

    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Your request has been received.',
    });
    expect(notificationService.sendNotificationEvent).toHaveBeenCalledWith({
      clientId: 'client_id_456',
      apiKeyId: 'db_id_123',
      event: 'internal.enquiry_received',
      eventId: expect.stringMatching(/^wig-\d+-/),
      to: '918698884383',
      variables: expect.objectContaining({
        customer_name: 'Test Visitor',
        mobile: '919876543210',
        source: 'website_gateway',
      }),
    });
  });
});
