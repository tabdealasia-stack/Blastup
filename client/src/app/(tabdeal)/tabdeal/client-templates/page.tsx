'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState, EmptyState } from '@/components/ui/States';
import { Lock, Eye } from 'lucide-react';
import { tabdealApi } from '@/lib/api';

export default function ClientTemplatesPage() {
  const [page, setPage] = useState(1);
  const limit = 25;

  const { data, error, isLoading } = useSWR(
    ['/api/tabdeal/client-templates', page, limit],
    () => tabdealApi.getClientTemplates({ page, limit })
  );

  return (
    <div>
      <PageHeader 
        title="Client Templates" 
        description="View templates cloned and configured for specific clients."
        action={
          <div className="flex items-center text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-md font-medium">
            <Lock className="w-4 h-4 mr-2" />
            Read Only
          </div>
        }
      />

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
          <ErrorState title="Failed to load client templates" />
        ) : !data?.data || data.data.length === 0 ? (
          <EmptyState title="No client templates found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Master Template / Event</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enabled</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variables Mapping</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th scope="col" className="px-6 py-3 relative"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.data.map((ct: any) => (
                  <tr key={ct._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{ct.clientId?.businessName || 'Unknown Client'}</div>
                      <div className="text-sm text-gray-500">
                        <Badge variant={ct.clientId?.status === 'active' ? 'green' : 'gray'}>{ct.clientId?.status}</Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{ct.templateId?.name || 'Unknown Template'}</div>
                      <div className="text-sm text-gray-500 font-mono">{ct.templateId?.event || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={ct.enabled ? 'green' : 'gray'}>
                        {ct.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 truncate max-w-xs">
                      {ct.variables && Object.keys(ct.variables).length > 0 
                        ? Object.entries(ct.variables).map(([k, v]) => `${k}:${v}`).join(', ')
                        : 'Default'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(ct.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/tabdeal/clients/${ct.clientId?._id}`} className="text-blue-600 hover:text-blue-900 flex items-center justify-end gap-1">
                        <Eye className="w-4 h-4" /> Client
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
