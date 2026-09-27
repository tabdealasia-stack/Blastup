import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Lock, Shield, Key, Users } from 'lucide-react';

export default function ApiKeysPage() {
  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-6 pb-12">
      <PageHeader 
        title="Global API Key Security" 
        description="Operational overview of Tabdeal Blastup API key architecture and integration security."
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
              <Shield className="w-5 h-5 text-indigo-600" />
              Tenant-Scoped Architecture
            </h3>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Blastup enforces strict cryptographic tenant isolation. API keys are strictly scoped to individual clients and are never exposed via a global operational endpoint. This prevents cross-tenant secret leakage and prevents accidental bulk-exposure in the Superadmin dashboard.
            </p>
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-amber-800 mb-2">Security Enforcement Rules:</h4>
              <ul className="text-sm text-amber-700 space-y-2 list-disc list-inside">
                <li>Raw API keys are displayed <strong>exactly once</strong> upon provisioning.</li>
                <li>The Blastup database stores only non-reversible cryptographic hashes.</li>
                <li>Key retrieval or export is mathematically impossible.</li>
                <li>If a key is lost, the client must rotate (revoke and regenerate).</li>
              </ul>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-indigo-600" />
              Managing Client Keys
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              To audit, revoke, or provision new API keys for a specific integration, you must enter that client's isolated 360° environment.
            </p>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-gray-400" />
                <div>
                  <div className="font-semibold text-gray-900">Client Management Directory</div>
                  <div className="text-xs text-gray-500">Navigate to a specific client to manage their credentials.</div>
                </div>
              </div>
              <Link href="/tabdeal/clients">
                <Button variant="primary">Go to Clients</Button>
              </Link>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5 bg-indigo-50/50 border-indigo-100">
            <h4 className="text-sm font-bold text-indigo-900 mb-2 uppercase tracking-wider">Authentication Protocol</h4>
            <p className="text-sm text-indigo-800 mb-4">
              Clients authenticate requests to the Notification Engine using either of the following standard headers:
            </p>
            <div className="space-y-3">
              <div className="bg-white border border-indigo-100 rounded p-3 text-xs font-mono text-gray-700 shadow-sm">
                x-api-key: bd_live_...
              </div>
              <div className="text-xs text-indigo-600 font-medium text-center">OR</div>
              <div className="bg-white border border-indigo-100 rounded p-3 text-xs font-mono text-gray-700 shadow-sm">
                Authorization: Bearer bd_live_...
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
