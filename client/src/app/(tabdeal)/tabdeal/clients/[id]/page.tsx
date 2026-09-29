'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { tabdealApi } from '@/lib/api';
import { ClientWhatsAppSection } from './ClientWhatsAppSection';
import { ClientApiKeysSection } from './ClientApiKeysSection';
import { ClientTemplatesSection } from './ClientTemplatesSection';
import { ArrowLeft, Clock, Calendar, CheckCircle2, XCircle, AlertCircle, Send, Webhook } from 'lucide-react';
import Link from 'next/link';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: clientData, error: clientError, isLoading: loadingClient } = useSWR(
    id ? `/api/tabdeal/clients/${id}` : null,
    () => tabdealApi.getClient(id)
  );

  const { data: messageLogsData, isLoading: loadingMessages } = useSWR(
    id ? `/api/tabdeal/message-logs?clientId=${id}&limit=5` : null,
    () => tabdealApi.getMessageLogs({ clientId: id, limit: 5 })
  );

  if (loadingClient) {
    return (
      <div className="p-8">
        <LoadingState />
      </div>
    );
  }

  if (clientError || !clientData?.data) {
    return (
      <div className="p-8">
        <ErrorState 
          title="Client Not Found" 
          description="The client could not be loaded. It may have been removed or you do not have permission to view it." 
        />
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" onClick={() => router.push('/tabdeal/clients')}>
            Back to Clients
          </Button>
        </div>
      </div>
    );
  }

  const client = clientData.data;

  // Derive some basic counts from the populated data instead of making complex API aggregations
  const totalTemplates = client.templates?.length || 0;
  const activeTemplates = client.templates?.filter((t: any) => t.enabled).length || 0;
  const totalApiKeys = client.apiKeys?.length || 0;

  return (
    <div className="animate-in fade-in duration-500 space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/tabdeal/clients" className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Clients
        </Link>
      </div>

      <PageHeader 
        title={client.businessName} 
        description={`Category: ${client.categoryId?.name || 'Uncategorized'} • ID: ${client._id}`}
        action={
          <Badge variant={client.status === 'active' ? 'success' : client.status === 'suspended' ? 'danger' : 'gray'}>
            {client.status?.toUpperCase()}
          </Badge>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ROW 1: Client Summary (Spans 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 h-full flex flex-col">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 mb-4">
              Client Identity & Information
            </h3>
            
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6 flex-1">
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Business Name</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">{client.businessName}</dd>
              </div>
              
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">System Slug</dt>
                <dd className="mt-1 text-sm font-mono text-gray-600">{client.slug}</dd>
              </div>

              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{client.email || <span className="text-gray-400 italic">Not provided</span>}</dd>
              </div>

              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{client.phone || <span className="text-gray-400 italic">Not provided</span>}</dd>
              </div>
              
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Default Region</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {client.settings?.timezone || 'Asia/Kolkata'} (+{client.settings?.defaultCountryCode || '91'})
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Provisioned At
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(client.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </dd>
              </div>
            </dl>
          </Card>
        </div>

        {/* ROW 1: WhatsApp Management (Spans 1 column) */}
        <div className="lg:col-span-1">
          <ClientWhatsAppSection clientId={client._id} initialWhatsapp={client.whatsapp} />
        </div>
        
        {/* ROW 2: Templates & API Keys (Full width) */}
        <div className="lg:col-span-3 grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {/* Templates */}
            <ClientTemplatesSection clientId={client._id} totalTemplates={totalTemplates} activeTemplates={activeTemplates} />

          {/* API Keys */}
          <Card className="overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  API Integrations
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">{totalApiKeys} key(s) provisioned</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-x-auto">
              {!client.apiKeys || client.apiKeys.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500 italic">No API keys provisioned.</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Key Name</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Last Used</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 bg-white">
                    {client.apiKeys.map((key: any) => (
                      <tr key={key._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{key.name}</div>
                          <div className="text-xs font-mono text-gray-400 mt-0.5">{key.keyPrefix}••••••••</div>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <Badge variant={key.status === 'active' ? 'success' : 'gray'}>
                            {key.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                          {key.lastUsedAt ? (
                            <span className="flex items-center justify-end gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              {new Date(key.lastUsedAt).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Never</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>

        {/* ROW 3: Recent Activity */}
        <div className="lg:col-span-3">
          <Card className="overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-500" /> Recent Dispatch Activity
              </h3>
              <div className="text-xs text-gray-500 italic">
                Client-level daily metrics aggregation is currently unavailable.
              </div>
            </div>
            
            <div className="p-0">
              {loadingMessages ? (
                <div className="p-8 text-center text-sm text-gray-500 animate-pulse">Loading recent messages...</div>
              ) : !messageLogsData?.data || messageLogsData.data.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500 italic">No recent messages found for this client.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-white">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Timestamp</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Recipient</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Message Type</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 bg-white">
                      {messageLogsData.data.map((msg: any) => (
                        <tr key={msg._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">
                            {new Date(msg.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'medium' })}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm font-mono text-gray-900">
                            {msg.recipient}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600 capitalize">
                            {msg.messageType}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap">
                            <Badge variant={
                              msg.status === 'sent' || msg.status === 'delivered' || msg.status === 'read' ? 'success' :
                              msg.status === 'failed' ? 'danger' :
                              'warning'
                            }>
                              {msg.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}



