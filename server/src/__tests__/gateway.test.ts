import { Request, Response, NextFunction } from 'express';
import { handleIntegration } from '../controllers/gateway.controller';
import { WebsiteIntegration } from '../models/WebsiteIntegration';
import * as notificationService from '../services/notification-event.service';
import * as webhookCrypto from '../utils/webhookCrypto';
import Boom from '@hapi/boom';

jest.mock('../models/WebsiteIntegration');
jest.mock('../services/notification-event.service');
jest.mock('../utils/webhookCrypto');
jest.mock('../config/logger');
jest.mock('../config/redis', () => {
  const mMulti = {
    incr: jest.fn(),
    expire: jest.fn(),
    exec: jest.fn().mockResolvedValue([
      [null, 1], // ip
      [null, 1],
      [null, 1], // int
      [null, 1],
    ])
  };
  return {
    getRedisClient: () => ({
      multi: () => mMulti,
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1)
    })
  };
});

describe('TABDEAL Integration Gateway', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = {
      params: { integrationId: 'wig_test' },
      body: {
        idempotencyKey: 'test-uuid',
        captchaToken: 'valid-token',
        payload: {
          customer_name: 'Test',
          mobile: '918698884383',
          email: 'test@example.com'
        }
      },
      get: jest.fn().mockReturnValue('https://minajshaikh.space'),
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();

    // Mock fetch for Turnstile
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ success: true })
    } as any);

    (webhookCrypto.decryptWebhookSecret as jest.Mock).mockReturnValue('secret');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockIntegration = {
    _id: 'db_id',
    integrationId: 'wig_test',
    status: 'active',
    allowedDomains: ['minajshaikh.space'],
    targetEvent: 'internal.enquiry_received',
    rateLimitPerIpPerHour: 5,
    rateLimitPerDay: 50,
    captcha: {
      provider: 'turnstile',
      encryptedSecret: 'enc'
    },
    clientId: {
      _id: 'client_id',
      whatsappNumber: '918698884383'
    },
    populate: jest.fn().mockResolvedValue(true)
  };

  it('1. Unknown integration rejected', async () => {
    (WebsiteIntegration.findOne as jest.Mock).mockResolvedValue(null);
    await handleIntegration(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Boom.Boom));
    expect(next.mock.calls[0][0].message).toBe('Integration invalid or revoked');
  });

  it('2. Revoked integration rejected', async () => {
    (WebsiteIntegration.findOne as jest.Mock).mockResolvedValue(null);
    await handleIntegration(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Boom.Boom));
  });

  it('7. unsupported event rejected', async () => {
    (WebsiteIntegration.findOne as jest.Mock).mockResolvedValue({
      ...mockIntegration,
      targetEvent: 'admin.super_secret'
    });
    await handleIntegration(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Boom.Boom));
    expect(next.mock.calls[0][0].message).toBe('Configured event is not allowed through the public gateway');
  });

  it('8. invalid domain rejected', async () => {
    req.get.mockReturnValue('https://evil.com');
    (WebsiteIntegration.findOne as jest.Mock).mockResolvedValue(mockIntegration);
    await handleIntegration(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Boom.Boom));
    expect(next.mock.calls[0][0].message).toBe('Origin not allowed');
  });

  it('9. CAPTCHA failure rejected', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ success: false })
    } as any);
    (WebsiteIntegration.findOne as jest.Mock).mockResolvedValue(mockIntegration);
    
    await handleIntegration(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Boom.Boom));
    expect(next.mock.calls[0][0].message).toBe('Attestation failed');
  });

  it('20. NotificationService is reused with Gateway metadata', async () => {
    (WebsiteIntegration.findOne as jest.Mock).mockResolvedValue(mockIntegration);
    await handleIntegration(req, res, next);
    
    expect(notificationService.sendNotificationEvent).toHaveBeenCalledWith(expect.objectContaining({
      clientId: 'client_id',
      event: 'internal.enquiry_received',
      variables: expect.objectContaining({
        source: 'website_gateway',
        customer_name: 'Test'
      })
    }));
    
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Your request has been received.' });
  });
});
