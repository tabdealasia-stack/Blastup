jest.mock('@whiskeysockets/baileys', () => ({
  jidNormalizedUser: (jid: any) => jid,
}));

import { Request, Response, NextFunction } from 'express';
import {
  createWhatsAppChallengeHandler,
  getWhatsAppChallengeStatusHandler,
  handleIntegration,
} from '../gateway.controller';
import {
  createWhatsAppChallenge,
  handleInboundVerificationMessage,
  getChallengeStatus,
} from '../../services/whatsapp-verification.service';
import { getRedisClient } from '../../config/redis';
import { WebsiteIntegration } from '../../models/WebsiteIntegration';
import crypto from 'crypto';
import Boom from '@hapi/boom';

jest.mock('../../config/redis', () => ({
  getRedisClient: jest.fn(),
}));

jest.mock('../../models/WebsiteIntegration');
jest.mock('../../utils/webhookCrypto', () => ({
  decryptWebhookSecret: jest.fn().mockReturnValue('mock-secret'),
}));
jest.mock('../../services/notification-event.service', () => ({
  sendNotificationEvent: jest.fn().mockResolvedValue({ success: true }),
}));

describe('Inbound WhatsApp Challenge Verification Suite', () => {
  let redisStore: Map<string, string>;
  let mockRedis: any;
  let mockSock: any;

  beforeEach(() => {
    jest.clearAllMocks();
    redisStore = new Map<string, string>();

    mockRedis = {
      get: jest.fn(async (key: string) => redisStore.get(key) || null),
      set: jest.fn(async (key: string, val: string, ...args: any[]) => {
        if (args.includes('NX') && redisStore.has(key)) return null;
        redisStore.set(key, String(val));
        return 'OK';
      }),
      del: jest.fn(async (key: string) => {
        const existed = redisStore.has(key);
        redisStore.delete(key);
        return existed ? 1 : 0;
      }),
      getdel: jest.fn(async (key: string) => {
        const val = redisStore.get(key) || null;
        redisStore.delete(key);
        return val;
      }),
      incr: jest.fn(async (key: string) => {
        const cur = parseInt(redisStore.get(key) || '0', 10);
        const next = cur + 1;
        redisStore.set(key, String(next));
        return next;
      }),
      expire: jest.fn(async () => 1),
      multi: jest.fn(() => {
        const ops: Array<() => any> = [];
        const multiObj: any = {
          incr: jest.fn((k: string) => {
            ops.push(() => {
              const cur = parseInt(redisStore.get(k) || '0', 10) + 1;
              redisStore.set(k, String(cur));
              return [null, cur];
            });
            return multiObj;
          }),
          expire: jest.fn(() => {
            ops.push(() => [null, 1]);
            return multiObj;
          }),
          set: jest.fn((k: string, v: string) => {
            ops.push(() => {
              redisStore.set(k, String(v));
              return [null, 'OK'];
            });
            return multiObj;
          }),
          exec: jest.fn(async () => ops.map(op => op())),
        };
        return multiObj;
      }),
    };

    (getRedisClient as jest.Mock).mockReturnValue(mockRedis);

    mockSock = {
      sendMessage: jest.fn().mockResolvedValue({ key: { id: 'msg-ack-123' } }),
      user: { id: '911234567890:1@s.whatsapp.net' },
    };

    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ success: true }),
    }) as jest.Mock;
  });

  const mockActiveIntegration = (overrides: Record<string, any> = {}) => {
    const integrationDoc = {
      _id: 'mongo_int_123',
      integrationId: 'wig_test_integration',
      status: 'active',
      targetEvent: 'internal.enquiry_received',
      allowedDomains: ['example.com'],
      rateLimitPerIpPerHour: 100,
      rateLimitPerDay: 500,
      verificationMethod: 'whatsapp_inbound',
      captcha: { provider: 'turnstile', siteKey: 'site', encryptedSecret: 'enc' },
      clientId: { _id: 'client_123', whatsappNumber: '+91 86988 84383' },
      ...overrides,
    };

    (WebsiteIntegration.findOne as jest.Mock).mockReturnValue({
      ...integrationDoc,
      populate: jest.fn().mockResolvedValue(integrationDoc),
    });

    return integrationDoc;
  };

  describe('1. Challenge Creation', () => {
    it('creates a 128-bit unpredictable challenge and returns waLink with configured business number', async () => {
      mockActiveIntegration();

      const result = await createWhatsAppChallenge({
        integrationId: 'wig_test_integration',
        ip: '127.0.0.1',
        captchaToken: 'valid_token',
        origin: 'https://example.com',
      });

      expect(result.success).toBe(true);
      expect(result.challengeCode).toHaveLength(32); // 128 bits in hex
      expect(result.challengeId).toBeDefined();
      expect(result.pollToken).toBeDefined();
      expect(result.businessNumber).toBe('918698884383');
      expect(result.waLink).toBe(`https://wa.me/918698884383?text=VERIFY%20${result.challengeCode}`);

      // Verify stored in Redis
      const challengeKey = `wa:challenge:${result.challengeCode}`;
      expect(redisStore.has(challengeKey)).toBe(true);
      const sessionKey = `wa:session:${result.challengeId}`;
      expect(redisStore.has(sessionKey)).toBe(true);
    });

    it('rejects challenge creation on invalid CAPTCHA attestation', async () => {
      mockActiveIntegration();
      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({ success: false, 'error-codes': ['invalid-input-response'] }),
      }) as jest.Mock;

      await expect(
        createWhatsAppChallenge({
          integrationId: 'wig_test_integration',
          ip: '127.0.0.1',
          captchaToken: 'bad_token',
          origin: 'https://example.com',
        })
      ).rejects.toThrow(/Attestation failed/);
    });

    it('rejects challenge creation for revoked integration', async () => {
      (WebsiteIntegration.findOne as jest.Mock).mockReturnValue(null);

      await expect(
        createWhatsAppChallenge({
          integrationId: 'wig_revoked',
          ip: '127.0.0.1',
          captchaToken: 'valid_token',
        })
      ).rejects.toThrow(/Integration invalid or revoked/);
    });

    it('rejects challenge creation when verification is not enabled', async () => {
      mockActiveIntegration({ verificationMethod: 'none', requiresMobileVerification: false });

      await expect(
        createWhatsAppChallenge({
          integrationId: 'wig_test_integration',
          ip: '127.0.0.1',
          captchaToken: 'valid_token',
        })
      ).rejects.toThrow(/Inbound WhatsApp verification is not enabled/);
    });
  });

  describe('2. Inbound WhatsApp Message Interception & Mobile Binding', () => {
    it('authenticates challenge from inbound message and derives sender mobile from JID', async () => {
      mockActiveIntegration();

      const challenge = await createWhatsAppChallenge({
        integrationId: 'wig_test_integration',
        ip: '127.0.0.1',
        captchaToken: 'valid_token',
      });

      const inboundText = `VERIFY ${challenge.challengeCode}`;
      const senderJid = '918698884383@s.whatsapp.net';

      const handled = await handleInboundVerificationMessage('instance_1', senderJid, inboundText, mockSock);
      expect(handled).toBe(true);

      // Sent confirmation reply with __blastupSystemReply: true
      expect(mockSock.sendMessage).toHaveBeenCalledWith(
        senderJid,
        expect.objectContaining({
          __blastupSystemReply: true,
          text: expect.stringContaining('Verification successful'),
        })
      );

      // Challenge code consumed
      expect(redisStore.has(`wa:challenge:${challenge.challengeCode}`)).toBe(false);

      // Session updated with verified status
      const sessionRaw = redisStore.get(`wa:session:${challenge.challengeId}`);
      expect(sessionRaw).toBeDefined();
      const session = JSON.parse(sessionRaw!);
      expect(session.verified).toBe(true);
      expect(session.verifiedMobile).toBe('918698884383');
      expect(session.verificationToken).toBeDefined();

      // Verification token stored for Gateway consumption
      const vtKey = `otp:verified:wig_test_integration:${session.verificationToken}`;
      expect(redisStore.get(vtKey)).toBe('918698884383');
    });

    it('rejects replayed / already-consumed challenge code', async () => {
      mockActiveIntegration();

      const challenge = await createWhatsAppChallenge({
        integrationId: 'wig_test_integration',
        ip: '127.0.0.1',
        captchaToken: 'valid_token',
      });

      const inboundText = `VERIFY ${challenge.challengeCode}`;
      const senderJid = '918698884383@s.whatsapp.net';

      const firstAttempt = await handleInboundVerificationMessage('instance_1', senderJid, inboundText, mockSock);
      expect(firstAttempt).toBe(true);

      // Second attempt with same code
      const secondAttempt = await handleInboundVerificationMessage('instance_1', senderJid, inboundText, mockSock);
      expect(secondAttempt).toBe(false);
    });

    it('does not intercept ordinary non-verification messages (regression safety)', async () => {
      const handled = await handleInboundVerificationMessage(
        'instance_1',
        '919876543210@s.whatsapp.net',
        'Hello, can I book an operational audit?',
        mockSock
      );

      expect(handled).toBe(false);
      expect(mockSock.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('3. Challenge Polling Status & Anti-Theft', () => {
    it('returns verified: false before message is received', async () => {
      mockActiveIntegration();

      const challenge = await createWhatsAppChallenge({
        integrationId: 'wig_test_integration',
        ip: '127.0.0.1',
        captchaToken: 'valid_token',
      });

      const status = await getChallengeStatus({
        integrationId: 'wig_test_integration',
        challengeId: challenge.challengeId,
        pollToken: challenge.pollToken,
        ip: '127.0.0.1',
      });

      expect(status.verified).toBe(false);
    });

    it('returns verified: true and verificationToken after inbound message is processed', async () => {
      mockActiveIntegration();

      const challenge = await createWhatsAppChallenge({
        integrationId: 'wig_test_integration',
        ip: '127.0.0.1',
        captchaToken: 'valid_token',
      });

      await handleInboundVerificationMessage(
        'instance_1',
        '918698884383@s.whatsapp.net',
        `VERIFY ${challenge.challengeCode}`,
        mockSock
      );

      const status = await getChallengeStatus({
        integrationId: 'wig_test_integration',
        challengeId: challenge.challengeId,
        pollToken: challenge.pollToken,
        ip: '127.0.0.1',
      });

      expect(status.verified).toBe(true);
      expect(status.verifiedMobile).toBe('918698884383');
      expect(status.verificationToken).toBeDefined();
    });

    it('blocks polling with mismatched pollToken (cross-browser theft protection)', async () => {
      mockActiveIntegration();

      const challenge = await createWhatsAppChallenge({
        integrationId: 'wig_test_integration',
        ip: '127.0.0.1',
        captchaToken: 'valid_token',
      });

      await expect(
        getChallengeStatus({
          integrationId: 'wig_test_integration',
          challengeId: challenge.challengeId,
          pollToken: 'wrong_stolen_token',
          ip: '127.0.0.1',
        })
      ).rejects.toThrow(/Invalid or unauthorized challenge session/);
    });
  });

  describe('4. Gateway Enquiry Submission Gating', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
      req = {
        params: { integrationId: 'wig_test_integration' },
        body: {
          idempotencyKey: crypto.randomUUID(),
          captchaToken: 'valid_captcha',
          payload: {
            customer_name: 'Minaj Client',
            mobile: '8698884383', // 10-digit format
            email: 'client@example.com',
          },
        },
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('https://example.com'),
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      next = jest.fn();
    });

    it('rejects enquiry submission without verification token when verification is required', async () => {
      mockActiveIntegration();

      await handleIntegration(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          isBoom: true,
          message: expect.stringMatching(/verify your mobile number via WhatsApp/i),
        })
      );
    });

    it('rejects enquiry when submitted mobile does not match verified WhatsApp number', async () => {
      mockActiveIntegration();

      // Pre-seed token verified for 919999999999
      const vToken = 'valid_token_other_number';
      redisStore.set('otp:verified:wig_test_integration:' + vToken, '919999999999');

      req.body.verificationToken = vToken;
      req.body.payload.mobile = '8698884383'; // Different phone number

      await handleIntegration(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          isBoom: true,
          message: expect.stringMatching(/does not match verified WhatsApp number/i),
        })
      );
    });

    it('accepts enquiry submission when verified WhatsApp number matches submitted mobile', async () => {
      mockActiveIntegration();

      // Pre-seed token verified for WhatsApp JID derived phone 918698884383
      const vToken = 'valid_token_matching';
      redisStore.set('otp:verified:wig_test_integration:' + vToken, '918698884383');

      req.body.verificationToken = vToken;
      req.body.payload.mobile = '8698884383'; // matches last 10 digits

      await handleIntegration(req as Request, res as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Your request has been received.',
        })
      );

      // Verify token was atomically consumed by getdel
      expect(redisStore.has('otp:verified:wig_test_integration:' + vToken)).toBe(false);
    });

    it('rejects replay of previously consumed verification token (atomic single-use)', async () => {
      mockActiveIntegration();

      const vToken = 'single_use_token';
      redisStore.set('otp:verified:wig_test_integration:' + vToken, '918698884383');

      req.body.verificationToken = vToken;
      req.body.payload.mobile = '8698884383';

      // First submission succeeds
      await handleIntegration(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(202);

      // Second submission with same token fails
      const nextSecond = jest.fn();
      req.body.idempotencyKey = crypto.randomUUID(); // new enquiry attempt
      await handleIntegration(req as Request, res as Response, nextSecond);

      expect(nextSecond).toHaveBeenCalledWith(
        expect.objectContaining({
          isBoom: true,
          message: expect.stringMatching(/Invalid or expired verification token/i),
        })
      );
    });

    it('preserves pass-through behavior when verificationMethod is none', async () => {
      mockActiveIntegration({ verificationMethod: 'none', requiresMobileVerification: false });

      // No verificationToken provided
      await handleIntegration(req as Request, res as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(202);
    });
  });

  describe('5. Express Gateway Controller Handlers', () => {
    it('createWhatsAppChallengeHandler invokes service and returns JSON', async () => {
      mockActiveIntegration();

      const req = {
        params: { integrationId: 'wig_test_integration' },
        body: { captchaToken: 'valid_captcha' },
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('https://example.com'),
      } as unknown as Request;

      const res = {
        json: jest.fn(),
      } as unknown as Response;
      const next = jest.fn();

      await createWhatsAppChallengeHandler(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          waLink: expect.stringMatching(/https:\/\/wa\.me\//),
        })
      );
    });

    it('getWhatsAppChallengeStatusHandler validates query pollToken and returns status', async () => {
      mockActiveIntegration();

      const challenge = await createWhatsAppChallenge({
        integrationId: 'wig_test_integration',
        ip: '127.0.0.1',
        captchaToken: 'valid_token',
      });

      const req = {
        params: { integrationId: 'wig_test_integration', challengeId: challenge.challengeId },
        query: { pollToken: challenge.pollToken },
        headers: {},
        ip: '127.0.0.1',
      } as unknown as Request;

      const res = {
        json: jest.fn(),
      } as unknown as Response;
      const next = jest.fn();

      await getWhatsAppChallengeStatusHandler(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        verified: false,
      });
    });

    it('getWhatsAppChallengeStatusHandler rejects request without pollToken', async () => {
      const req = {
        params: { integrationId: 'wig_test_integration', challengeId: 'c-123' },
        query: {},
        headers: {},
        ip: '127.0.0.1',
      } as unknown as Request;

      const res = { json: jest.fn() } as unknown as Response;
      const next = jest.fn();

      await getWhatsAppChallengeStatusHandler(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          isBoom: true,
          output: expect.objectContaining({ statusCode: 400 }),
        })
      );
    });
  });
});
