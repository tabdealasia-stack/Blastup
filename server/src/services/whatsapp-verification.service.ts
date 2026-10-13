import crypto from 'crypto';
import Boom from '@hapi/boom';
import { WebsiteIntegration } from '../models/WebsiteIntegration';
import { WhatsAppAccount } from '../models/WhatsAppAccount';
import { getRedisClient } from '../config/redis';
import { decryptWebhookSecret } from '../utils/webhookCrypto';
import { logger } from '../config/logger';

/**
 * Lazily resolves active Baileys socket from whatsapp.service.
 * Prevents eager evaluation of @whiskeysockets/baileys ESM imports in non-socket test suites.
 */
function getActiveSocket(instanceId: string): any {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const waService = require('./whatsapp.service');
    return waService.getSocket ? waService.getSocket(instanceId) : null;
  } catch (err) {
    logger.warn('Failed to resolve active WhatsApp socket', { error: String(err) });
    return null;
  }
}

export interface CreateChallengeParams {
  integrationId: string;
  ip: string;
  captchaToken: string;
  origin?: string;
}

export interface CreateChallengeResult {
  success: boolean;
  challengeId: string;
  pollToken: string;
  challengeCode: string;
  waLink: string;
  businessNumber: string;
  expiresIn: number;
}

export interface ChallengeStatusParams {
  integrationId: string;
  challengeId: string;
  pollToken: string;
  ip: string;
}

export interface ChallengeStatusResult {
  success: boolean;
  verified: boolean;
  expired?: boolean;
  verifiedMobile?: string;
  verificationToken?: string;
}

export function normalizePhone(rawPhone: string): string {
  if (!rawPhone || typeof rawPhone !== 'string') return '';
  let digits = rawPhone.replace(/\D/g, '');
  // Strip leading zeros (e.g. 08698884383 -> 8698884383)
  digits = digits.replace(/^0+/, '');
  return digits;
}

/**
 * Validates whether a submitted payload phone matches a verified WhatsApp phone.
 * Supports exact match and standard 10-digit national matching with 1-4 digit country code.
 * Rejects loose partial-suffix matching to prevent number spoofing.
 */
