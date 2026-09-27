'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Check, Copy, Code, Key, Shield, Webhook, Activity } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function IntegrationCenterPage() {
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);

  const copyToClipboard = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const endpoint = "https://api.tabdealdigital.in/api/notifications/event";
  const curlExample = `curl -X POST ${endpoint} \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "customer.thank_you",
    "eventId": "example-unique-event-id",
    "to": "919XXXXXXXXX",
    "variables": {
      "customer_name": "Customer",
      "business_name": "Business"
    }
  }'`;

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8 pb-12">
      <PageHeader 
        title="Integration Center" 
        description="Connect your website or backend to the Blastup transactional notification API."
        action={
          <Link href="/dashboard/integration/keys">
            <Button variant="primary" className="flex items-center gap-2">
              <Key className="w-4 h-4" /> Manage API Keys
            </Button>
          </Link>
        }
      />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-600" /> Integration Overview
        </h2>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            TABDEAL Blastup operates as a centralized self-hosted WhatsApp Web / Baileys-based transactional notification platform. Your CRM, website, or backend sends a single JSON payload to our REST API. We securely queue, rate-limit, and dispatch the WhatsApp message to your customer via your provisioned container.
          </p>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 font-mono text-sm text-gray-700 flex flex-col md:flex-row items-center justify-center gap-4 text-center">
            <div className="bg-white px-4 py-2 rounded shadow-sm border border-gray-200">Your Backend</div>
            <div className="text-indigo-400 font-bold">→ HTTPS POST →</div>
            <div className="bg-indigo-50 px-4 py-2 rounded shadow-sm border border-indigo-200 text-indigo-800">Blastup API</div>
            <div className="text-emerald-400 font-bold">→ Dispatches via →</div>
            <div className="bg-emerald-50 px-4 py-2 rounded shadow-sm border border-emerald-200 text-emerald-800">WhatsApp Web</div>
          </div>
        </Card>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Webhook className="w-5 h-5 text-indigo-600" /> API Documentation
          </h2>
          
          <Card className="p-6 space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Endpoint</h4>
                <Button variant="secondary" size="sm" onClick={() => copyToClipboard(endpoint, setCopiedEndpoint)} className="h-7 text-xs">
                  {copiedEndpoint ? <Check className="w-3 h-3 mr-1.5 text-emerald-600" /> : <Copy className="w-3 h-3 mr-1.5" />}
                  {copiedEndpoint ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <code className="block bg-gray-900 text-gray-100 p-3 rounded-lg text-sm overflow-x-auto shadow-inner">
                <span className="text-indigo-400">POST</span> {endpoint}
              </code>
            </div>

            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">Authentication</h4>
              <p className="text-sm text-gray-600 mb-2">Provide your API key in the request headers.</p>
              <code className="block bg-gray-900 text-gray-100 p-3 rounded-lg text-sm overflow-x-auto shadow-inner">
                <span className="text-blue-300">x-api-key:</span> YOUR_API_KEY<br/>
                <span className="text-blue-300">Content-Type:</span> application/json
              </code>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Example Request</h4>
                <Button variant="secondary" size="sm" onClick={() => copyToClipboard(curlExample, setCopiedCurl)} className="h-7 text-xs">
                  {copiedCurl ? <Check className="w-3 h-3 mr-1.5 text-emerald-600" /> : <Copy className="w-3 h-3 mr-1.5" />}
                  {copiedCurl ? 'Copied' : 'Copy cURL'}
                </Button>
              </div>
              <pre className="block bg-gray-900 text-gray-100 p-3 rounded-lg text-sm overflow-x-auto shadow-inner">
{JSON.stringify({
  event: "customer.thank_you",
  eventId: "example-unique-event-id",
  to: "919XXXXXXXXX",
  variables: {
    customer_name: "Customer",
    business_name: "Business"
  }
}, null, 2)}
              </pre>
            </div>
            
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-indigo-900 mb-2">Payload Parameters</h4>
              <ul className="text-sm text-indigo-800 space-y-2">
                <li><code className="bg-white px-1 py-0.5 rounded text-indigo-900 font-bold">event</code>: The exact slug of your configured template.</li>
                <li><code className="bg-white px-1 py-0.5 rounded text-indigo-900 font-bold">eventId</code>: A unique ID per transaction (e.g. your Order ID).</li>
                <li><code className="bg-white px-1 py-0.5 rounded text-indigo-900 font-bold">to</code>: Recipient's phone number with country code.</li>
                <li><code className="bg-white px-1 py-0.5 rounded text-indigo-900 font-bold">variables</code>: JSON object replacing dynamic placeholders.</li>
              </ul>
            </div>
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Code className="w-5 h-5 text-indigo-600" /> Responses & Errors
          </h2>
          
          <Card className="p-6 space-y-6 flex flex-col h-full">
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">Idempotency & Success</h4>
              <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                We guarantee idempotency. If you send the same <code className="bg-gray-100 px-1 rounded">eventId</code> multiple times, we will safely discard the duplicates and prevent duplicate WhatsApp messages from being sent.
              </p>
              
              <div className="space-y-3">
                <div className="border border-emerald-200 rounded-lg overflow-hidden">
                  <div className="bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 border-b border-emerald-200">
                    HTTP 202 Accepted (First Request)
                  </div>
                  <pre className="bg-gray-900 text-emerald-300 p-3 text-xs overflow-x-auto m-0">
{`{
  "success": true,
  "status": "accepted",
  "eventLogId": "65b9d...f1a"
}`}
                  </pre>
                </div>

                <div className="border border-blue-200 rounded-lg overflow-hidden">
                  <div className="bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800 border-b border-blue-200">
                    HTTP 200 OK (Duplicate request ignored)
                  </div>
                  <pre className="bg-gray-900 text-blue-300 p-3 text-xs overflow-x-auto m-0">
{`{
  "success": true,
  "status": "duplicate",
  "eventLogId": "65b9d...f1a"
}`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 mt-auto">
              <h4 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">Error Codes</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li><strong className="text-rose-600">400</strong> - Invalid request schema or missing variables</li>
                <li><strong className="text-rose-600">401</strong> - Invalid, missing, or revoked API key</li>
                <li><strong className="text-rose-600">403</strong> - Your client tenant is suspended</li>
                <li><strong className="text-rose-600">404</strong> - Event template mapping not found or disabled</li>
                <li><strong className="text-rose-600">429</strong> - SafeMode active (rate-limited)</li>
                <li><strong className="text-rose-600">503</strong> - WhatsApp container disconnected</li>
              </ul>
            </div>
          </Card>
        </section>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-600" /> Security Guidance
        </h2>
        <Card className="p-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
            <h4 className="text-sm font-bold text-amber-900 mb-2">Cryptographic Key Isolation</h4>
            <p className="text-sm text-amber-800 mb-4">
              Blastup only stores cryptographic hashes of your API keys. We cannot retrieve your raw key. If you lose your API key, you must generate a new one and delete the old one.
            </p>
            <ul className="text-sm text-amber-800 space-y-2 list-disc list-inside">
              <li>Never commit your API key to GitHub or public repositories.</li>
              <li>Never expose your API key in client-side code (e.g., React, Vue, mobile apps).</li>
              <li>Always call the Blastup API securely from your backend server.</li>
            </ul>
          </div>
        </Card>
      </section>
    </div>
  );
}
