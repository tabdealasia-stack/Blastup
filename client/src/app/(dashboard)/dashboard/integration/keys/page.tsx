'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ErrorState, EmptyState } from '@/components/ui/States';
import { keysApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Key, Copy, Check, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function ApiKeysPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/keys', () => keysApi.list());
  
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    
    setIsCreating(true);
    setGeneratedKey(null);
    try {
      const res = await keysApi.create(newKeyName.trim());
      setGeneratedKey(res.data.key);
      setNewKeyName('');
      toast.success('API Key generated successfully.');
      mutate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create API key');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this API Key? Integrations using it will fail immediately.')) return;
    try {
      await keysApi.delete(id);
      toast.success('API Key deleted');
      mutate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <PageHeader 
        title="API Credentials" 
        description="Manage keys used to authenticate your website against the Blastup API."
        action={
          <Link href="/dashboard/integration">
            <Button variant="secondary">Back to Integration</Button>
          </Link>
        }
      />

      {generatedKey && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-6 shadow-sm">
          <h3 className="text-lg font-medium text-green-800 mb-2">Save your API Key</h3>
          <p className="text-sm text-green-700 mb-4">
            Please copy this key and store it securely. You will not be able to see it again.
          </p>
          <div className="flex items-center gap-3">
            <code className="bg-white px-4 py-2 rounded border border-green-300 font-mono text-sm text-gray-800 flex-1 break-all">
              {generatedKey}
            </code>
            <Button variant="primary" onClick={() => copyToClipboard(generatedKey)}>
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Generate New Key</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Key Name / Identifier</label>
                <Input 
                  placeholder="e.g. Production Website" 
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" variant="primary" className="w-full" isLoading={isCreating} disabled={!newKeyName.trim()}>
                Create API Key
              </Button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-gray-500" /> Active Keys
              </h3>
            </div>
            
            {isLoading ? (
              <div className="p-8">
                <div className="animate-pulse space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-100 rounded"></div>
                  ))}
                </div>
              </div>
            ) : error ? (
              <ErrorState title="Failed to load API keys" />
            ) : !data?.data || data.data.length === 0 ? (
              <EmptyState title="No API Keys" description="Generate an API key to connect your website." />
            ) : (
              <ul className="divide-y divide-gray-200">
                {data.data.map((k: any) => (
                  <li key={k._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{k.name}</span>
                        <Badge variant="green">Active</Badge>
                      </div>
                      <div className="text-sm text-gray-500 mt-1 font-mono">
                        {k.keyPrefix}������������
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Created: {new Date(k.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(k._id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
