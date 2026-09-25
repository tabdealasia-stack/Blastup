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
import { Search, Settings, Lock } from 'lucide-react';
import { tabdealApi } from '@/lib/api';

export default function WhatsAppManagementPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 25;

  const { data, error, isLoading } = useSWR(
    ['/api/tabdeal/clients', search, page, limit],
    () => tabdealApi.getClients({ search, page, limit })
  );

  return (
    <div>
      <PageHeader 
        title="WhatsApp Management" 
        description="Global operational overview of client WhatsApp accounts and connection statuses."
        action={
          <div className="flex items-center text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-md font-medium">
            <Lock className="w-4 h-4 mr-2" />
            Superadmin Access
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
              placeholder="Search clients..."
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
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        ) : error ? (
          <ErrorState title="Failed to load WhatsApp accounts" />
        ) : !data?.data || data.data.length === 0 ? (
          <EmptyState title="No accounts found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WhatsApp Number</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Connection Status</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.data.map((client: any) => (
                  <tr key={client._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{client.businessName}</div>
                      <div className="text-sm text-gray-500 font-mono">{client.slug}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {client.whatsappNumber || 'Not provided'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${client.whatsappStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm text-gray-700 capitalize">{client.whatsappStatus}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/tabdeal/clients/${client._id}`} className="text-blue-600 hover:text-blue-900 flex items-center justify-end gap-1">
                        <Settings className="w-4 h-4" /> Manage
                      </Link>
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
