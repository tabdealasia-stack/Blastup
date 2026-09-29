'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ErrorState, EmptyState } from '@/components/ui/States';
import { tabdealApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Key, Copy, Check, Trash2, ShieldAlert, Eye, EyeOff, Activity, Plus } from 'lucide-react';

export function ClientApiKeysSection({ clientId, totalApiKeys = 0 }: { clientId: string, totalApiKeys?: number }) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/tabdeal/clients/${clientId}/api-keys`, 
    () => tabdealApi.getClientApiKeys(clientId)
  );
  
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    
    if (!window.confirm('Generate a new API key?\n\nThe new key will be displayed once. Save it securely.')) return;

    setIsCreating(true);
    setGeneratedKey(null);
    setShowKey(false);
    try {
      const res = await tabdealApi.createClientApiKey(clientId, newKeyName.trim());
      setGeneratedKey(res.data.apiKey);
      setNewKeyName('');
      setShowCreateForm(false);
      toast.success('API Key generated successfully.');
      mutate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create API key');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Revoke this API key?\n\nApplications using this key will no longer be able to authenticate. This action cannot be undone.')) return;
    try {
      await tabdealApi.deleteClientApiKey(clientId, id);
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

  const apiKeys = data?.data || [];

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            API Integrations
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">{apiKeys.length || totalApiKeys} key(s) provisioned</p>
        </div>
        {!showCreateForm && (
          <Button variant="outline" size="sm" onClick={() => setShowCreateForm(true)} className="h-8 text-xs bg-white">
            <Plus className="w-3.5 h-3.5 mr-1" /> New Key
          </Button>
        )}
      </div>

      {generatedKey && (
        <div className="border-b border-emerald-200 bg-emerald-50/50 p-5 overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-5 h-5 text-emerald-600" />
            <h4 className="text-sm font-bold text-emerald-800">API KEY GENERATED</h4>
          </div>
          <p className="text-xs text-emerald-700 mb-4 font-medium leading-relaxed">
            This API key is shown only once. Save it securely. 
            Blastup only stores a one-way cryptographic hash of this key.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative w-full flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                readOnly
                value={generatedKey}
                className="w-full bg-white px-3 py-2 pr-10 rounded-md border border-emerald-300 font-mono text-sm text-gray-900 shadow-sm focus:outline-none"
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
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 border-transparent text-white whitespace-nowrap text-xs h-9"
            >
              {copied ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
              {copied ? 'Copied' : 'Copy API Key'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setGeneratedKey(null)}
              className="w-full sm:w-auto bg-white text-xs h-9"
            >
              Done
            </Button>
          </div>
        </div>
      )}

      {showCreateForm && !generatedKey && (
        <div className="p-5 border-b border-gray-100 bg-indigo-50/30">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-500" /> Key Identifier
              </label>
              <Input 
                placeholder="e.g. Production Backend" 
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                required
                className="w-full text-sm h-9"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" className="bg-white text-xs" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" className="text-xs" isLoading={isCreating} disabled={!newKeyName.trim()}>
                Create API Key
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="flex-1 overflow-x-auto bg-white">
        {isLoading ? (
          <div className="p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-50 rounded-md"></div>
              ))}
            </div>
          </div>
        ) : error ? (
          <ErrorState title="Failed to load API keys" description="Please try refreshing the page." />
        ) : apiKeys.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500 italic">No API keys provisioned.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Key Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Used</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {apiKeys.map((key: any) => (
                <tr key={key._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-5 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      {key.name}
                    </div>
                    <div className="text-xs font-mono text-gray-400 mt-1">{key.keyPrefix}••••••••••••••••••••••••••••••••</div>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <Badge variant={key.status === 'active' ? 'success' : 'gray'} className="text-[10px]">
                      {key.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                    {key.lastUsedAt ? (
                      <span className="flex items-center justify-end gap-1.5 text-xs font-medium">
                        <Activity className="w-3.5 h-3.5 text-indigo-400" />
                        {new Date(key.lastUsedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Never</span>
                    )}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(key._id)}
                      className="h-7 text-[11px] text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Revoke
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
}
