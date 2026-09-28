'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorState, EmptyState } from '@/components/ui/States';
import Pagination from '@/components/ui/Pagination';
import { tabdealApi } from '@/lib/api';
import { Search, Filter, X, Activity, ServerCrash, Ban, Clock, CheckCircle } from 'lucide-react';

export default function SuperadminNotificationsPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  
  // Real-time values for SWR fetch
  const [activeQuery, setActiveQuery] = useState({ search: '', status: '' });

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(activeQuery.search ? { search: activeQuery.search } : {}),
    ...(activeQuery.status ? { status: activeQuery.status } : {}),
  });

  const { data, error, isLoading } = useSWR(
    `/api/tabdeal/event-logs?${queryParams.toString()}`,
    () => tabdealApi.getEventLogs({
      page,
      limit,
      search: activeQuery.search || undefined,
      status: activeQuery.status || undefined
    })
  );

  const { data: metricsData } = useSWR('/api/tabdeal/dashboard-metrics', () => tabdealApi.getDashboardMetrics(), {
    refreshInterval: 30000
  });
  const metrics = metricsData?.data;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setActiveQuery({ search, status });
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setPage(1);
    setActiveQuery({ search: '', status: '' });
  };

  const hasFilters = activeQuery.search || activeQuery.status;

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-6 pb-12">
      <PageHeader 
        title="Global Notification Events" 
        description="Monitor notification events processed by the platform across all clients."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Events Today</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{metrics?.eventsToday ?? '-'}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
        </Card>
        <Card className="p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Queued</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{metrics?.queuedToday ?? '-'}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
        </Card>
        <Card className="p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sent (Provider)</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{metrics?.sentToday ?? '-'}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
        </Card>
        <Card className="p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Failed / Skipped</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">
              {(metrics?.failedToday || 0) + (metrics?.skippedEventsToday || 0) > 0 ? (metrics.failedToday + metrics.skippedEventsToday) : '-'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
            <ServerCrash className="w-5 h-5 text-rose-600" />
          </div>
        </Card>
      </div>

      <Card className="mb-6 shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search event or ID..."
                className="pl-9 w-full"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex w-full sm:w-auto gap-3">
              <select
                className="block w-full sm:w-[160px] rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="processing">Processing</option>
                <option value="sent">Sent</option>
                <option value="skipped">Skipped</option>
                <option value="failed">Failed</option>
              </select>
              <Button type="submit" variant="secondary" className="whitespace-nowrap">Filter</Button>
              {hasFilters && (
                <Button type="button" variant="ghost" onClick={clearFilters} className="text-gray-500 whitespace-nowrap">
                  <X className="w-4 h-4 mr-1" /> Clear
                </Button>
              )}
            </div>
          </form>
        </div>

        {isLoading ? (
          <div className="p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-50 rounded-lg"></div>
              ))}
            </div>
          </div>
        ) : error ? (
          <ErrorState title="Failed to load events" description="An error occurred communicating with the server." />
        ) : !data?.data || data.data.length === 0 ? (
          <EmptyState 
            title={hasFilters ? "No events found" : "No notifications yet"}
            description={hasFilters ? "Try adjusting your search criteria." : "Event logs will populate here once clients trigger notifications."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client Identity</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Event Metadata</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created (IST)</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Details / Errors</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {data.data.map((log: any) => (
                  <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{log.clientId?.businessName || 'Unknown Client'}</div>
                      <div className="text-xs font-mono text-gray-500 mt-0.5">{log.clientId?.slug || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{log.event}</div>
                      <div className="text-xs font-mono text-gray-500 mt-0.5" title={log.eventId}>
                        {log.eventId?.length > 20 ? log.eventId.substring(0, 20) + '...' : log.eventId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={
                        log.status === 'sent' ? 'success' : 
                        log.status === 'failed' ? 'danger' : 
                        log.status === 'skipped' ? 'gray' : 'warning'
                      }>
                        {log.status}
                      </Badge>
                      {log.attempts > 1 && <span className="ml-2 text-xs font-medium text-gray-400">({log.attempts} attempts)</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(log.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </td>
                    <td className="px-6 py-4 text-sm max-w-xs">
                      {log.status === 'skipped' || log.status === 'failed' ? (
                        <div className="text-rose-600 text-xs truncate font-medium" title={log.errorMessage || 'System error'}>
                          {log.errorMessage || 'Unknown error'}
                        </div>
                      ) : log.messageLogId ? (
                        <div className="text-emerald-600 text-xs font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Dispatched
                        </div>
                      ) : (
                        <div className="text-gray-400 text-xs italic">Queued for processing</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.pagination && data.pagination.pages > 1 && (
              <div className="border-t border-gray-100 px-6 py-4 bg-white">
                <Pagination 
                  page={data.pagination.page}
                  pages={data.pagination.pages}
                  total={data.pagination.total}
                  pageSize={data.pagination.limit}
                  onPageChange={setPage}
                  compact
                />
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
