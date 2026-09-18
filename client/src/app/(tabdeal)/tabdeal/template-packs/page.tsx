'use client';

import { useState, useEffect } from 'react';
import { Layers, Plus, Search, Edit2, Trash2, ShieldBan, CheckCircle, Folder } from 'lucide-react';
import Header from '@/components/layout/Header';
import { tabdealApi } from '@/lib/api';
import Link from 'next/link';

export default function TemplatePacksPage() {
  const [packs, setPacks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPack, setEditingPack] = useState<any>(null);
  
  const [formData, setFormData] = useState({ name: '', slug: '', categoryId: '', description: '', active: true });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [packsRes, catRes] = await Promise.all([
        tabdealApi.getTemplatePacks(),
        tabdealApi.getCategories()
      ]);
      setPacks(packsRes.data);
      setCategories(catRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (pack: any = null) => {
    if (pack) {
      setEditingPack(pack);
      setFormData({
        name: pack.name,
        slug: pack.slug,
        categoryId: pack.categoryId?._id || '',
        description: pack.description || '',
        active: pack.active,
      });
    } else {
      setEditingPack(null);
      setFormData({ name: '', slug: '', categoryId: '', description: '', active: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingPack) {
        await tabdealApi.updateTemplatePack(editingPack._id, formData);
      } else {
        await tabdealApi.createTemplatePack(formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to save pack');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this template pack? This action cannot be undone.')) {
      try {
        await tabdealApi.deleteTemplatePack(id);
        fetchData();
      } catch (err: any) {
        alert(err.message || 'Failed to delete pack');
      }
    }
  };

  const filteredPacks = packs.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter ? p.categoryId?._id === categoryFilter : true;
    return matchSearch && matchCategory;
  });

  return (
    <>
      <Header title="Template Packs" subtitle="Manage collections of notification templates" />
      
      <div className="page-content" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', flex: 1, maxWidth: '600px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Search packs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
              />
            </div>
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: '#fff' }}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#6366F1', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 500 }}
          >
            <Plus size={18} />
            Create Pack
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>Loading template packs...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#ef4444' }}>{error}</div>
        ) : filteredPacks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <Layers size={48} style={{ color: '#94a3b8', margin: '0 auto 16px' }} />
            <h3 style={{ margin: '0 0 8px', color: '#334155' }}>No Template Packs Found</h3>
            <p style={{ margin: 0, color: '#64748b' }}>Create your first template pack to get started.</p>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Name / Slug</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Category</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Status</th>
                  <th style={{ padding: '16px', textAlign: 'right', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Templates</th>
                  <th style={{ padding: '16px', textAlign: 'right', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Clients</th>
                  <th style={{ padding: '16px', textAlign: 'right', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPacks.map(pack => (
                  <tr key={pack._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px' }}>
                      <Link href={`/tabdeal/template-packs/${pack._id}`} style={{ fontWeight: 500, color: '#6366F1', textDecoration: 'none' }}>{pack.name}</Link>
                      <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>{pack.slug}</div>
                    </td>
                    <td style={{ padding: '16px', color: '#334155' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Folder size={14} className="text-slate-400" />
                        {pack.categoryId?.name || 'Unknown'}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {pack.active ? (
                        <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={14} /> Active
                        </span>
                      ) : (
                        <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldBan size={14} /> Inactive
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', color: '#334155' }}>{pack.templateCount}</td>
                    <td style={{ padding: '16px', textAlign: 'right', color: '#334155' }}>{pack.clientCount}</td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button onClick={() => handleOpenModal(pack)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366F1', marginRight: '16px' }}>
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(pack._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', padding: '32px', borderRadius: '12px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 24px', fontSize: '20px' }}>{editingPack ? 'Edit Template Pack' : 'Create Template Pack'}</h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  required
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>Slug</label>
                <input 
                  type="text" 
                  value={formData.slug} 
                  onChange={e => setFormData({ ...formData, slug: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  pattern="[a-z0-9-]+"
                  title="Only lowercase letters, numbers, and hyphens"
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>Category</label>
                <select 
                  value={formData.categoryId} 
                  onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  required
                >
                  <option value="" disabled>Select a Category</option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '80px' }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: '#334155', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.active} 
                    onChange={e => setFormData({ ...formData, active: e.target.checked })}
                  />
                  Active Pack
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '10px 16px', background: '#f1f5f9', color: '#475569', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  style={{ padding: '10px 16px', background: '#6366F1', color: '#fff', borderRadius: '8px', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 500 }}
                >
                  {submitting ? 'Saving...' : 'Save Pack'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
