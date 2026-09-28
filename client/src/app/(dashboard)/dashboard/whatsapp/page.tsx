'use client';

import useSWR from 'swr';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { whatsappApi } from '@/lib/api';
import { Smartphone, CheckCircle, XCircle, Info, ShieldAlert } from 'lucide-react';

export default function ClientWhatsAppPage() {
  const { data: statusData, isLoading } = useSWR('/api/whatsapp/status', () => whatsappApi.getStatus(), { refreshInterval: 15000 });

  const status = statusData?.data?.status;
  const isConnected = status === 'connected';

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto space-y-6 pb-12">
      <PageHeader 
        title="WhatsApp Status" 
        description="View the current connectivity status of your dedicated WhatsApp node."
      />

      <Card className="p-0 overflow-hidden shadow-sm border border-gray-200">
        <div className="p-6 bg-white">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
            <Smartphone className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">Node Configuration</h3>
          </div>
          
          {isLoading ? (
            <div className="animate-pulse space-y-6">
              <div>
                <div className="h-4 bg-gray-100 rounded w-1/6 mb-2"></div>
                <div className="h-6 bg-gray-50 rounded w-1/4"></div>
              </div>
              <div>
                <div className="h-4 bg-gray-100 rounded w-1/6 mb-2"></div>
                <div className="h-6 bg-gray-50 rounded w-1/4"></div>
              </div>
            </div>
          ) : !statusData?.data ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ShieldAlert className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-900">No WhatsApp account provisioned</p>
              <p className="text-sm text-gray-500 mt-1">Your account has not been assigned a WhatsApp node yet.</p>
            </div>
          ) : (
            <dl className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-1">
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Connection Status</dt>
                <dd className="flex items-center gap-2">
                  <Badge variant={isConnected ? 'success' : status === 'pending' ? 'warning' : 'danger'}>
                    {status || 'Unknown'}
                  </Badge>
                  {isConnected ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500" />
                  )}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Phone Number</dt>
                <dd className="text-sm font-medium text-gray-900 font-mono">
                  {statusData.data.phoneNumber || 'Not synced'}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Push Name</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {statusData.data.pushName || 'Not synced'}
                </dd>
              </div>
            </dl>
          )}
        </div>

        <div className="bg-blue-50/50 border-t border-blue-100 p-6 flex gap-4">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <strong className="font-semibold block mb-1">Managed Infrastructure</strong>
            <p className="text-blue-800/80 leading-relaxed">
              WhatsApp node provisioning, pairing, and lifecycle management are controlled securely by Blastup platform administrators. Contact your account manager if you need to reconnect or update your number.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
