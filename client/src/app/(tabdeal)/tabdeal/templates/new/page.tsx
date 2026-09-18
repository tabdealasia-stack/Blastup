'use client';

import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ShieldBan } from 'lucide-react';
import Header from '@/components/layout/Header';
import { tabdealApi } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewTemplatePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [packs, setPacks] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    event: '',
    categoryId: '',
    templatePackId: '',
    message: '',
    variables: '',
    active: true,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      const [catRes, packsRes] = await Promise.all([
        tabdealApi.getCategories(),
        tabdealApi.getTemplatePacks()
      ]);
      setCategories(catRes.data);
      setPacks(packsRes.data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const filteredPacks = useMemo(() => {
    if (!formData.categoryId) return [];
    return packs.filter(p => p.categoryId?._id === formData.categoryId);
  }, [formData.categoryId, packs]);

  const parsedVariables = useMemo(() => {
    return formData.variables.split(',').map(v => v.trim()).filter(Boolean);
  }, [formData.variables]);

  const usedVariables = useMemo(() => {
    const regex = /\{\{([^}]+)\}\}/g;
    const regex2 = /\{([^}]+)\}/g;
    const matches1 = Array.from(formData.message.matchAll(regex)).map(m => m[1].trim());
    const matches2 = Array.from(formData.message.matchAll(regex2)).map(m => m[1].trim());
    return Array.from(new Set([...matches1, ...matches2]));
  }, [formData.message]);

  const missingVariables = usedVariables.filter(uv => !parsedVariables.includes(uv));
  const unusedVariables = parsedVariables.filter(pv => !usedVariables.includes(pv));

  const previewMessage = useMemo(() => {
    let msg = formData.message;
    usedVariables.forEach(uv => {
      msg = msg.replace(new RegExp(`\\{\\{\\s*${uv}\\s*\\}\\}`, 'g'), `[${uv}]`)
               .replace(new RegExp(`\\{${uv}\\}`, 'g'), `[${uv}]`);
    });
    return msg;
  }, [formData.message, usedVariables]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        variables: parsedVariables,
      };
      
      const res = await tabdealApi.createTemplate(payload);
      router.push(`/tabdeal/templates/${res.data._id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create template');
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="Create Template" subtitle="Add a new master notification template" />
      
      <div className="page-content" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '24px' }}>
          <Link href="/tabdeal/templates" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>
            <ArrowLeft size={16} /> Back to Templates
          </Link>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '32px' }}>
          {error && (
            <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldBan size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>Template Name *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  placeholder="e.g. Booking Confirmed"
                  required
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>Event Name (DOT notation) *</label>
                <input 
                  type="text" 
                  value={formData.event} 
                  onChange={e => setFormData({ ...formData, event: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontFamily: 'monospace' }}
                  placeholder="e.g. booking.confirmed"
                  required
                  pattern="^[a-z0-9_.]+$"
                  title="Only lowercase letters, numbers, underscores, and dots are allowed"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>Category *</label>
                <select 
                  value={formData.categoryId} 
                  onChange={e => setFormData({ ...formData, categoryId: e.target.value, templatePackId: '' })}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff' }}
                  required
                >
                  <option value="" disabled>Select a Category</option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>Template Pack *</label>
                <select 
                  value={formData.templatePackId} 
                  onChange={e => setFormData({ ...formData, templatePackId: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff' }}
                  required
                  disabled={!formData.categoryId}
                >
                  <option value="" disabled>Select a Pack</option>
                  {filteredPacks.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>Variables (comma-separated)</label>
              <input 
                type="text" 
                value={formData.variables} 
                onChange={e => setFormData({ ...formData, variables: e.target.value })}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontFamily: 'monospace', fontSize: '13px' }}
                placeholder="customerName, bookingId, date"
              />
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>Message *</label>
              <textarea 
                value={formData.message} 
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '120px', resize: 'vertical' }}
                placeholder="Dear {{customerName}}, your booking {{bookingId}} is confirmed."
                required
              />
            </div>

            {/* Validation Warnings */}
            {missingVariables.length > 0 && (
              <div style={{ padding: '12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', marginBottom: '12px', color: '#92400e', fontSize: '13px' }}>
                <strong>Warning:</strong> You used variables in the message that are not in the variables list: {missingVariables.join(', ')}
              </div>
            )}
            
            {unusedVariables.length > 0 && (
              <div style={{ padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '12px', color: '#475569', fontSize: '13px' }}>
                <strong>Notice:</strong> Declared variables not found in the message: {unusedVariables.join(', ')}
              </div>
            )}

            {/* Live Preview */}
            <div style={{ marginBottom: '32px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Live Preview</label>
              <div style={{ whiteSpace: 'pre-wrap', color: '#334155', fontSize: '14px' }}>
                {previewMessage || <span style={{ color: '#94a3b8' }}>Type a message to see the preview...</span>}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
              <input 
                type="checkbox" 
                id="active"
                checked={formData.active}
                onChange={e => setFormData({ ...formData, active: e.target.checked })}
                style={{ width: '16px', height: '16px' }}
              />
              <label htmlFor="active" style={{ fontSize: '14px', fontWeight: 500, color: '#334155', cursor: 'pointer' }}>Template is Active</label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="submit" 
                disabled={loading}
                style={{ padding: '12px 32px', background: '#6366F1', color: '#fff', borderRadius: '8px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '16px' }}
              >
                {loading ? 'Creating...' : 'Create Template'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </>
  );
}
