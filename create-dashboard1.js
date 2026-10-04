const fs = require('fs');

fs.mkdirSync('client/src/app/(dashboard)/dashboard/whatsapp', { recursive: true });
fs.mkdirSync('client/src/app/(dashboard)/dashboard/templates', { recursive: true });
fs.mkdirSync('client/src/app/(dashboard)/dashboard/integration/keys', { recursive: true });
fs.mkdirSync('client/src/app/(dashboard)/dashboard/notifications', { recursive: true });
fs.mkdirSync('client/src/app/(dashboard)/dashboard/message-logs', { recursive: true });

// 1. Dashboard Overview
fs.writeFileSync('client/src/app/(dashboard)/dashboard/page.tsx', `'use client';

import useSWR from 'swr';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { whatsappApi, clientTemplatesApi } from '@/lib/api';
import { ShieldAlert, Zap, MessageSquare } from 'lucide-react';

export default function ClientDashboardPage() {
  const { data: statusData } = useSWR('/api/whatsapp/status', whatsappApi.getStatus);
  const { data: templatesData } = useSWR('/api/client-templates', clientTemplatesApi.list);

  const isConnected = statusData?.data?.status === 'connected';

  return (
    <div>
      <PageHeader 
        title="Dashboard Overview" 
        description="View your active platform integrations and status."
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">WhatsApp Status</h3>
              <div className="mt-1 flex items-baseline">
                <p className="text-xl font-semibold text-gray-900">
                  {statusData?.data?.status || 'Unknown'}
                </p>
                {isConnected && (
                  <span className="ml-2 text-sm font-medium text-green-600">Connected</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Active Templates</h3>
              <div className="mt-1 flex items-baseline">
                <p className="text-xl font-semibold text-gray-900">
                  {templatesData?.pagination?.total || 0}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gray-50 border-gray-200 border-dashed border-2">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShieldAlert className="h-6 w-6 text-gray-400" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Notification Volume</h3>
              <div className="mt-1 flex items-baseline">
                <p className="text-sm text-gray-400 italic">Metrics unavailable</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

    </div>
  );
}
`, 'utf8');

// 2. WhatsApp
fs.writeFileSync('client/src/app/(dashboard)/dashboard/whatsapp/page.tsx', `'use client';

import useSWR from 'swr';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { whatsappApi } from '@/lib/api';

export default function ClientWhatsAppPage() {
  const { data: statusData, isLoading } = useSWR('/api/whatsapp/status', whatsappApi.getStatus, { refreshInterval: 15000 });

  return (
    <div>
      <PageHeader 
        title="WhatsApp Connectivity" 
        description="View your active WhatsApp connection status."
      />

      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Connection Details</h3>
        
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-100 rounded w-1/4"></div>
            <div className="h-4 bg-gray-100 rounded w-1/2"></div>
          </div>
        ) : !statusData?.data ? (
          <p className="text-sm text-gray-500 italic">No WhatsApp account paired.</p>
        ) : (
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <Badge variant={statusData.data.status === 'connected' ? 'green' : 'red'}>
                  {statusData.data.status}
                </Badge>
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
              <dd className="mt-1 text-sm text-gray-900">{statusData.data.phoneNumber || 'Unknown'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Display Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{statusData.data.pushName || 'Unknown'}</dd>
            </div>
          </dl>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-100 p-4 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> WhatsApp provisioning, pairing, and lifecycle management are controlled securely by TABDEAL administrators. Contact support if you need to reconnect or update your number.
          </p>
        </div>
      </Card>
    </div>
  );
}
`, 'utf8');

// 3. Templates
fs.writeFileSync('client/src/app/(dashboard)/dashboard/templates/page.tsx', `'use client';

import useSWR from 'swr';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ErrorState, EmptyState } from '@/components/ui/States';
import { clientTemplatesApi } from '@/lib/api';

export default function ClientTemplatesPage() {
  const { data, error, isLoading } = useSWR('/api/client-templates', clientTemplatesApi.list);

  return (
    <div>
      <PageHeader 
        title="My Templates" 
        description="View notification templates provisioned for your account."
      />

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        ) : error ? (
          <ErrorState title="Failed to load templates" />
        ) : !data?.data || data.data.length === 0 ? (
          <EmptyState title="No templates assigned" description="Contact support to provision your templates." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Slug</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variables Mapping</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.data.map((ct: any) => (
                  <tr key={ct._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{ct.templateId?.name || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {ct.templateId?.event || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={ct.enabled ? 'green' : 'gray'}>
                        {ct.enabled ? 'Active' : 'Disabled'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 truncate max-w-xs">
                      {ct.variables && Object.keys(ct.variables).length > 0 
                        ? Object.entries(ct.variables).map(([k, v]) => \`\${k}:\${v}\`).join(', ')
                        : 'Default mapped'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
`, 'utf8');

