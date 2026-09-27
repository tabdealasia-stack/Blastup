'use client';

import { useState, useEffect } from 'react';
import { 
  Users, Server, MessageSquare, AlertCircle, RefreshCw, Send, CheckCircle, SkipForward, AlertOctagon, Activity, Database
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { tabdealApi } from '@/lib/api';

export default function TabdealDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await tabdealApi.getDashboardMetrics();
      setData(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="animate-in fade-in duration-500">
        <PageHeader title="Management" description="Superadmin Platform Overview" />
        <LoadingState />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="animate-in fade-in duration-500">
        <PageHeader title="Management" description="Superadmin Platform Overview" />
        <ErrorState title="Failed to load dashboard metrics" error={{ message: error }} retry={fetchMetrics} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <PageHeader 
        title="Management" 
        description="Superadmin Platform Overview"
        action={
          <Button variant="outline" onClick={fetchMetrics} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />
      
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-3 text-rose-800">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Metrics Grid */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Today's Traffic</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-5 flex items-start gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Clients</p>
              <h4 className="text-2xl font-bold text-gray-900 mt-1">
                {data?.totalActiveClients ?? '--'}
              </h4>
            </div>
          </Card>
          
          <Card className="p-5 flex items-start gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Events Received</p>
              <h4 className="text-2xl font-bold text-gray-900 mt-1">
                {data?.eventsToday ?? '--'}
              </h4>
            </div>
          </Card>

          <Card className="p-5 flex items-start gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Messages Sent</p>
              <h4 className="text-2xl font-bold text-gray-900 mt-1">
                {data?.sentToday ?? '--'}
              </h4>
            </div>
          </Card>

          <Card className="p-5 flex items-start gap-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-lg shrink-0">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Messages Failed</p>
              <h4 className="text-2xl font-bold text-gray-900 mt-1">
                {data?.failedToday ?? '--'}
              </h4>
            </div>
          </Card>

          <Card className="p-5 flex items-start gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg shrink-0">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Messages Queued</p>
              <h4 className="text-2xl font-bold text-gray-900 mt-1">
                {data?.queuedToday ?? '--'}
              </h4>
            </div>
          </Card>

          <Card className="p-5 flex items-start gap-4">
            <div className="p-3 bg-gray-100 text-gray-600 rounded-lg shrink-0">
              <SkipForward className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Skipped / Duplicates</p>
              <h4 className="text-2xl font-bold text-gray-900 mt-1">
                {data?.skippedEventsToday ?? '--'}
              </h4>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        {/* System Components */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-gray-400" />
              <h3 className="text-base font-semibold text-gray-900">System Infrastructure</h3>
            </div>
          </div>
          <div className="p-6">
            <ul className="space-y-4">
              <li className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-indigo-500" />
                  <span className="text-sm font-medium text-gray-700">API Endpoint</span>
                </div>
                <Badge variant="success">Online</Badge>
              </li>
              <li className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-medium text-gray-700">WhatsApp Engine</span>
                </div>
                <Badge variant="success">Online</Badge>
              </li>
              <li className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-amber-500" />
                  <span className="text-sm font-medium text-gray-700">Redis Queue (SafeMode)</span>
                </div>
                <Badge variant="success">Online</Badge>
              </li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
