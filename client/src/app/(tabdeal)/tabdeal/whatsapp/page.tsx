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
import { Search, Settings, Lock, Smartphone, Wifi, WifiOff, Loader, HelpCircle } from 'lucide-react';
import { tabdealApi } from '@/lib/api';

export default function WhatsAppManagementPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 25;

  const { data, error, isLoading } = useSWR(
    ['/api/tabdeal/clients', search, page, limit],
    () => tabdealApi.getClients({ search, page, limit })
  );

  // Compute operational counts safely from the visible dataset to avoid N+1 queries.
  // Note: Backend API gap: No global endpoint for total cluster whatsapp status aggregation exists.
  const visibleClients = data?.data || [];
  const countConnected = visibleClients.filter((c: any) => c.whatsappStatus === 'connected').length;
  const countDisconnected = visibleClients.filter((c: any) => c.whatsappStatus === 'disconnected').length;
  const countPending = visibleClients.filter((c: any) => c.whatsappStatus === 'pending').length;
  const countUnconfigured = visibleClients.filter((c: any) => !c.whatsappStatus || c.whatsappStatus === 'unconfigured').length;

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-6 pb-12">
      <PageHeader 
        title="WhatsApp Command Center" 
        description="Manage and monitor WhatsApp connections for your client tenants."
        action={
          <div className="flex items-center text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
            <Lock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
            Superadmin Access
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Connected</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">
              {isLoading ? <span className="animate-pulse text-gray-300">...</span> : countConnected}
            </div>
            <div className="text-xs text-gray-400 mt-1">on this page</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
            <Wifi className="w-5 h-5 text-emerald-600" />
          </div>
        </Card>
        
        <Card className="p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Disconnected</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">
              {isLoading ? <span className="animate-pulse text-gray-300">...</span> : countDisconnected}
            </div>
            <div className="text-xs text-gray-400 mt-1">on this page</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
            <WifiOff className="w-5 h-5 text-rose-600" />
          </div>
        </Card>
        
        <Card className="p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Pairing</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">
              {isLoading ? <span className="animate-pulse text-gray-300">...</span> : countPending}
            </div>
            <div className="text-xs text-gray-400 mt-1">on this page</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
            <Loader className="w-5 h-5 text-amber-600" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Unconfigured</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">
              {isLoading ? <span className="animate-pulse text-gray-300">...</span> : countUnconfigured}
            </div>
            <div className="text-xs text-gray-400 mt-1">on this page</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-gray-400" />
          </div>
        </Card>
      </div>

      <Card className="p-4 border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input 
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <div className="text-xs text-gray-500 flex items-center px-2">
            Note: WhatsApp status filtering is unsupported by the backend API.
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
          <ErrorState title="Failed to load WhatsApp accounts" description="There was an error communicating with the server." />
        ) : !visibleClients || visibleClients.length === 0 ? (
          <EmptyState title="No accounts found" description="Try adjusting your search criteria." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client Identity</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client Status</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">WhatsApp Number</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Connection Status</th>
                  <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {visibleClients.map((client: any) => (
                  <tr key={client._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{client.businessName}</div>
                      <div className="text-xs font-mono text-gray-500 mt-0.5">{client.slug}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={client.status === 'active' ? 'success' : client.status === 'suspended' ? 'danger' : 'gray'}>
                        {client.status || 'unknown'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {client.whatsappNumber || <span className="text-gray-400 italic">Unconfigured</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {client.whatsappStatus === 'connected' ? (
                        <Badge variant="success" className="gap-1.5"><Wifi className="w-3 h-3" /> Connected</Badge>
                      ) : client.whatsappStatus === 'disconnected' ? (
                        <Badge variant="danger" className="gap-1.5"><WifiOff className="w-3 h-3" /> Disconnected</Badge>
                      ) : client.whatsappStatus === 'pending' ? (
                        <Badge variant="warning" className="gap-1.5"><Loader className="w-3 h-3 animate-spin" /> Pending</Badge>
                      ) : (
                        <Badge variant="gray" className="gap-1.5"><HelpCircle className="w-3 h-3" /> Unconfigured</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/tabdeal/clients/${client._id}`} className="inline-flex items-center text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-colors">
                        <Smartphone className="w-4 h-4 mr-1.5" /> Operations
                      </Link>
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
