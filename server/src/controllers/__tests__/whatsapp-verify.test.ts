jest.mock('@whiskeysockets/baileys', () => ({
  jidNormalizedUser: (jid: any) => jid,
}));

import { Request, Response, NextFunction } from 'express';
import {
  createWhatsAppChallengeHandler,
  getWhatsAppChallengeStatusHandler,
  handleIntegration,
  publicIntegrationSchema,
} from '../gateway.controller';
import {
  createWhatsAppChallenge,
  handleInboundVerificationMessage,
  getChallengeStatus,
  isPhoneMatch,
  normalizePhone,
} from '../../services/whatsapp-verification.service';
import { getRedisClient } from '../../config/redis';
import { WebsiteIntegration } from '../../models/WebsiteIntegration';
import { WhatsAppAccount } from '../../models/WhatsAppAccount';
import { getSocket } from '../../services/whatsapp.service';
import { sendNotificationEvent } from '../../services/notification-event.service';
import crypto from 'crypto';
import Boom from '@hapi/boom';

jest.mock('../../config/redis', () => ({
  getRedisClient: jest.fn(),
}));

jest.mock('../../models/WebsiteIntegration');
jest.mock('../../models/WhatsAppAccount', () => ({
  WhatsAppAccount: {
    findOne: jest.fn(),
  },
}));
jest.mock('../../services/whatsapp.service', () => ({
  getSocket: jest.fn(),
}));
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
          exec: jest.fn(async () => ops.map((op) => op())),
        };
        return multiObj;
      }),
    };

    (getRedisClient as jest.Mock).mockReturnValue(mockRedis);

    mockSock = {
      sendMessage: jest.fn().mockResolvedValue({ key: { id: 'msg-ack-123' } }),
      user: { id: '918698884383:1@s.whatsapp.net' },
    };

    (getSocket as jest.Mock).mockReturnValue(mockSock);

    (WhatsAppAccount.findOne as jest.Mock).mockResolvedValue({
      clientId: 'client_123',
      instanceId: 'instance_1',
      status: 'connected',
      phoneNumber: '918698884383',
    });

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

  describe('1. Challenge Creation & Multi-Tenant Readiness (F-01, F-07)', () => {
    it('creates a 128-bit unpredictable challenge namespaced by instanceId and returns waLink', async () => {
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

      // Verify stored in Redis with instanceId namespacing (F-01)
      const challengeKey = `wa:challenge:instance_1:${result.challengeCode}`;
      expect(redisStore.has(challengeKey)).toBe(true);
      const sessionKey = `wa:session:${result.challengeId}`;
      expect(redisStore.has(sessionKey)).toBe(true);
    });

    it('rejects challenge creation when WhatsAppAccount is disconnected or missing (F-07)', async () => {
      mockActiveIntegration();
      (WhatsAppAccount.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        createWhatsAppChallenge({
          integrationId: 'wig_test_integration',
          ip: '127.0.0.1',
          captchaToken: 'valid_token',
        })
      ).rejects.toThrow(/WhatsApp instance is not connected for this business/);
    });

    it('rejects challenge creation when active Baileys socket is offline (F-07)', async () => {
      mockActiveIntegration();
      (getSocket as jest.Mock).mockReturnValue(null);

      await expect(
        createWhatsAppChallenge({
          integrationId: 'wig_test_integration',
          ip: '127.0.0.1',
          captchaToken: 'valid_token',
        })
      ).rejects.toThrow(/WhatsApp service is currently offline for this business/);
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

  describe('2. Inbound WhatsApp Interception & Tenant Isolation (F-01, F-02)', () => {
    it('authenticates challenge from inbound message on matching instance and derives sender mobile from JID', async () => {
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
      expect(redisStore.has(`wa:challenge:instance_1:${challenge.challengeCode}`)).toBe(false);

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

    it('blocks cross-tenant verification when message arrives on Instance B for Instance A challenge (F-01)', async () => {
      mockActiveIntegration();

      // Challenge created for Tenant A on instance_1
      const challenge = await createWhatsAppChallenge({
        integrationId: 'wig_test_integration',
        ip: '127.0.0.1',
        captchaToken: 'valid_token',
      });

      const inboundText = `VERIFY ${challenge.challengeCode}`;
      const senderJid = '918698884383@s.whatsapp.net';
      const mockSockTenantB = {
        sendMessage: jest.fn(),
      };

      // Message received on instance_2 (Tenant B)
      const handled = await handleInboundVerificationMessage('instance_2', senderJid, inboundText, mockSockTenantB);
      expect(handled).toBe(false);

      // Tenant B's socket NEVER sends any reply
      expect(mockSockTenantB.sendMessage).not.toHaveBeenCalled();

      // Tenant A's challenge on instance_1 remains completely intact and unconsumed
      expect(redisStore.has(`wa:challenge:instance_1:${challenge.challengeCode}`)).toBe(true);

      // Session remains unverified
      const session = JSON.parse(redisStore.get(`wa:session:${challenge.challengeId}`)!);
      expect(session.verified).toBe(false);
    });

    it('rejects inbound messages from group chats (@g.us) (F-02)', async () => {
      mockActiveIntegration();

      const challenge = await createWhatsAppChallenge({
        integrationId: 'wig_test_integration',
        ip: '127.0.0.1',
        captchaToken: 'valid_token',
      });

      const handled = await handleInboundVerificationMessage(
        'instance_1',
        '12036302534343@g.us', // Group JID
        `VERIFY ${challenge.challengeCode}`,
        mockSock
      );

      expect(handled).toBe(false);
      expect(mockSock.sendMessage).not.toHaveBeenCalled();
      expect(redisStore.has(`wa:challenge:instance_1:${challenge.challengeCode}`)).toBe(true);
    });

    it('rejects inbound messages from LID privacy identities (@lid) (F-02)', async () => {
      mockActiveIntegration();

      const challenge = await createWhatsAppChallenge({
        integrationId: 'wig_test_integration',
        ip: '127.0.0.1',
        captchaToken: 'valid_token',
      });

      const handled = await handleInboundVerificationMessage(
        'instance_1',
        '123456789012345@lid', // LID identifier
        `VERIFY ${challenge.challengeCode}`,
        mockSock
      );

      expect(handled).toBe(false);
      expect(mockSock.sendMessage).not.toHaveBeenCalled();
      expect(redisStore.has(`wa:challenge:instance_1:${challenge.challengeCode}`)).toBe(true);
    });

    it('rejects inbound messages from broadcast or newsletter chats (F-02)', async () => {
      mockActiveIntegration();

      const challenge = await createWhatsAppChallenge({
        integrationId: 'wig_test_integration',
        ip: '127.0.0.1',
        captchaToken: 'valid_token',
      });

      const handled = await handleInboundVerificationMessage(
        'instance_1',
        'status@broadcast',
        `VERIFY ${challenge.challengeCode}`,
        mockSock
      );

      expect(handled).toBe(false);
      expect(mockSock.sendMessage).not.toHaveBeenCalled();
    });

    it('rejects malformed user JIDs with non-digit identifiers (F-02)', async () => {
      mockActiveIntegration();

      const challenge = await createWhatsAppChallenge({
        integrationId: 'wig_test_integration',
        ip: '127.0.0.1',
        captchaToken: 'valid_token',
      });

      const handled = await handleInboundVerificationMessage(
        'instance_1',
        'malformed_user@s.whatsapp.net',
        `VERIFY ${challenge.challengeCode}`,
        mockSock
      );

      expect(handled).toBe(false);
      expect(mockSock.sendMessage).not.toHaveBeenCalled();
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

  describe('3. Strict Phone Normalization & Matching (F-05)', () => {
    it('normalizes digits and strips leading zeros correctly', () => {
      expect(normalizePhone('+91 (8698) 884-383')).toBe('918698884383');
      expect(normalizePhone('08698884383')).toBe('8698884383');
      expect(normalizePhone('')).toBe('');
    });

    it('matches exact same phone numbers', () => {
      expect(isPhoneMatch('918698884383', '918698884383')).toBe(true);
      expect(isPhoneMatch('8698884383', '8698884383')).toBe(true);
    });

    it('matches valid 10-digit national number with country code prefix', () => {
      expect(isPhoneMatch('8698884383', '918698884383')).toBe(true);
      expect(isPhoneMatch('+91 8698884383', '8698884383')).toBe(true);
      expect(isPhoneMatch('4155552671', '14155552671')).toBe(true); // US 10-digit with +1
    });

    it('rejects partial suffix spoofing attacks (F-05)', () => {
      // 7-digit suffix must NOT match 10-digit number
      expect(isPhoneMatch('8884383', '918698884383')).toBe(false);
      expect(isPhoneMatch('918698884383', '8884383')).toBe(false);
      // Different numbers sharing suffix but differing inside national number
      expect(isPhoneMatch('9998698884383', '8888698884383')).toBe(false);
      // Invalid length numbers
      expect(isPhoneMatch('123', '123')).toBe(false);
      expect(isPhoneMatch('9876543210', '9876543211')).toBe(false);
    });
  });

  describe('4. Challenge Polling Status, Anti-Theft & Header Support (F-08)', () => {
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

  describe('5. Gateway Enquiry Submission Gating, Idempotency & Failure Ordering (F-03, F-04, F-06)', () => {
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
            mobile: '8698884383',
            email: 'client@example.com',
          },
        },
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('https://example.com'),
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        setHeader: jest.fn(),
      };
      next = jest.fn();
    });

    it('accepts enquiry submission on successful first attempt and consumes token', async () => {
      mockActiveIntegration();

      const vToken = 'valid_first_token';
      redisStore.set('otp:verified:wig_test_integration:' + vToken, '918698884383');

      req.body.verificationToken = vToken;

      await handleIntegration(req as Request, res as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Your request has been received.',
        })
      );

      // Verification token was consumed
      expect(redisStore.has('otp:verified:wig_test_integration:' + vToken)).toBe(false);
      expect(sendNotificationEvent).toHaveBeenCalledTimes(1);
    });

    it('returns cached 202 on same-key, same-payload replay without requiring unconsumed token (F-04)', async () => {
      mockActiveIntegration();

      const vToken = 'valid_token_replay';
      redisStore.set('otp:verified:wig_test_integration:' + vToken, '918698884383');

      req.body.verificationToken = vToken;

      // 1. First submission succeeds
      await handleIntegration(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(202);
      expect(sendNotificationEvent).toHaveBeenCalledTimes(1);

      // 2. Replay with identical idempotencyKey & payload (verification token already consumed!)
      const res2: Partial<Response> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next2 = jest.fn();

      await handleIntegration(req as Request, res2 as Response, next2);

      expect(next2).not.toHaveBeenCalled();
      expect(res2.status).toHaveBeenCalledWith(202);
      expect(res2.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Your request has been received.',
        })
      );
      // Downstream notification event was NOT sent a second time (duplicate event prevention)
      expect(sendNotificationEvent).toHaveBeenCalledTimes(1);
    });

    it('rejects replay with same idempotency key but different payload (F-04)', async () => {
      mockActiveIntegration();

      const vToken = 'valid_token_conflict';
      redisStore.set('otp:verified:wig_test_integration:' + vToken, '918698884383');

      req.body.verificationToken = vToken;

      // First submission
      await handleIntegration(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(202);

      // Second submission with same key but different customer_name
      const res2: Partial<Response> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next2 = jest.fn();
      req.body.payload.customer_name = 'Completely Different Person';

      await handleIntegration(req as Request, res2 as Response, next2);

      expect(next2).toHaveBeenCalledWith(
        expect.objectContaining({
          isBoom: true,
          output: expect.objectContaining({ statusCode: 409 }),
          message: expect.stringMatching(/different request payload/i),
        })
      );
    });

    it('does not consume verification token if Turnstile attestation fails (F-03)', async () => {
      mockActiveIntegration();

      const vToken = 'token_turnstile_fail';
      redisStore.set('otp:verified:wig_test_integration:' + vToken, '918698884383');

      req.body.verificationToken = vToken;

      // Mock Turnstile failure
      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({ success: false, 'error-codes': ['timeout-or-duplicate'] }),
      }) as jest.Mock;

      await handleIntegration(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          isBoom: true,
          message: expect.stringMatching(/Attestation failed/i),
        })
      );

      // Token was NOT consumed and remains valid for retry! (F-03)
      expect(redisStore.has('otp:verified:wig_test_integration:' + vToken)).toBe(true);

      // Subsequent attempt with valid Turnstile succeeds
      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({ success: true }),
      }) as jest.Mock;

      const nextRetry = jest.fn();
      await handleIntegration(req as Request, res as Response, nextRetry);

      expect(nextRetry).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(202);
      expect(redisStore.has('otp:verified:wig_test_integration:' + vToken)).toBe(false);
    });

    it('does not consume verification token if mobile number does not match (F-03)', async () => {
      mockActiveIntegration();

      const vToken = 'token_mismatch';
      redisStore.set('otp:verified:wig_test_integration:' + vToken, '918698884383');

      req.body.verificationToken = vToken;
      req.body.payload.mobile = '9999999999'; // Typo in mobile

      await handleIntegration(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          isBoom: true,
          message: expect.stringMatching(/does not match verified WhatsApp number/i),
        })
      );

      // Token was NOT consumed, allowing user to correct typo without re-verifying
      expect(redisStore.has('otp:verified:wig_test_integration:' + vToken)).toBe(true);

      // Fix typo
      req.body.payload.mobile = '8698884383';
      const nextFixed = jest.fn();
      await handleIntegration(req as Request, res as Response, nextFixed);

      expect(nextFixed).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(202);
    });

    it('rejects expired or invalid verification token with 403', async () => {
      mockActiveIntegration();

      req.body.verificationToken = 'expired_or_nonexistent_token';

      await handleIntegration(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          isBoom: true,
          output: expect.objectContaining({ statusCode: 403 }),
          message: expect.stringMatching(/Invalid or expired verification token/i),
        })
      );
    });

    it('rejects submission without verification token when verification is enabled', async () => {
      mockActiveIntegration();

      // No token provided
      await handleIntegration(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          isBoom: true,
          output: expect.objectContaining({ statusCode: 403 }),
          message: expect.stringMatching(/verify your mobile number via WhatsApp/i),
        })
      );
    });

    it('preserves pass-through behavior when verificationMethod is none', async () => {
      mockActiveIntegration({ verificationMethod: 'none', requiresMobileVerification: false });

      await handleIntegration(req as Request, res as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(202);
    });

    it('cleans up in-progress idempotency lock if downstream notification fails, allowing retry (F-03)', async () => {
      mockActiveIntegration();

      const vToken = 'token_downstream_fail';
      redisStore.set('otp:verified:wig_test_integration:' + vToken, '918698884383');

      req.body.verificationToken = vToken;

      (sendNotificationEvent as jest.Mock).mockRejectedValueOnce(new Error('Downstream network error'));

      await handleIntegration(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));

      // Idempotency lock is deleted so user is not stuck in in_progress
      const idemKey = `idempotency:gateway:wig_test_integration:${req.body.idempotencyKey}`;
      expect(redisStore.has(idemKey)).toBe(false);
    });

    it('validates optional email schema correctly (F-06)', () => {
      const baseBody = {
        idempotencyKey: crypto.randomUUID(),
        captchaToken: 'token',
        payload: {
          customer_name: 'Test',
          mobile: '9876543210',
          email: '',
        },
      };

      // Blank email is accepted
      expect(publicIntegrationSchema.safeParse(baseBody).success).toBe(true);

      // Valid email is accepted
      baseBody.payload.email = 'valid@example.com';
      expect(publicIntegrationSchema.safeParse(baseBody).success).toBe(true);

      // Invalid non-empty email is rejected (F-06)
      baseBody.payload.email = 'Not provided';
      expect(publicIntegrationSchema.safeParse(baseBody).success).toBe(false);
    });
  });

  describe('6. Express Gateway Controller Handlers', () => {
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

    it('getWhatsAppChallengeStatusHandler validates query or header pollToken and sets Cache-Control', async () => {
      mockActiveIntegration();

      const challenge = await createWhatsAppChallenge({
        integrationId: 'wig_test_integration',
        ip: '127.0.0.1',
        captchaToken: 'valid_token',
      });

      const req = {
        params: { integrationId: 'wig_test_integration', challengeId: challenge.challengeId },
        query: {},
        headers: { 'x-poll-token': challenge.pollToken },
        ip: '127.0.0.1',
      } as unknown as Request;

      const res = {
        json: jest.fn(),
        setHeader: jest.fn(),
      } as unknown as Response;
      const next = jest.fn();

      await getWhatsAppChallengeStatusHandler(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store, no-cache, must-revalidate, private');
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

      const res = { json: jest.fn(), setHeader: jest.fn() } as unknown as Response;
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
