'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Search, ShieldBan, CheckCircle, Folder, Settings, RefreshCw } from 'lucide-react';
import Header from '@/components/layout/Header';
import { tabdealApi } from '@/lib/api';
import Link from 'next/link';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [packs, setPacks] = useState<any[]>([]);
  
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [packFilter, setPackFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [templatesRes, catRes, packsRes] = await Promise.all([
        tabdealApi.getTemplates(),
        tabdealApi.getCategories(),
        tabdealApi.getTemplatePacks()
      ]);
      setTemplates(templatesRes.data);
      setCategories(catRes.data);
      setPacks(packsRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filteredPacks = categoryFilter ? packs.filter(p => p.categoryId?._id === categoryFilter) : packs;

  const filteredTemplates = templates.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.event.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter ? t.templatePackId?.categoryId?._id === categoryFilter : true;
    const matchPack = packFilter ? t.templatePackId?._id === packFilter : true;
    const matchStatus = statusFilter ? (statusFilter === 'active' ? t.active : !t.active) : true;
    return matchSearch && matchCat && matchPack && matchStatus;
  });

  return (
    <>
      <Header title="Notification Templates" subtitle="Manage master templates for notification events" />
      
      <div className="page-content" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', flex: 1, maxWidth: '800px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 200px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
              />
            </div>
            
            <select 
              value={categoryFilter} 
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPackFilter('');
              }}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: '#fff', minWidth: '150px' }}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>

            <select 
              value={packFilter} 
              onChange={(e) => setPackFilter(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: '#fff', minWidth: '150px' }}
            >
              <option value="">All Packs</option>
              {filteredPacks.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>

            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: '#fff', minWidth: '120px' }}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button onClick={fetchData} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }} title="Refresh">
              <RefreshCw size={18} className="text-slate-500" />
            </button>
          </div>
          
          <Link 
            href="/tabdeal/templates/new"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#6366F1', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 500, textDecoration: 'none' }}
          >
            <Plus size={18} />
            Create Template
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>Loading templates...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#ef4444' }}>{error}</div>
        ) : filteredTemplates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <FileText size={48} style={{ color: '#94a3b8', margin: '0 auto 16px' }} />
            <h3 style={{ margin: '0 0 8px', color: '#334155' }}>No Templates Found</h3>
            <p style={{ margin: 0, color: '#64748b' }}>There are no templates matching your criteria.</p>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Template Name / Event</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Pack & Category</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Variables</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Status</th>
                  <th style={{ padding: '16px', textAlign: 'right', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTemplates.map(t => (
                  <tr key={t._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px' }}>
                      <Link href={`/tabdeal/templates/${t._id}`} style={{ fontWeight: 600, color: '#6366F1', textDecoration: 'none' }}>
                        {t.name}
                      </Link>
                      <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', fontFamily: 'monospace' }}>{t.event}</div>
                    </td>
                    <td style={{ padding: '16px', color: '#334155' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                        <Folder size={14} className="text-slate-400" />
                        {t.templatePackId?.name || 'Unknown Pack'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                        {t.templatePackId?.categoryId?.name || 'Unknown Category'}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {t.variables && t.variables.length > 0 ? (
                          t.variables.map((v: string) => (
                            <span key={v} style={{ padding: '2px 6px', background: '#f1f5f9', color: '#475569', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }}>
                              {v}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '13px' }}>None</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {t.active ? (
                        <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={14} /> Active
                        </span>
                      ) : (
                        <span style={{ background: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldBan size={14} /> Inactive
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <Link href={`/tabdeal/templates/${t._id}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', background: '#f1f5f9', color: '#475569', textDecoration: 'none' }}>
                        <Settings size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </>
  );
}
