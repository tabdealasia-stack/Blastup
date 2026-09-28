'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import { ErrorState, EmptyState } from '@/components/ui/States';
import { clientTemplatesApi } from '@/lib/api';
import { Search, X, Info, FileText } from 'lucide-react';

export default function ClientTemplatesPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [activeQuery, setActiveQuery] = useState({ search: '' });

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(activeQuery.search ? { search: activeQuery.search } : {}),
  });

  const { data, error, isLoading } = useSWR(
    `/api/client-templates?${queryParams.toString()}`,
    () => clientTemplatesApi.list({
      page,
      limit,
      search: activeQuery.search || undefined
    })
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setActiveQuery({ search });
  };

  const clearFilters = () => {
    setSearch('');
    setPage(1);
    setActiveQuery({ search: '' });
  };

  const hasFilters = activeQuery.search;

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-6 pb-12">
      <PageHeader 
        title="My Templates" 
        description="View WhatsApp notification templates provisioned for your account."
      />

      <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-lg flex gap-4 mb-6">
        <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-indigo-900">
          <strong className="font-semibold block mb-1">Managed Templates</strong>
          <p className="text-indigo-800/80 leading-relaxed">
            These templates have been specifically assigned to your organization by Blastup administrators. Use the <strong className="font-mono bg-indigo-100 px-1 rounded">event</strong> slug in your API integration payload.
          </p>
        </div>
      </div>

      <Card className="shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search templates or events..."
                className="pl-9 w-full"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex w-full sm:w-auto gap-3">
              <Button type="submit" variant="secondary" className="whitespace-nowrap">Search</Button>
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
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-50 rounded-lg"></div>
              ))}
            </div>
          </div>
        ) : error ? (
          <ErrorState title="Failed to load templates" description="An error occurred communicating with the server." />
        ) : !data?.data || data.data.length === 0 ? (
          <EmptyState 
            title={hasFilters ? "No templates found" : "No templates assigned"}
            description={hasFilters ? "Try adjusting your search query." : "Contact your administrator to provision templates for your account."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Template Name</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Event Slug</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">API Variables</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {data.data.map((ct: any) => (
                  <tr key={ct._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="font-medium text-gray-900">{ct.templateId?.name || 'Unknown Template'}</div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 pl-7">
                         {ct.templateId?.categoryId?.name || 'Uncategorized'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="px-2 py-1 bg-gray-100 text-indigo-700 rounded text-sm font-mono select-all">
                        {ct.templateId?.event || 'N/A'}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={ct.enabled ? 'success' : 'gray'}>
                        {ct.enabled ? 'Active' : 'Disabled'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm max-w-sm">
                      {ct.variables && Object.keys(ct.variables).length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {Object.keys(ct.variables).map((vKey) => (
                            <span key={vKey} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {vKey}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-xs">No variables required</span>
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
