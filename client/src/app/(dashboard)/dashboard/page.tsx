'use client';

import useSWR from 'swr';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { whatsappApi, clientTemplatesApi, telemetryApi } from '@/lib/api';
import { ShieldAlert, Zap, MessageSquare, AlertCircle, CheckCircle2, Copy, Send, Activity } from 'lucide-react';

export default function ClientDashboardPage() {
  const { data: statusData } = useSWR('/api/whatsapp/status', whatsappApi.getStatus);
  const { data: templatesData } = useSWR('/api/client-templates', clientTemplatesApi.list);
  const { data: metricsData } = useSWR('/api/dashboard/metrics', telemetryApi.getDashboardMetrics);

  const isConnected = statusData?.data?.status === 'connected';
  const metrics = metricsData?.data;

  return (
    <div>
      <PageHeader 
        title="Dashboard Overview" 
        description="View your active platform integrations and status."
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
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
              <Zap className="h-6 w-6 text-purple-600" />
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

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Events Today</h3>
              <div className="mt-1 flex items-baseline">
                <p className="text-xl font-semibold text-gray-900">
                  {metrics?.eventsToday !== undefined ? metrics.eventsToday : '-'}
                </p>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Send className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Sent Today</h3>
              <div className="mt-1 flex items-baseline">
                <p className="text-xl font-semibold text-gray-900">
                  {metrics?.sentToday !== undefined ? metrics.sentToday : '-'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Queued Today</h3>
              <div className="mt-1 flex items-baseline">
                <p className="text-xl font-semibold text-gray-900">
                  {metrics?.queuedToday !== undefined ? metrics.queuedToday : '-'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShieldAlert className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Failed Today</h3>
              <div className="mt-1 flex items-baseline">
                <p className="text-xl font-semibold text-gray-900">
                  {metrics?.failedToday !== undefined ? metrics.failedToday : '-'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Copy className="h-6 w-6 text-gray-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Duplicates/Skipped</h3>
              <div className="mt-1 flex items-baseline">
                <p className="text-xl font-semibold text-gray-900">
                  {metrics?.skippedEventsToday !== undefined ? metrics.skippedEventsToday : '-'}
                </p>
                {metrics?.duplicateEventsToday > 0 && (
                  <span className="ml-2 text-xs font-medium text-gray-500">
                    ({metrics.duplicateEventsToday} duplicates)
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
