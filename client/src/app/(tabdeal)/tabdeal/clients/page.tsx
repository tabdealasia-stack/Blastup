'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Search, ShieldBan, CheckCircle, Folder, Settings, RefreshCw, MessageSquare } from 'lucide-react';
import Header from '@/components/layout/Header';
import { tabdealApi } from '@/lib/api';
import Link from 'next/link';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [clientsRes, catRes] = await Promise.all([
        tabdealApi.getClients(),
        tabdealApi.getCategories()
      ]);
      setClients(clientsRes.data);
      setCategories(catRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(c => {
    const matchSearch = c.businessName.toLowerCase().includes(search.toLowerCase()) || c.slug.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter ? c.categoryId?._id === categoryFilter : true;
    const matchStatus = statusFilter ? c.status === statusFilter : true;
    return matchSearch && matchCat && matchStatus;
  });

  return (
    <>
      <Header title="Clients" subtitle="Manage tenant accounts and WhatsApp provisioning" />
      
      <div className="page-content" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', flex: 1, maxWidth: '800px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 200px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Search clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
              />
            </div>
            
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: '#fff', minWidth: '150px' }}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>

            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: '#fff', minWidth: '150px' }}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>

            <button onClick={fetchData} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }} title="Refresh">
              <RefreshCw size={18} className="text-slate-500" />
            </button>
          </div>
          
          <Link 
            href="/tabdeal/clients/new"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#6366F1', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 500, textDecoration: 'none' }}
          >
            <Plus size={18} />
            Add Client
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>Loading clients...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#ef4444' }}>{error}</div>
        ) : filteredClients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <Users size={48} style={{ color: '#94a3b8', margin: '0 auto 16px' }} />
            <h3 style={{ margin: '0 0 8px', color: '#334155' }}>No Clients Found</h3>
            <p style={{ margin: 0, color: '#64748b' }}>There are no clients matching your criteria.</p>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Business</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Category</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>WhatsApp</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Status</th>
                  <th style={{ padding: '16px', textAlign: 'right', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map(client => (
                  <tr key={client._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px' }}>
                      <Link href={`/tabdeal/clients/${client._id}`} style={{ fontWeight: 600, color: '#6366F1', textDecoration: 'none' }}>
                        {client.businessName}
                      </Link>
                      <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>{client.slug}</div>
                    </td>
                    <td style={{ padding: '16px', color: '#334155' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Folder size={14} className="text-slate-400" />
                        {client.categoryId?.name || 'Unknown'}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#334155' }}>
                        <MessageSquare size={14} className={client.whatsappStatus === 'connected' ? 'text-emerald-500' : 'text-slate-400'} />
                        {client.whatsappNumber || 'Not set'}
                      </div>
                      <div style={{ fontSize: '12px', marginTop: '2px', color: client.whatsappStatus === 'connected' ? '#10b981' : '#64748b', textTransform: 'capitalize' }}>
                        {client.whatsappStatus}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {client.status === 'active' ? (
                        <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={14} /> Active
                        </span>
                      ) : (
                        <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldBan size={14} /> {client.status}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <Link href={`/tabdeal/clients/${client._id}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', background: '#f1f5f9', color: '#475569', textDecoration: 'none' }}>
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
