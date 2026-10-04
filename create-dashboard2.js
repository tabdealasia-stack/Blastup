const fs = require('fs');

// 4. Integration Center
fs.writeFileSync('client/src/app/(dashboard)/dashboard/integration/page.tsx', `'use client';

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

  const curlExample = \`curl -X POST https://api.tabdealdigital.in/api/notifications/event \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "event": "customer.thank_you",
    "eventId": "unique-order-123",
    "to": "919XXXXXXXXX",
    "variables": {
      "customer_name": "John Doe",
      "business_name": "Your Store"
    }
  }'\`;

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
`, 'utf8');

// 5. API Keys
fs.writeFileSync('client/src/app/(dashboard)/dashboard/integration/keys/page.tsx', `'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ErrorState, EmptyState } from '@/components/ui/States';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Key, Copy, Check, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function ApiKeysPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/keys', () => api.keys.list());
  
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    
    setIsCreating(true);
    setGeneratedKey(null);
    try {
      const res = await api.keys.create(newKeyName.trim());
      setGeneratedKey(res.data.key);
      setNewKeyName('');
      toast.success('API Key generated successfully.');
      mutate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create API key');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this API Key? Integrations using it will fail immediately.')) return;
    try {
      await api.keys.delete(id);
      toast.success('API Key deleted');
      mutate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <PageHeader 
        title="API Credentials" 
        description="Manage keys used to authenticate your website against the Blastup API."
        action={
          <Link href="/dashboard/integration">
            <Button variant="secondary">Back to Integration</Button>
          </Link>
        }
      />

      {generatedKey && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-6 shadow-sm">
          <h3 className="text-lg font-medium text-green-800 mb-2">Save your API Key</h3>
          <p className="text-sm text-green-700 mb-4">
            Please copy this key and store it securely. You will not be able to see it again.
          </p>
          <div className="flex items-center gap-3">
            <code className="bg-white px-4 py-2 rounded border border-green-300 font-mono text-sm text-gray-800 flex-1 break-all">
              {generatedKey}
            </code>
            <Button variant="primary" onClick={() => copyToClipboard(generatedKey)}>
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Generate New Key</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Key Name / Identifier</label>
                <Input 
                  placeholder="e.g. Production Website" 
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" variant="primary" className="w-full" isLoading={isCreating} disabled={!newKeyName.trim()}>
                Create API Key
              </Button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-gray-500" /> Active Keys
              </h3>
            </div>
            
            {isLoading ? (
              <div className="p-8">
                <div className="animate-pulse space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-100 rounded"></div>
                  ))}
                </div>
              </div>
            ) : error ? (
              <ErrorState title="Failed to load API keys" />
            ) : !data?.data || data.data.length === 0 ? (
              <EmptyState title="No API Keys" description="Generate an API key to connect your website." />
            ) : (
              <ul className="divide-y divide-gray-200">
                {data.data.map((k: any) => (
                  <li key={k._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{k.name}</span>
                        <Badge variant="green">Active</Badge>
                      </div>
                      <div className="text-sm text-gray-500 mt-1 font-mono">
                        {k.keyPrefix}••••••••••••
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Created: {new Date(k.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(k._id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
`, 'utf8');

