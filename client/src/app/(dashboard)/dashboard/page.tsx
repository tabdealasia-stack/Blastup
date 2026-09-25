'use client';

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
