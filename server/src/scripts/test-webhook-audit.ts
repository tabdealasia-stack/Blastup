import { env } from '../config/env';
import { encryptWebhookSecret, decryptWebhookSecret, generateWebhookSecret, generateWebhookSignature } from '../utils/webhookCrypto';
import { validateWebhookUrl } from '../utils/ssrf';

async function runTests() {
  console.log('--- Crypto Tests ---');
  const secret = generateWebhookSecret();
  console.log('Generated secret length:', secret.length);
  
  const encrypted = encryptWebhookSecret(secret);
  const decrypted = decryptWebhookSecret(encrypted);
  console.log('Decrypted matches original:', decrypted === secret);
  
  const sig = generateWebhookSignature(secret, '12345', '{"test":true}');
  console.log('Signature generated:', !!sig);

  console.log('\n--- SSRF Tests ---');
  const urls = [
    'https://localhost:8080/hook',
    'https://127.0.0.1/hook',
    'https://10.0.0.5/hook',
    'https://172.16.0.5/hook',
    'https://192.168.1.1/hook',
    'https://169.254.169.254/hook',
    'https://[::1]/hook',
    'http://example.com/hook'
  ];
  
  for (const url of urls) {
    try {
      await validateWebhookUrl(url);
      console.log(`[FAIL] URL allowed: ${url}`);
    } catch (e: any) {
      console.log(`[PASS] URL blocked: ${url} - ${e.message}`);
    }
  }
}

runTests().catch(console.error);
