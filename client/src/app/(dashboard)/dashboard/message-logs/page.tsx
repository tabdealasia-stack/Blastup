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
import { Search, Filter, X, Smartphone, Clock } from 'lucide-react';

export default function ClientMessageLogsPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  
  const [activeQuery, setActiveQuery] = useState({ search: '', status: '' });

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(activeQuery.search ? { search: activeQuery.search } : {}),
    ...(activeQuery.status ? { status: activeQuery.status } : {}),
  });

  const { data, error, isLoading } = useSWR(
    `/api/message-logs?${queryParams.toString()}`,
    () => telemetryApi.getMessageLogs({
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
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-6 pb-12">
      <PageHeader 
        title="WhatsApp Dispatch Logs" 
        description="Monitor actual provider dispatch records for WhatsApp messages sent from your container."
      />

      <Card className="mb-6 shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:max-w-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search recipient number or Message ID..."
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
                <option value="queued">Queued</option>
                <option value="sending">Sending</option>
                <option value="sent">Sent</option>
                <option value="delivered">Delivered</option>
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
          <ErrorState title="Failed to load dispatch logs" description="An error occurred communicating with the server." />
        ) : !data?.data || data.data.length === 0 ? (
          <EmptyState 
            title={hasFilters ? "No dispatches found" : "No WhatsApp dispatches yet"}
            description={hasFilters ? "Try adjusting your search criteria." : "When events are processed, their underlying WhatsApp dispatch logs will appear here."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Recipient & Type</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created (IST)</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Provider / Error Data</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {data.data.map((log: any) => (
                  <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-gray-400" /> {log.to}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 capitalize flex items-center gap-1">
                        {log.messageType || 'template'}
                        {log.templateId?.event && <span className="font-mono text-[10px] bg-gray-100 px-1 rounded ml-1">{log.templateId.event}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={
                        log.status === 'delivered' ? 'success' : 
                        log.status === 'sent' ? 'blue' :
                        log.status === 'failed' ? 'danger' : 'gray'
                      }>
                        {log.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(log.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </td>
                    <td className="px-6 py-4 text-sm max-w-[240px] truncate">
                      {log.status === 'failed' ? (
                        <div className="text-rose-600 text-xs font-medium truncate" title={log.errorMessage || 'Unknown error'}>
                          {log.errorMessage || 'Unknown error'}
                        </div>
                      ) : log.providerMessageId ? (
                        <div className="text-gray-600 text-xs font-mono truncate" title={log.providerMessageId}>
                          ID: {log.providerMessageId}
                        </div>
                      ) : (
                        <div className="text-gray-400 text-xs italic flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Queued by SafeMode
                        </div>
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
