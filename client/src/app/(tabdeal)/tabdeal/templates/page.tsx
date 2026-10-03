'use client';
import Link from 'next/link';

import { useState } from 'react';
import useSWR from 'swr';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorState, EmptyState } from '@/components/ui/States';
import { Search, Lock, Package, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { tabdealApi } from '@/lib/api';
import { CatalogueNav } from '@/components/tabdeal/CatalogueNav';

export default function NotificationTemplatesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState('');
  const limit = 20;

  const { data: categoriesData } = useSWR('/api/tabdeal/categories', tabdealApi.getCategories);

  const { data, error, isLoading } = useSWR(
    ['/api/tabdeal/templates', search, categoryId, page, limit],
    () => tabdealApi.getTemplates({ search, categoryId, page, limit })
  );

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-6 pb-12">
      <PageHeader 
        title="Master Catalogue" 
        description="View the central repository of WhatsApp notification templates."
        action={
          <Link href="/tabdeal/templates/new">
            <Button>
              Add New Template
            </Button>
          </Link>
        }
      />

      <CatalogueNav />

      <Card className="p-4 border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input 
              type="text"
              placeholder="Search templates or events..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <div className="w-full sm:w-64">
            <select
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-50/50"
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
                <div key={i} className="h-14 bg-gray-50 rounded-lg"></div>
              ))}
            </div>
          </div>
        ) : error ? (
          <ErrorState title="Failed to load templates" description="There was an error communicating with the server." />
        ) : !data?.data || data.data.length === 0 ? (
          <EmptyState title="No templates found" description="Try adjusting your search or category filter." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Template Name</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Event Slug</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pack / Category</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Variables</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {data.data.map((template: any) => (
                  <tr key={template._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{template.name}</div>
                      {template.body && (
                        <div className="text-xs text-gray-500 truncate max-w-xs mt-1" title={template.body}>
                          {template.body}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs">{template.event}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-col gap-1">
                        {template.templatePackId?.categoryId?.name && (
                          <div className="text-xs font-medium text-indigo-600">{template.templatePackId.categoryId.name}</div>
                        )}
                        <div className="flex items-center text-xs text-gray-500">
                          <Package className="w-3.5 h-3.5 mr-1" />
                          {template.templatePackId?.name || 'No Pack'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {template.variables && template.variables.length > 0 ? (
                          template.variables.map((v: string) => (
                            <span key={v} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                              {v}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {template.status === 'approved' ? (
                        <span className="inline-flex items-center text-xs font-medium text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Approved
                        </span>
                      ) : template.status === 'pending' ? (
                        <span className="inline-flex items-center text-xs font-medium text-amber-600">
                          <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Pending
                        </span>
                      ) : template.status === 'rejected' ? (
                        <span className="inline-flex items-center text-xs font-medium text-rose-600">
                          <XCircle className="w-3.5 h-3.5 mr-1.5" /> Rejected
                        </span>
                      ) : (
                        <Badge variant="gray">{template.status}</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {data?.pagination && data.pagination.pages > 1 && (
          <div className="bg-white px-6 py-4 flex items-center justify-between border-t border-gray-100">
            <div className="flex-1 flex justify-between items-center">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                Previous
              </Button>
              <div className="text-sm text-gray-500">
                Page <span className="font-semibold text-gray-900 mx-1">{page}</span> of <span className="font-semibold text-gray-900 mx-1">{data.pagination.pages}</span> <span className="mx-2 text-gray-300">|</span> Total: {data.pagination.total}
              </div>
              <Button variant="outline" size="sm" disabled={page >= data.pagination.pages} onClick={() => setPage(p => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
