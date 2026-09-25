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
import { telemetryApi } from '@/lib/api';
import { Search, Filter, X } from 'lucide-react';

export default function NotificationsPage() {
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
    `/api/event-logs?${queryParams.toString()}`,
    () => telemetryApi.getEventLogs({
      page,
      limit,
      search: activeQuery.search || undefined,
      status: activeQuery.status || undefined
    })
  );

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
    <div>
      <PageHeader 
        title="Event Notifications" 
        description="View notification events received by the Blastup API."
      />

      <Card className="mb-6">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search event or ID..."
                className="pl-10"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="block w-full max-w-[180px] rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="processing">Processing</option>
              <option value="sent">Sent</option>
              <option value="skipped">Skipped</option>
              <option value="failed">Failed</option>
            </select>
            <Button type="submit" variant="secondary">Filter</Button>
            {hasFilters && (
              <Button type="button" variant="ghost" onClick={clearFilters} className="text-gray-500">
                <X className="w-4 h-4 mr-2" /> Clear
              </Button>
            )}
          </form>
        </div>

        {isLoading ? (
          <div className="p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        ) : error ? (
          <ErrorState title="Failed to load events" />
        ) : !data?.data || data.data.length === 0 ? (
          <EmptyState 
            title={hasFilters ? "No events found" : "No notifications yet"}
            description={hasFilters ? "Try adjusting your search or filters." : "When your website sends events, they will appear here."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event / To</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.data.map((log: any) => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                      {log.eventId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{log.event}</div>
                      <div className="text-sm text-gray-500">{log.recipient || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={
                        log.status === 'sent' ? 'green' : 
                        log.status === 'failed' ? 'red' : 
                        log.status === 'skipped' ? 'gray' : 'yellow'
                      }>
                        {log.status}
                      </Badge>
                      {log.attempts > 1 && <span className="ml-2 text-xs text-gray-400">{log.attempts} tries</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-500 max-w-xs truncate" title={log.errorMessage}>
                      {log.errorMessage || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t px-4 py-2">
              <Pagination 
                page={data.pagination.page}
                pages={data.pagination.pages}
                total={data.pagination.total}
                pageSize={data.pagination.limit}
                onPageChange={setPage}
                compact
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
