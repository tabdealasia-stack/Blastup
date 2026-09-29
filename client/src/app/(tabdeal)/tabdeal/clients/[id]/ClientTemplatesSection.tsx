'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { tabdealApi } from '@/lib/api';
import { Plus, Edit2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

interface ClientTemplatesSectionProps {
  clientId: string;
  totalTemplates?: number;
  activeTemplates?: number;
}

export function ClientTemplatesSection({ clientId, totalTemplates = 0, activeTemplates = 0 }: ClientTemplatesSectionProps) {
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Assignment state
  const [assignTemplateId, setAssignTemplateId] = useState('');
  const [assignEnabled, setAssignEnabled] = useState(true);
  const [assignCustomMessage, setAssignCustomMessage] = useState('');
  const [assignCustomVariables, setAssignCustomVariables] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Edit state
  const [editEnabled, setEditEnabled] = useState(true);
  const [editCustomMessage, setEditCustomMessage] = useState('');
  const [editCustomVariables, setEditCustomVariables] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch client templates
  const { data: ctData, mutate: mutateCTs } = useSWR(
    ['/api/tabdeal/client-templates', clientId],
    () => tabdealApi.getClientTemplates({ clientId, limit: 1000 })
  );

  // Fetch all master templates for assignment
  const { data: mtData } = useSWR(
    showAssignForm ? ['/api/tabdeal/templates', 'active'] : null,
    () => tabdealApi.getTemplates({ active: true, limit: 1000 }),
    { revalidateOnFocus: false }
  );

  // Parse arrays
  const clientTemplates = ctData?.data || [];
  const masterTemplates = mtData?.data || [];

  const availableMasterTemplates = useMemo(() => {
    const assignedIds = new Set(clientTemplates.map((ct: any) => ct.templateId?._id));
    return masterTemplates.filter((mt: any) => !assignedIds.has(mt._id));
  }, [masterTemplates, clientTemplates]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTemplateId) {
      toast.error('Please select a master template.');
      return;
    }
    setIsAssigning(true);
    try {
      const vars = assignCustomVariables
        .split('\n')
        .map(v => v.trim())
        .filter(v => v.includes('=') && v.length > 0);

      await tabdealApi.createClientTemplate({
        clientId,
        templateId: assignTemplateId,
        enabled: assignEnabled,
        customMessage: assignCustomMessage.trim() || undefined,
        customVariables: vars.length > 0 ? vars : undefined,
      });
      
      toast.success('Template assigned successfully.');
      setShowAssignForm(false);
      setAssignTemplateId('');
      setAssignCustomMessage('');
      setAssignCustomVariables('');
      setAssignEnabled(true);
      mutateCTs();
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign template');
    } finally {
      setIsAssigning(false);
    }
  };

  const openEdit = (ct: any) => {
    setEditingId(ct._id);
    setEditEnabled(ct.enabled);
    setEditCustomMessage(ct.customMessage || '');
    setEditCustomVariables((ct.customVariables || []).join('\n'));
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setIsSaving(true);
    try {
      const vars = editCustomVariables
        .split('\n')
        .map(v => v.trim())
        .filter(v => v.includes('=') && v.length > 0);

      await tabdealApi.updateClientTemplate(editingId, {
        enabled: editEnabled,
        customMessage: editCustomMessage.trim() || undefined,
        customVariables: vars.length > 0 ? vars : [],
      });
      
      toast.success('Template updated successfully.');
      setEditingId(null);
      mutateCTs();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update template');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            Assigned Templates
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {ctData ? `${clientTemplates.filter((ct: any) => ct.enabled).length} of ${clientTemplates.length} enabled` : `${activeTemplates} of ${totalTemplates} enabled`}
          </p>
        </div>
        {!showAssignForm && !editingId && (
          <Button variant="outline" size="sm" onClick={() => setShowAssignForm(true)} className="h-8 text-xs bg-white">
            <Plus className="w-3.5 h-3.5 mr-1" /> Assign Template
          </Button>
        )}
      </div>

      {showAssignForm && (
        <div className="border-b border-gray-200 bg-gray-50 p-5">
          <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-500" /> New Template Assignment
          </h4>
          <form onSubmit={handleAssign} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Master Notification Template</label>
              <select 
                className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white px-3 py-2 border"
                value={assignTemplateId}
                onChange={(e) => setAssignTemplateId(e.target.value)}
                required
              >
                <option value="">Select a template...</option>
                {availableMasterTemplates.map((mt: any) => (
                  <option key={mt._id} value={mt._id}>
                    {mt.name} ({mt.event})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="assignEnabled"
                checked={assignEnabled}
                onChange={(e) => setAssignEnabled(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="assignEnabled" className="text-sm text-gray-900 font-medium">Enabled</label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Custom Message Override</label>
              <textarea
                className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border"
                rows={3}
                placeholder="Leave empty to use the Master Template message."
                value={assignCustomMessage}
                onChange={(e) => setAssignCustomMessage(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">This will completely replace the underlying Master Template message when dispatched.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Custom Variables</label>
              <textarea
                className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono px-3 py-2 border"
                rows={3}
                placeholder={`customer_name=John\ngreeting=Hello VIP`}
                value={assignCustomVariables}
                onChange={(e) => setAssignCustomVariables(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">One variable mapping per line in <code className="bg-gray-100 px-1 rounded">key=value</code> format.</p>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAssignForm(false)} disabled={isAssigning}>Cancel</Button>
              <Button type="submit" variant="primary" size="sm" disabled={isAssigning || !assignTemplateId}>
                {isAssigning ? 'Assigning...' : 'Assign Template'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {editingId && (
        <div className="border-b border-gray-200 bg-indigo-50/30 p-5">
          <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-indigo-500" /> Edit Template Configuration
          </h4>
          <form onSubmit={handleEditSave} className="space-y-4">
            <div className="flex items-center gap-2 bg-white p-3 rounded border border-gray-200 mb-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <div className="text-sm text-gray-600 font-medium">
                {clientTemplates.find((ct: any) => ct._id === editingId)?.templateId?.name || 'Unknown Template'}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 pb-2">
              <input
                type="checkbox"
                id="editEnabled"
                checked={editEnabled}
                onChange={(e) => {
                  if (!e.target.checked) {
                    if (!window.confirm('Disabling this template means notifications for this event will be skipped. Continue?')) {
                      return;
                    }
                  }
                  setEditEnabled(e.target.checked);
                }}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="editEnabled" className="text-sm text-gray-900 font-medium">Enabled (Active)</label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Custom Message Override</label>
              <textarea
                className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border"
                rows={3}
                placeholder="Leave empty to use the Master Template message."
                value={editCustomMessage}
                onChange={(e) => setEditCustomMessage(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">This will completely replace the underlying Master Template message when dispatched.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Custom Variables</label>
              <textarea
                className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono px-3 py-2 border"
                rows={3}
                placeholder={`customer_name=John\ngreeting=Hello VIP`}
                value={editCustomVariables}
                onChange={(e) => setEditCustomVariables(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">One variable mapping per line in <code className="bg-gray-100 px-1 rounded">key=value</code> format.</p>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(null)} disabled={isSaving}>Cancel</Button>
              <Button type="submit" variant="primary" size="sm" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="flex-1 overflow-x-auto">
        {!ctData ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading templates...</div>
        ) : clientTemplates.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500 italic">No templates assigned.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-white">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Template / Event</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Overrides</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {clientTemplates.map((ct: any) => {
                const template = ct.templateId;
                return (
                  <tr key={ct._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{template?.name || 'Unknown'}</div>
                      <div className="text-xs font-mono text-gray-500 mt-0.5">{template?.event || 'Unknown'}</div>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <Badge variant={ct.enabled ? 'success' : 'gray'}>
                        {ct.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="flex gap-1">
                        {ct.customMessage && (
                          <Badge variant="info" className="text-[10px]">Message</Badge>
                        )}
                        {ct.customVariables && ct.customVariables.length > 0 && (
                          <Badge variant="info" className="text-[10px]">Variables</Badge>
                        )}
                        {!ct.customMessage && (!ct.customVariables || ct.customVariables.length === 0) && (
                          <span className="text-xs text-gray-400 italic">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openEdit(ct)}
                        disabled={!!showAssignForm || !!editingId}
                        className="text-indigo-600 hover:text-indigo-900 px-2 py-1 h-auto"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
}
