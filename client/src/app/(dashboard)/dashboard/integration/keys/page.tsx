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
import { Key, Copy, Check, Trash2, ShieldAlert, Eye, EyeOff, AlertTriangle, Activity } from 'lucide-react';
import Link from 'next/link';

export default function ApiKeysPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/keys', () => keysApi.list());
  
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    
    if (!window.confirm('Generate a new API key?\n\nThe new key will be displayed once. Save it securely.')) return;

    setIsCreating(true);
    setGeneratedKey(null);
    setShowKey(false);
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
    if (!window.confirm('Are you absolutely sure you want to revoke this API Key? Any integrations currently using this key will immediately fail and lose access.')) return;
    try {
      await keysApi.delete(id);
      toast.success('API Key revoked successfully.');
      mutate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to revoke API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-6 pb-12">
      <PageHeader 
        title="API Credentials" 
        description="Manage the secret cryptographic keys used to authenticate your system with the Blastup API."
        action={
          <Link href="/dashboard/integration">
            <Button variant="secondary" className="bg-white">Back to Integration</Button>
          </Link>
        }
      />

      {generatedKey && (
        <Card className="mb-8 border-emerald-200 bg-emerald-50/50 shadow-sm overflow-hidden">
          <div className="bg-emerald-600 px-6 py-4 flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-white" />
            <h3 className="text-lg font-semibold text-white">Save Your API Key Now</h3>
          </div>
          <div className="p-6">
            <p className="text-sm text-emerald-800 mb-6 font-medium">
              This is the only time this raw API key will be displayed. Blastup only stores a one-way cryptographic hash of this key. If you lose it, you will not be able to recover it and must revoke it and generate a new one.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full flex-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  readOnly
                  value={generatedKey}
                  className="w-full bg-white px-4 py-3 pr-12 rounded-lg border border-emerald-300 font-mono text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button 
                variant="primary" 
                onClick={() => copyToClipboard(generatedKey)}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 border-transparent text-white whitespace-nowrap h-[46px]"
              >
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Copied to Clipboard' : 'Copy API Key'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card className="p-6 shadow-sm border border-gray-200 sticky top-6">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-600" /> Generate New Key
            </h3>
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Key Identifier</label>
                <Input 
                  placeholder="e.g. Production Backend" 
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  required
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-2">Provide a descriptive name to identify which system is using this key.</p>
              </div>
              <Button type="submit" variant="primary" className="w-full" isLoading={isCreating} disabled={!newKeyName.trim()}>
                Create API Key
              </Button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="overflow-hidden shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                Active API Keys
              </h3>
            </div>
            
            {isLoading ? (
              <div className="p-8">
                <div className="animate-pulse space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-50 rounded-lg"></div>
                  ))}
                </div>
              </div>
            ) : error ? (
              <ErrorState title="Failed to load API keys" description="Please try refreshing the page." />
            ) : !data?.data || data.data.length === 0 ? (
              <EmptyState title="No active API Keys" description="Generate an API key to authenticate your backend." />
            ) : (
              <ul className="divide-y divide-gray-100">
                {data.data.map((k: any) => (
                  <li key={k._id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-gray-50/50 transition-colors gap-4 group">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-gray-900 text-base">{k.name}</span>
                        <Badge variant="success">Active</Badge>
                      </div>
                      <div className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded inline-block border border-gray-200">
                        {k.keyPrefix}••••••••••••••••••••••••••••••••
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 font-medium">
                        <div>Created: {new Date(k.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</div>
                        {k.lastUsedAt && (
                          <div className="flex items-center gap-1 text-indigo-600">
                            <Activity className="w-3 h-3" /> Last used: {new Date(k.lastUsedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => handleDelete(k._id)}
                      className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 transition-colors whitespace-nowrap w-full sm:w-auto"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Revoke Key
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
