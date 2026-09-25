'use client';

import useSWR from 'swr';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { ErrorState, EmptyState } from '@/components/ui/States';
import { Users, Activity, CheckCircle, XCircle, Clock, AlertTriangle, Send } from 'lucide-react';
import { tabdealApi } from '@/lib/api';

export default function SuperadminDashboard() {
  const { data, error, isLoading } = useSWR('/api/tabdeal/dashboard-metrics', tabdealApi.getDashboardMetrics);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Superadmin Dashboard" description="Overview of platform performance and metrics" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="h-6 w-6 bg-gray-200 rounded-full mb-4 animate-pulse"></div>
              <div className="h-8 w-16 bg-gray-200 rounded mb-2 animate-pulse"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Superadmin Dashboard" description="Overview of platform performance and metrics" />
        <ErrorState title="Failed to load metrics" description="An error occurred while fetching dashboard data." />
      </div>
    );
  }

  const metrics = data?.data;

  if (!metrics) return null;

  const statCards = [
    { name: 'Active Clients', value: metrics.totalActiveClients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Events Today', value: metrics.eventsToday, icon: Activity, color: 'text-purple-600', bg: 'bg-purple-100' },
    { name: 'Sent Today', value: metrics.sentToday, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    { name: 'Failed Today', value: metrics.failedToday, icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
    { name: 'Queued Messages', value: metrics.queuedToday, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { name: 'Skipped Events', value: metrics.skippedEventsToday, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  return (
    <div>
      <PageHeader title="Superadmin Dashboard" description="Overview of platform performance and metrics" />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.name} className="p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{stat.value?.toLocaleString() || 0}</dd>
                </dl>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Duplication Defense</h3>
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-gray-50 rounded-lg flex-1">
              <div className="text-sm text-gray-500">Prevented Duplicates</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{metrics.duplicateEventsToday || 0}</div>
            </div>
            <div className="flex-1 text-sm text-gray-500">
              The platform automatically rejects duplicate events based on idempotency keys to protect clients.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
