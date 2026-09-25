'use client';

import useSWR from 'swr';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ErrorState } from '@/components/ui/States';
import { tabdealApi } from '@/lib/api';
import { ClientWhatsAppSection } from './ClientWhatsAppSection';

export default function ClientDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data, error, isLoading } = useSWR(
    id ? `/api/tabdeal/clients/${id}` : null,
    () => tabdealApi.getClient(id)
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-1/3 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="h-64 bg-gray-50 animate-pulse"><div/></Card>
          <Card className="h-64 bg-gray-50 animate-pulse"><div/></Card>
        </div>
      </div>
    );
  }

  if (error || !data?.data) {
    return <ErrorState title="Failed to load client" description="Could not fetch client details." />;
  }

  const client = data.data;

  return (
    <div className="space-y-8">
      <PageHeader 
        title={client.businessName} 
        description={`Client ID: ${client._id} | Slug: ${client.slug}`}
        action={
          <Badge variant={client.status === 'active' ? 'green' : client.status === 'suspended' ? 'red' : 'gray'}>
            {client.status?.toUpperCase()}
          </Badge>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* A. Client Information */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Client Information</h3>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Business Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{client.businessName}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Category</dt>
              <dd className="mt-1 text-sm text-gray-900">{client.categoryId?.name || 'N/A'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{client.email || 'Not provided'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900">{client.phone || 'Not provided'}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900">{new Date(client.createdAt).toLocaleString()}</dd>
            </div>
          </dl>
        </Card>

        <ClientWhatsAppSection clientId={id} initialWhatsapp={client.whatsapp} />

        {/* E. API Keys */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">API Keys</h3>
          {!client.apiKeys || client.apiKeys.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No API keys found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Last Used</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {client.apiKeys.map((key: any) => (
                    <tr key={key._id}>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{key.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        <Badge variant={key.status === 'active' ? 'green' : 'gray'}>{key.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{new Date(key.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : 'Never'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* C. Client Templates Summary */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Provisioned Templates ({client.templates?.length || 0})</h3>
          {!client.templates || client.templates.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No templates provisioned.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Platform Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {client.templates.map((ct: any) => {
                    const template = ct.templateId; // populated
                    return (
                      <tr key={ct._id}>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{template?.name || 'Unknown'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{template?.event || 'Unknown'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          <Badge variant={ct.enabled ? 'green' : 'gray'}>{ct.enabled ? 'Enabled' : 'Disabled'}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {template?.status === 'approved' ? (
                            <span className="text-green-600 font-medium">Approved</span>
                          ) : (
                            <span className="text-yellow-600">{template?.status || 'Unknown'}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}
