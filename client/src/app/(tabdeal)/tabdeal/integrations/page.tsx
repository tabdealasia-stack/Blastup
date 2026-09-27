import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Lock, Webhook, Activity, Server, Database } from 'lucide-react';

export default function IntegrationsPage() {
  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-6 pb-12">
      <PageHeader 
        title="Integration Architecture" 
        description="Operational overview of how external client systems communicate with the Blastup platform."
        action={
          <div className="flex items-center text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
            <Lock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
            Superadmin Access
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Webhook className="w-5 h-5 text-indigo-600" />
              The Blastup Notification Engine
            </h3>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Blastup operates as a centralized, self-hosted WhatsApp Web / Baileys-based transactional notification platform. We provide a single, unified REST API endpoint to our clients, abstracting away the complexities of WhatsApp session management, rate-limiting, and payload formatting.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 font-mono text-sm overflow-x-auto whitespace-pre">
              <span className="text-indigo-600 font-bold">POST</span> https://api.tabdealdigital.in/api/notifications/event
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-indigo-600" />
              Delivery & Idempotency
            </h3>
            <div className="space-y-4 text-sm text-gray-600">
              <p>
                The platform ensures stability through the <strong>SafeMode Outbox Worker</strong>. When a client fires an event, it is immediately placed into a Redis-backed queue and acknowledged with an HTTP 202 Accepted status.
              </p>
              <div className="bg-blue-50 border border-blue-100 rounded p-4 text-blue-800">
                <strong>Idempotency Guarantee:</strong> Clients must pass a unique <code className="bg-blue-100 px-1 rounded">eventId</code> per transaction. If Blastup receives a duplicate <code className="bg-blue-100 px-1 rounded">eventId</code> within the TTL window, the request is safely discarded and returns an HTTP 200 Duplicate response without firing a second WhatsApp message.
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-indigo-600" />
              Data Pipeline & Webhooks
            </h3>
            <p className="text-sm text-gray-600">
              Delivery statuses (Sent, Delivered, Read, Failed) are tracked internally within the Blastup EventLog. Real-time outbound webhooks mapping these states back to client CRMs are currently unconfigured in this release phase.
            </p>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider flex items-center gap-2">
              <Server className="w-4 h-4 text-gray-400" /> System Architecture
            </h4>
            <div className="space-y-4">
              <div className="border-l-2 border-indigo-500 pl-3">
                <div className="text-sm font-semibold text-gray-900">Client CRM/Backend</div>
                <div className="text-xs text-gray-500">Initiates the HTTPS POST request</div>
              </div>
              <div className="border-l-2 border-emerald-500 pl-3">
                <div className="text-sm font-semibold text-gray-900">Blastup API</div>
                <div className="text-xs text-gray-500">Authenticates, validates schema & templates</div>
              </div>
              <div className="border-l-2 border-amber-500 pl-3">
                <div className="text-sm font-semibold text-gray-900">Redis Outbox</div>
                <div className="text-xs text-gray-500">Queues for SafeMode rate-limiting</div>
              </div>
              <div className="border-l-2 border-rose-500 pl-3">
                <div className="text-sm font-semibold text-gray-900">Baileys Instance</div>
                <div className="text-xs text-gray-500">Dispatches via assigned WhatsApp session</div>
              </div>
            </div>
          </Card>

          <Link href="/tabdeal/api-keys" className="block">
            <Card className="p-5 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer bg-gray-50/50">
              <h4 className="text-sm font-bold text-indigo-900 mb-1">API Key Management &rarr;</h4>
              <p className="text-xs text-gray-500">Review the platform's cryptographic security and tenant isolation model.</p>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
