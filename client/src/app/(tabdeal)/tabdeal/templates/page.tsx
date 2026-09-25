'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorState, EmptyState } from '@/components/ui/States';
import { Search, Lock } from 'lucide-react';
import { tabdealApi } from '@/lib/api';

export default function NotificationTemplatesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState('');
  const limit = 25;

  const { data: categoriesData } = useSWR('/api/tabdeal/categories', tabdealApi.getCategories);

  const { data, error, isLoading } = useSWR(
    ['/api/tabdeal/templates', search, categoryId, page, limit],
    () => tabdealApi.getTemplates({ search, categoryId, page, limit })
  );

  return (
    <div>
      <PageHeader 
        title="Master Notification Templates" 
        description="View the central repository of WhatsApp notification templates."
        action={
          <div className="flex items-center text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-md font-medium">
            <Lock className="w-4 h-4 mr-2" />
            Master Catalogue � Read Only
          </div>
        }
      />

      <Card className="mb-6 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input 
              type="text"
              placeholder="Search templates or events..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10"
            />
          </div>
          <div className="w-full sm:w-64">
            <select
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={categoryId}
              onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
            >
              <option value="">All Categories</option>
              {categoriesData?.data?.map((c: any) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        ) : error ? (
          <ErrorState title="Failed to load templates" />
        ) : !data?.data || data.data.length === 0 ? (
          <EmptyState title="No templates found" description="Try adjusting your search or filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category / Pack</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.data.map((template: any) => (
                  <tr key={template._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{template.name}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">{template.variables?.join(', ') || 'No variables'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {template.event}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{template.templatePackId?.categoryId?.name || 'N/A'}</div>
                      <div className="text-xs">{template.templatePackId?.name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {template.status === 'approved' ? (
                        <Badge variant="green">Approved</Badge>
                      ) : template.status === 'pending' ? (
                        <Badge variant="yellow">Pending</Badge>
                      ) : (
                        <Badge variant="gray">{template.status}</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(template.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {data?.pagination && data.pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between items-center">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                Previous
              </Button>
              <div className="text-sm text-gray-700">
                Page <span className="font-medium mx-1">{page}</span> of <span className="font-medium mx-1">{data.pagination.pages}</span> (Total: {data.pagination.total})
              </div>
              <Button variant="secondary" size="sm" disabled={page >= data.pagination.pages} onClick={() => setPage(p => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
