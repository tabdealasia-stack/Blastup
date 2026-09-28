'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { whatsappApi, clientTemplatesApi, telemetryApi, keysApi } from '@/lib/api';
import { ShieldAlert, MessageSquare, AlertCircle, CheckCircle, Activity, Clock, ServerCrash, Key, ArrowRight } from 'lucide-react';

export default function ClientDashboardPage() {
  const { data: statusData } = useSWR('/api/whatsapp/status', () => whatsappApi.getStatus());
  const { data: templatesData } = useSWR('/api/client-templates?limit=1', () => clientTemplatesApi.list({ limit: 1 }));
  const { data: metricsData } = useSWR('/api/dashboard/metrics', () => telemetryApi.getDashboardMetrics(), { refreshInterval: 30000 });
  const { data: keysData } = useSWR('/api/keys', () => keysApi.list());

  const waStatus = statusData?.data?.status;
  const isWaConnected = waStatus === 'connected';
  const hasTemplates = templatesData?.pagination?.total > 0;
  const hasKeys = keysData?.data && keysData.data.length > 0;
  const isIntegrationReady = hasTemplates && hasKeys;
  const metrics = metricsData?.data;

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-6 pb-12">
      <PageHeader 
        title="Dashboard Overview" 
        description="Monitor your WhatsApp notification infrastructure and integration health."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* WhatsApp Health Card */}
        <Card className="p-6 flex flex-col justify-between border-l-4 border-l-blue-500 shadow-sm">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2 text-blue-600 font-semibold tracking-wide text-sm uppercase">
                <MessageSquare className="w-5 h-5" />
                WhatsApp Connection
              </div>
              <Badge variant={
                isWaConnected ? 'success' : 
                waStatus === 'pending' ? 'warning' : 'gray'
              }>
                {waStatus || 'Unknown'}
              </Badge>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              WhatsApp connection is securely managed by your Blastup administrator. Notifications will be queued if the connection drops.
            </p>
          </div>
          <div className="pt-4 border-t border-gray-100">
             <Link href="/dashboard/whatsapp" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center">
               View WhatsApp Settings <ArrowRight className="w-4 h-4 ml-1" />
             </Link>
          </div>
        </Card>

        {/* Integration Health Card */}
        <Card className="p-6 flex flex-col justify-between border-l-4 border-l-indigo-500 shadow-sm">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2 text-indigo-600 font-semibold tracking-wide text-sm uppercase">
                <Key className="w-5 h-5" />
                Integration Health
              </div>
              <Badge variant={isIntegrationReady ? 'success' : 'warning'}>
                {isIntegrationReady ? 'Ready' : 'Action Required'}
              </Badge>
            </div>
            <div className="space-y-3 mb-6">
               <div className="flex items-center text-sm">
                 {hasKeys ? <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" /> : <AlertCircle className="w-4 h-4 text-amber-500 mr-2" />}
                 <span className={hasKeys ? "text-gray-700" : "text-amber-700 font-medium"}>API Key configured</span>
               </div>
               <div className="flex items-center text-sm">
                 {hasTemplates ? <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" /> : <AlertCircle className="w-4 h-4 text-amber-500 mr-2" />}
                 <span className={hasTemplates ? "text-gray-700" : "text-amber-700 font-medium"}>Templates assigned by administrator</span>
               </div>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-100 flex gap-4">
             <Link href="/dashboard/integration/keys" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center">
               Manage API Keys <ArrowRight className="w-4 h-4 ml-1" />
             </Link>
          </div>
        </Card>
      </div>

      <h2 className="text-lg font-bold text-gray-900 tracking-tight">Today's Traffic</h2>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-600">Events Received</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics?.eventsToday !== undefined ? metrics.eventsToday : '-'}</p>
        </Card>
        
        <Card className="p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-600">Dispatched</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics?.sentToday !== undefined ? metrics.sentToday : '-'}</p>
        </Card>

        <Card className="p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-600">Queued</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics?.queuedToday !== undefined ? metrics.queuedToday : '-'}</p>
        </Card>

        <Card className="p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-50 rounded-lg">
              <ServerCrash className="w-5 h-5 text-rose-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-600">Failed/Skipped</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">
              {metrics?.failedToday !== undefined ? (metrics.failedToday + (metrics.skippedEventsToday || 0)) : '-'}
            </p>
            {metrics?.skippedEventsToday > 0 && (
              <span className="text-xs font-medium text-gray-500">({metrics.skippedEventsToday} skipped)</span>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
