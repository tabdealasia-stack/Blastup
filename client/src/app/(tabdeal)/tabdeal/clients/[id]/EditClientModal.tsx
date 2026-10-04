'use client';

import React, { useState } from 'react';
import { X, ShieldBan, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { tabdealApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: any;
  onSuccess: () => void;
}

export function EditClientModal({ isOpen, onClose, client, onSuccess }: EditClientModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    businessName: client.businessName || '',
    email: client.email || '',
    phone: client.phone || '',
    whatsappNumber: client.whatsappNumber || '',
    timezone: client.settings?.timezone || 'Asia/Kolkata',
    defaultCountryCode: client.settings?.defaultCountryCode || '91',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await tabdealApi.updateClient(client._id, formData);
      toast.success('Client updated successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update client');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="modal-card max-w-2xl w-full bg-white rounded-xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header flex justify-between items-center p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="modal-title text-lg font-bold text-gray-900">Edit Client Information</span>
          </div>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-900 rounded-full p-1 transition-colors"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body p-5">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 flex items-center gap-2 text-sm">
              <ShieldBan size={16} />
              {error}
            </div>
          )}

          <form id="edit-client-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">System Slug (Read-only)</label>
                <input
                  type="text"
                  value={client.slug}
                  disabled
                  className="w-full p-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">Business Name *</label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">Contact Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">Contact Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="block mb-1.5 text-sm font-medium text-gray-700">WhatsApp Number</label>
              <input
                type="text"
                value={formData.whatsappNumber}
                onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
              <div className="mt-2 flex items-start gap-1.5 text-xs text-gray-500">
                <Info size={14} className="mt-0.5 text-indigo-400 flex-shrink-0" />
                <p>Number intended for this client's WhatsApp integration. Updating this field does not automatically reconnect WhatsApp.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">Timezone</label>
                <input
                  type="text"
                  value={formData.timezone}
                  onChange={e => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">Default Country Code</label>
                <input
                  type="text"
                  value={formData.defaultCountryCode}
                  onChange={e => setFormData({ ...formData, defaultCountryCode: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="modal-actions p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="edit-client-form" isLoading={loading}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
