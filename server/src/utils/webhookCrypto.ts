import crypto from 'crypto';
import { env } from '../config/env';

/**
 * Encrypt sensitive data using AES-256-GCM specifically for webhooks.
 * This ensures webhook secrets are safely encrypted using their own key.
 */
export function encryptWebhookSecret(text: string): string {
  const iv = crypto.randomBytes(16);
  // scryptSync derives a 32-byte key from the environment secret
  const key = crypto.scryptSync(env.WEBHOOK_ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${encrypted}:${authTag}`;
}

/**
 * Decrypt AES-256-GCM encrypted data for webhooks.
 */
export function decryptWebhookSecret(data: string): string {
  const [ivHex, encrypted, authTagHex] = data.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = crypto.scryptSync(env.WEBHOOK_ENCRYPTION_KEY, 'salt', 32);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generate a cryptographically secure random string for webhook secrets.
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generate HMAC-SHA256 signature for webhook payloads.
 */
export function generateWebhookSignature(secret: string, timestamp: string, payloadBody: string): string {
  const hmac = crypto.createHash('sha256'); // The prompt specified HMAC-SHA256
  // Wait, crypto.createHash is not HMAC. Let's use crypto.createHmac.
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payloadBody}`)
    .digest('hex');
  return signature;
}
