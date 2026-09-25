'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorState, EmptyState } from '@/components/ui/States';
import { Search, Plus, Eye } from 'lucide-react';
import { tabdealApi } from '@/lib/api';

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;
  
  // Use a debounced search term if needed, but for simplicity we'll just trigger fetch on enter or button click
  // Or just rely on SWR's fast revalidation. Let's just pass search to SWR directly.
  const { data, error, isLoading } = useSWR(
    ['/api/tabdeal/clients', search, page, limit], 
    () => tabdealApi.getClients({ search, page, limit })
  );

  return (
    <div>
      <PageHeader 
        title="Clients" 
        description="Manage your SaaS platform clients and their WhatsApp accounts"
        action={
          <Link href="/tabdeal/clients/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Client
            </Button>
          </Link>
        }
      />

      <Card className="mb-6 p-4">
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input 
              type="text"
              placeholder="Search by business name or slug..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        ) : error ? (
          <ErrorState title="Failed to load clients" />
        ) : !data?.data || data.data.length === 0 ? (
          <EmptyState 
            title="No clients found" 
            description={search ? "No clients match your search criteria." : "Get started by creating your first client."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WhatsApp</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.data.map((client: any) => (
                  <tr key={client._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{client.businessName}</div>
                      <div className="text-sm text-gray-500">{client.slug}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client.categoryId?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={client.status === 'active' ? 'green' : 'gray'}>
                        {client.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${client.whatsappStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm text-gray-700">{client.whatsappStatus}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{client.whatsappNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(client.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/tabdeal/clients/${client._id}`} className="text-blue-600 hover:text-blue-900 flex items-center justify-end gap-1">
                        <Eye className="w-4 h-4" /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination placeholder if needed, though SWR is returning it. Let's add basic controls */}
        {data?.pagination && data.pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between">
              <Button 
                variant="secondary" 
                size="sm" 
                disabled={page <= 1} 
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <div className="text-sm text-gray-700 flex items-center">
                Page <span className="font-medium mx-1">{page}</span> of <span className="font-medium mx-1">{data.pagination.pages}</span>
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                disabled={page >= data.pagination.pages} 
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