export function isPhoneMatch(submittedPhone: string, verifiedPhone: string): boolean {
  const normSubmitted = normalizePhone(submittedPhone);
  const normVerified = normalizePhone(verifiedPhone);

  if (!normSubmitted || !normVerified) return false;
  if (normSubmitted.length < 7 || normSubmitted.length > 15) return false;
  if (normVerified.length < 7 || normVerified.length > 15) return false;

  // 1. Exact equality (e.g. 918698884383 === 918698884383)
  if (normSubmitted === normVerified) return true;

  // 2. Strict 10-digit national match with valid country code prefix
  if (normSubmitted.length >= 10 && normVerified.length >= 10) {
    const sub10 = normSubmitted.slice(-10);
    const ver10 = normVerified.slice(-10);
    if (sub10 === ver10) {
      const longer = normSubmitted.length > normVerified.length ? normSubmitted : normVerified;
      const shorter = normSubmitted.length > normVerified.length ? normVerified : normSubmitted;
      const prefix = longer.slice(0, longer.length - 10);
      if (shorter.length === 10 && prefix.length >= 1 && prefix.length <= 4) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Create a new WhatsApp inbound verification challenge.
 */
export async function createWhatsAppChallenge(params: CreateChallengeParams): Promise<CreateChallengeResult> {
  const { integrationId, ip, captchaToken, origin } = params;

  const integration = await WebsiteIntegration.findOne({ integrationId, status: 'active' });
  if (!integration) {
    throw Boom.forbidden('Integration invalid or revoked');
  }

  const isVerificationConfigured =
    integration.verificationMethod === 'whatsapp_inbound' ||
    (integration.requiresMobileVerification && integration.verificationMethod !== 'none');

  if (!isVerificationConfigured) {
    throw Boom.badRequest('Inbound WhatsApp verification is not enabled for this integration');
  }

  // Validate Origin if present
  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (!integration.allowedDomains.includes(originUrl.hostname) && !integration.allowedDomains.includes('*')) {
        throw Boom.forbidden('Origin not allowed');
      }
    } catch {
      throw Boom.forbidden('Origin not allowed');
    }
  }

  const redis = getRedisClient();

  // Rate limit challenge creation per IP and per integration
  const ipLimitKey = `ratelimit:wa-challenge:ip:${ip}`;
  const intLimitKey = `ratelimit:wa-challenge:int:${integrationId}`;

  const multi = redis.multi();
  multi.incr(ipLimitKey);
  multi.expire(ipLimitKey, 3600);
  multi.incr(intLimitKey);
  multi.expire(intLimitKey, 3600);

  const limitResults = await multi.exec();
  if (limitResults) {
    const ipCount = limitResults[0][1] as number;
    const intCount = limitResults[2][1] as number;
    if (ipCount > 25 || intCount > 150) {
      throw Boom.tooManyRequests('Too many challenge requests. Please try again later.');
    }
  }

  // Verify CAPTCHA
  if (integration.captcha.provider === 'turnstile') {
    const secret = decryptWebhookSecret(integration.captcha.encryptedSecret);
    const formData = new URLSearchParams();
    formData.append('secret', secret);
    formData.append('response', captchaToken);
    if (ip && ip !== 'unknown') formData.append('remoteip', ip);

    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });
    const outcome = (await verifyRes.json()) as any;
    if (!outcome.success) {
      logger.warn('CAPTCHA attestation failed during WhatsApp challenge request', { integrationId });
      throw Boom.forbidden('Attestation failed');
    }
  } else {
    throw Boom.badImplementation('Unsupported CAPTCHA provider');
  }

  // Retrieve client's configured WhatsApp account and check connection readiness
  await integration.populate('clientId');
  const client = integration.clientId as any;
  if (!client) {
    logger.error('Integration has no valid client', { integrationId });
    throw Boom.badImplementation('Integration client is missing');
  }

  const waAccount = await WhatsAppAccount.findOne({
    clientId: client._id,
    status: 'connected',
  });
  if (!waAccount || !waAccount.instanceId) {
    logger.warn('WhatsApp instance not connected for client', { clientId: client._id });
    throw Boom.serverUnavailable('WhatsApp instance is not connected for this business');
  }

  const activeSock = getActiveSocket(waAccount.instanceId);
  if (!activeSock) {
    logger.warn('WhatsApp active socket offline for instance', { instanceId: waAccount.instanceId });
    throw Boom.serverUnavailable('WhatsApp service is currently offline for this business');
  }

  const rawBusinessNumber =
    waAccount.phoneNumber ||
    client.whatsappNumber ||
    (activeSock.user?.id ? activeSock.user.id.split('@')[0].split(':')[0] : '');
  const businessNumber = normalizePhone(rawBusinessNumber);
  if (!businessNumber || businessNumber.length < 7) {
    logger.error('Client has no valid WhatsApp business number configured', { clientId: client._id });
    throw Boom.badImplementation('Business WhatsApp contact is not configured');
  }

  // Generate 128-bit unpredictable challenge code (32 uppercase hex characters)
  const challengeCode = crypto.randomBytes(16).toString('hex').toUpperCase();
  const challengeId = crypto.randomUUID();
  const pollToken = crypto.randomBytes(16).toString('hex');
  const expiresIn = 600; // 10 minutes

  // Namespace challenge key by instanceId to enforce absolute multi-tenant instance isolation
  const challengeKey = `wa:challenge:${waAccount.instanceId}:${challengeCode}`;
  const sessionKey = `wa:session:${challengeId}`;

  const challengeData = {
    challengeId,
    integrationId,
    instanceId: waAccount.instanceId,
    clientId: client._id.toString(),
    businessNumber,
    pollToken,
    createdAt: Date.now(),
  };

  const sessionData = {
    challengeCode,
    integrationId,
    instanceId: waAccount.instanceId,
    pollToken,
    verified: false,
    createdAt: Date.now(),
  };

  // Atomically store challenge and session mapping
  const storeTx = redis.multi();
  storeTx.set(challengeKey, JSON.stringify(challengeData), 'EX', expiresIn);
  storeTx.set(sessionKey, JSON.stringify(sessionData), 'EX', expiresIn);
  await storeTx.exec();

  const waLink = `https://wa.me/${businessNumber}?text=VERIFY%20${challengeCode}`;

  return {
    success: true,
    challengeId,
    pollToken,
    challengeCode,
    waLink,
    businessNumber,
    expiresIn,
  };
}

/**
 * Intercept and process an incoming WhatsApp message checking for a challenge code.
 * Returns true if the message was an authenticated verification code, false otherwise.
 */
