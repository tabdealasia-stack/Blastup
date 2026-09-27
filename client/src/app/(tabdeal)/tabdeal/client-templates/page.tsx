'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState, EmptyState } from '@/components/ui/States';
import { Lock, Eye, Building, FileText } from 'lucide-react';
import { tabdealApi } from '@/lib/api';
import { CatalogueNav } from '@/components/tabdeal/CatalogueNav';

export default function ClientTemplatesPage() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, error, isLoading } = useSWR(
    ['/api/tabdeal/client-templates', page, limit],
    () => tabdealApi.getClientTemplates({ page, limit })
  );

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-6 pb-12">
      <PageHeader 
        title="Master Catalogue" 
        description="View templates cloned and configured for specific clients."
        action={
          <div className="flex items-center text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
            <Lock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
            READ ONLY
          </div>
        }
      />

      <CatalogueNav />

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
          <ErrorState title="Failed to load client templates" description="There was an error communicating with the server." />
        ) : !data?.data || data.data.length === 0 ? (
          <EmptyState title="No client templates found" description="No clients have active template assignments." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client Identity</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Master Template Base</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Variables Mapping</th>
                  <th scope="col" className="px-6 py-4 relative"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {data.data.map((ct: any) => (
                  <tr key={ct._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-400 shrink-0" />
                        <div>
                          <div className="font-medium text-gray-900">{ct.clientId?.businessName || 'Unknown Client'}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            Status: <span className={ct.clientId?.status === 'active' ? 'text-emerald-600' : 'text-gray-500'}>{ct.clientId?.status || 'Unknown'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                        <div>
                          <div className="font-medium text-gray-900">{ct.templateId?.name || 'Unknown Template'}</div>
                          <div className="text-xs font-mono text-gray-500 mt-0.5 bg-gray-100 px-1.5 py-0.5 rounded inline-block">{ct.templateId?.event || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={ct.enabled ? 'success' : 'gray'}>
                        {ct.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-600 max-w-xs break-words font-mono bg-gray-50 p-2 rounded border border-gray-100">
                        {ct.variables && Object.keys(ct.variables).length > 0 
                          ? Object.entries(ct.variables).map(([k, v]) => <div key={k}><span className="text-indigo-600">{k}</span>: {String(v)}</div>)
                          : <span className="text-gray-400 italic">No custom overrides (Using defaults)</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {ct.clientId?._id && (
                        <Link href={`/tabdeal/clients/${ct.clientId._id}`} className="inline-flex items-center text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-colors">
                          <Eye className="w-4 h-4 mr-1.5" /> View Client
                        </Link>
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
