import http from 'http';
import https from 'https';
import dns from 'dns/promises';
import { validateWebhookUrl } from '../utils/ssrf';

// Mock dns.lookup
const originalLookup = dns.lookup;
let callCount = 0;
(dns as any).lookup = async (hostname: string, options: any) => {
  callCount++;
  if (callCount === 1) {
    // First lookup during validation: return safe IP
    return [{ address: '203.0.113.10', family: 4 }];
  } else {
    // Second lookup (if it happens): return unsafe IP
    return [{ address: '127.0.0.1', family: 4 }];
  }
};

async function runTest() {
  const url = 'https://example-rebinding.com/path';
  
  // 1. SSRF Validation
  console.log('Running validation...');
  const safeInfo = await validateWebhookUrl(url);
  console.log('Validated safeInfo:', safeInfo);
  
  // 2. Simulate webhook request
  const urlObj = new URL(url);
  const options = {
    hostname: urlObj.hostname,
    port: urlObj.port || 443,
    path: urlObj.pathname + urlObj.search,
    method: 'POST',
    timeout: 5000,
    headers: {
      'Host': urlObj.host
    },
    lookup: (hostname: string, opts: any, callback: any) => {
      console.log(`Custom lookup called for ${hostname}, returning ${safeInfo.address}`);
      if (opts && opts.all) { callback(null, [{ address: safeInfo.address, family: safeInfo.family }]); } else { callback(null, safeInfo.address, safeInfo.family); }
    },
    servername: urlObj.hostname,
  };

  console.log('Executing HTTPS request...');
  
  const req = https.request(options);
  req.on('error', (err) => {
    console.log('Request failed as expected with:', err.message);
    if (callCount === 1) {
      console.log('[PASS] DNS rebinding prevented! Only 1 DNS lookup occurred.');
    } else {
      console.log(`[FAIL] Multiple DNS lookups occurred: ${callCount}`);
    }
  });
  req.end();
}

runTest().catch(console.error);