export async function handleInboundVerificationMessage(
  instanceId: string,
  chatId: string,
  text: string,
  sock: any
): Promise<boolean> {
  if (!text || typeof text !== 'string') return false;

  const match = text.trim().match(/^VERIFY\s+([A-Fa-f0-9]{32})$/i);
  if (!match) return false;

  // Strict JID eligibility: Reject group chats, LID privacy identities, broadcasts, newsletters
  if (!chatId || typeof chatId !== 'string') return false;
  if (
    chatId.endsWith('@g.us') ||
    chatId.endsWith('@lid') ||
    chatId.endsWith('@broadcast') ||
    chatId.endsWith('@newsletter')
  ) {
    logger.warn('Rejected verification from unsupported or group JID', { chatId, instanceId });
    return false;
  }
  if (!chatId.endsWith('@s.whatsapp.net') && !chatId.endsWith('@c.us')) {
    logger.warn('Rejected verification from non-user JID', { chatId, instanceId });
    return false;
  }

  // Extract and validate sender phone directly from standard WhatsApp user JID
  const userPart = chatId.split('@')[0].split(':')[0];
  if (!/^\d{7,15}$/.test(userPart)) {
    logger.warn('Could not derive valid phone from incoming WhatsApp sender', { chatId });
    return false;
  }
  const senderPhone = normalizePhone(userPart);

  const challengeCode = match[1].toUpperCase();
  const redis = getRedisClient();

  // Look up challenge namespaced to the receiving instanceId to prevent cross-tenant leaks
  const challengeKey = `wa:challenge:${instanceId}:${challengeCode}`;

  // Atomically get and delete the challenge key to prevent replay or concurrent consumption
  const rawChallenge = await redis.getdel(challengeKey);
  if (!rawChallenge) {
    logger.warn('Inbound WhatsApp verification received invalid, foreign, or already consumed code', { instanceId });
    return false;
  }

  let challenge: any;
  try {
    challenge = JSON.parse(rawChallenge);
  } catch {
    return false;
  }

  // Explicit Tenant & Instance Verification
  if (challenge.instanceId !== instanceId) {
    logger.warn('Cross-tenant verification attempt blocked', {
      challengeInstanceId: challenge.instanceId,
      receivingInstanceId: instanceId,
    });
    return false;
  }

  // Issue verification token with 15 minutes TTL
  const verificationToken = crypto.randomBytes(24).toString('hex');
  const vtKey = `otp:verified:${challenge.integrationId}:${verificationToken}`;

  const sessionKey = `wa:session:${challenge.challengeId}`;
  const updatedSession = {
    challengeCode,
    integrationId: challenge.integrationId,
    instanceId,
    pollToken: challenge.pollToken,
    verified: true,
    verifiedMobile: senderPhone,
    verificationToken,
    verifiedAt: Date.now(),
  };

  const tx = redis.multi();
  tx.set(vtKey, senderPhone, 'EX', 900);
  tx.set(sessionKey, JSON.stringify(updatedSession), 'EX', 900);
  await tx.exec();

  logger.info('WhatsApp inbound verification successful', {
    integrationId: challenge.integrationId,
    challengeId: challenge.challengeId,
    instanceId,
  });

  // Send operational acknowledgement reply back to the sender
  // Mark with __blastupSystemReply: true so SafeMode permits it as an operational reply
  try {
    const confirmationText =
      `✅ Verification successful! Your WhatsApp number has been verified.\n\n` +
      `You can now return to the website to submit your enquiry.`;
    await sock.sendMessage(chatId, { text: confirmationText, __blastupSystemReply: true });
  } catch (err) {
    logger.warn('Failed to send WhatsApp verification confirmation reply', { error: String(err) });
  }

  return true;
}

/**
 * Poll the verification status of an active challenge.
 */
export async function getChallengeStatus(params: ChallengeStatusParams): Promise<ChallengeStatusResult> {
  const { integrationId, challengeId, pollToken, ip } = params;

  const redis = getRedisClient();

  // Rate limit polling per IP to prevent polling abuse (max 90 polls per minute per IP)
  const pollLimitKey = `ratelimit:wa-poll:ip:${ip}`;
  const pollCount = await redis.incr(pollLimitKey);
  if (pollCount === 1) await redis.expire(pollLimitKey, 60);
  if (pollCount > 90) {
    throw Boom.tooManyRequests('Too many polling requests. Please wait.');
  }

  const sessionKey = `wa:session:${challengeId}`;
  const rawSession = await redis.get(sessionKey);

  if (!rawSession) {
    return {
      success: true,
      verified: false,
      expired: true,
    };
  }

  let session: any;
  try {
    session = JSON.parse(rawSession);
  } catch {
    return {
      success: true,
      verified: false,
      expired: true,
    };
  }

  // Prevent cross-integration and cross-browser challenge inspection
  if (session.integrationId !== integrationId || session.pollToken !== pollToken) {
    throw Boom.forbidden('Invalid or unauthorized challenge session');
  }

  if (session.verified === true) {
    return {
      success: true,
      verified: true,
      verifiedMobile: session.verifiedMobile,
      verificationToken: session.verificationToken,
    };
  }

  return {
    success: true,
    verified: false,
  };
}
