'use client';

import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ShieldBan } from 'lucide-react';
import Header from '@/components/layout/Header';
import { tabdealApi } from '@/lib/api';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    defaultTemplatePackId: '',
    active: true,
    displayOrder: 0,
  });
  
  const [packs, setPacks] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [categoryRes, packsRes] = await Promise.all([
        tabdealApi.getCategory(id),
        tabdealApi.getTemplatePacks()
      ]);
      const cat = categoryRes.data;
      setFormData({
        name: cat.name || '',
        slug: cat.slug || '',
        description: cat.description || '',
        defaultTemplatePackId: cat.defaultTemplatePackId || '',
        active: cat.active ?? true,
        displayOrder: cat.displayOrder || 0,
      });
      setPacks(packsRes.data);
      setPageLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load category data');
      setPageLoading(false);
    }
  };

  const filteredPacks = useMemo(() => {
    return packs.filter(p => p.categoryId === id || p.categoryId?._id === id);
  }, [packs, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload: any = { ...formData };
      if (!payload.defaultTemplatePackId) {
        payload.defaultTemplatePackId = null;
      }
      await tabdealApi.updateCategory(id, payload);
      router.push(`/tabdeal/categories`);
    } catch (err: any) {
      setError(err.message || 'Failed to update category');
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <>
        <Header title="Edit Category" subtitle="Loading..." />
        <div className="p-8 text-center text-gray-500">Loading category data...</div>
      </>
    );
  }

  return (
    <>
      <Header title="Edit Category" subtitle="Manage master business category and default template pack" />
      
      <div className="page-content" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '24px' }}>
          <Link href="/tabdeal/categories" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>
            <ArrowLeft size={16} /> Back to Categories
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
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>Category Name *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  maxLength={100}
                  required
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>Slug *</label>
                <input 
                  type="text" 
                  value={formData.slug} 
                  onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontFamily: 'monospace' }}
                  maxLength={100}
                  required
                  pattern="^[a-z0-9-]+$"
                  title="Only lowercase letters, numbers, and hyphens are allowed"
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>Description</label>
              <textarea 
                value={formData.description} 
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '100px' }}
                maxLength={500}
              />
            </div>

            <div style={{ marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#334155' }}>Default Template Pack</label>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                Required for onboarding new clients into this category. Only packs assigned to this category are shown.
              </p>
              <select 
                value={formData.defaultTemplatePackId} 
                onChange={e => setFormData({ ...formData, defaultTemplatePackId: e.target.value })}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}
              >
                <option value="">-- None Selected --</option>
                {filteredPacks.map(p => (
                  <option key={p._id} value={p._id}>{p.name} {p.active ? '' : '(Inactive)'}</option>
                ))}
              </select>
              {filteredPacks.length === 0 && (
                <p style={{ fontSize: '12px', color: '#eab308', marginTop: '8px' }}>
                  No template packs exist for this category yet. You must create one first before setting a default.
                </p>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>Display Order</label>
                <input 
                  type="number" 
                  value={formData.displayOrder} 
                  onChange={e => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>Status</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '12px 0' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.active}
                    onChange={e => setFormData({ ...formData, active: e.target.checked })}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span style={{ fontSize: '14px', color: '#475569' }}>Category is active</span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
              <div>
                {/* Could add Delete button here if desired, but user didn't request it. */}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Link href="/tabdeal/categories">
                  <Button type="button" variant="outline">Cancel</Button>
                </Link>
                <Button type="submit" isLoading={loading}>Save Changes</Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
