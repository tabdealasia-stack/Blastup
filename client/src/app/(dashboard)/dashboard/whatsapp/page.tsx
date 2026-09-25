'use client';

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
