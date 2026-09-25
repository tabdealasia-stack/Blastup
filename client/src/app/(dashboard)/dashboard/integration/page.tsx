'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function IntegrationCenterPage() {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const curlExample = `curl -X POST https://api.tabdealdigital.in/api/notifications/event \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "customer.thank_you",
    "eventId": "unique-order-123",
    "to": "919XXXXXXXXX",
    "variables": {
      "customer_name": "John Doe",
      "business_name": "Your Store"
    }
  }'`;

  return (
    <div>
      <PageHeader 
        title="Integration Center" 
        description="Connect your website or backend to the Blastup notification API."
        action={
          <Link href="/dashboard/integration/keys">
            <Button variant="primary">Manage API Keys</Button>
          </Link>
        }
      />

      <Card className="p-6 mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">How it works</h3>
        <p className="text-sm text-gray-600 mb-4">
          TABDEAL Blastup acts as your WhatsApp notification gateway. Your system sends a simple JSON payload to our API, and we safely process, queue, and dispatch the WhatsApp message to your customer.
        </p>

        <div className="bg-gray-50 p-4 rounded-md border border-gray-100 font-mono text-sm text-gray-700 flex flex-col md:flex-row items-center justify-center gap-4 text-center">
          <div>Your Website/Backend</div>
          <div className="text-gray-400">? (API) ?</div>
          <div>Blastup Notification API</div>
          <div className="text-gray-400">? (Outbox) ?</div>
          <div>WhatsApp Web</div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="text-lg font-medium text-gray-900">API Documentation</h3>
          <Button variant="secondary" size="sm" onClick={() => copyToClipboard(curlExample)}>
            {copied ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? 'Copied' : 'Copy cURL'}
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Endpoint</h4>
            <code className="block mt-1 bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
              POST https://api.tabdealdigital.in/api/notifications/event
            </code>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900">Headers</h4>
            <code className="block mt-1 bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
              x-api-key: YOUR_API_KEY<br/>
              Content-Type: application/json
            </code>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900">Payload Example</h4>
            <pre className="block mt-1 bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
{JSON.stringify({
  event: "customer.thank_you",
  eventId: "unique-order-123",
  to: "919XXXXXXXXX",
  variables: {
    customer_name: "John Doe",
    business_name: "Your Store"
  }
}, null, 2)}
            </pre>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Payload Properties</h3>
                <div className="mt-2 text-sm text-blue-700 space-y-2">
                  <p><strong>event</strong>: The exact slug of the notification template (found in My Templates).</p>
                  <p><strong>eventId</strong>: A unique idempotency key (e.g. your order ID) to prevent duplicate messages.</p>
                  <p><strong>to</strong>: The recipient's WhatsApp number with country code (e.g. 919876543210).</p>
                  <p><strong>variables</strong>: Key-value pairs replacing dynamic placeholders in the template.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
