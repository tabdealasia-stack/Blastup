import { URL } from 'url';
import dns from 'dns/promises';
import net from 'net';

export class SSRFError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SSRFError';
  }
}

export interface ValidatedWebhookUrl {
  hostname: string;
  address: string;
  family: number;
  protocol: string;
}

/**
 * Validates a URL against SSRF vulnerabilities by checking its scheme and resolving its IP address.
 * It rejects localhost, link-local, loopback, private IPv4, and metadata IP addresses.
 * 
 * @param urlString The URL to validate
 * @returns The resolved IP address and family if the URL is safe, throws SSRFError otherwise.
 */
export async function validateWebhookUrl(urlString: string): Promise<ValidatedWebhookUrl> {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch (err) {
    throw new SSRFError('Invalid URL format');
  }

  // Only allow HTTPS in production-like logic, but we might allow HTTP for local testing.
  if (url.protocol !== 'https:') {
    throw new SSRFError('Webhook URL must use HTTPS');
  }

  const hostname = url.hostname;

  // Resolve hostname to IP
  let records: any[] = [];
  try {
    records = await dns.lookup(hostname, { all: true });
  } catch (err) {
    throw new SSRFError('Failed to resolve hostname');
  }

  if (records.length === 0) {
    throw new SSRFError('No IP address found for hostname');
  }

  // Check all resolved IPs and reject if any are unsafe to prevent fallback issues
  for (const record of records) {
    if (!isSafeIp(record.address)) {
      throw new SSRFError(`Resolved IP address ${record.address} is prohibited for webhook delivery`);
    }
  }

  // We use the first safe IP
  const selected = records[0];

  return {
    hostname,
    address: selected.address,
    family: selected.family,
    protocol: url.protocol
  };
}

/**
 * Checks if an IP address is a safe public IP, rejecting private/local ranges.
 */
export function isSafeIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4) return false;

    // 0.0.0.0/8
    if (parts[0] === 0) return false;
    // 127.0.0.0/8 (Loopback)
    if (parts[0] === 127) return false;
    // 10.0.0.0/8 (Private)
    if (parts[0] === 10) return false;
    // 172.16.0.0/12 (Private)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return false;
    // 192.168.0.0/16 (Private)
    if (parts[0] === 192 && parts[1] === 168) return false;
    // 169.254.0.0/16 (Link-local)
    if (parts[0] === 169 && parts[1] === 254) return false;
    // 224.0.0.0/4 (Multicast)
    if (parts[0] >= 224 && parts[0] <= 239) return false;
    // 240.0.0.0/4 (Reserved)
    if (parts[0] >= 240 && parts[0] <= 255) return false;
    // Cloud metadata addresses (e.g., 169.254.169.254 covered above)

    return true;
  } else if (net.isIPv6(ip)) {
    // Basic IPv6 checks
    const lower = ip.toLowerCase();
    // ::1 (Loopback)
    if (lower === '::1') return false;
    // Unique local address (fc00::/7)
    if (lower.startsWith('fc') || lower.startsWith('fd')) return false;
    // Link-local address (fe80::/10)
    if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) return false;

    return true;
  }

  return false;
}
