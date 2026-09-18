'use client';

import { useState, useEffect } from 'react';
import { FileText, Search, RefreshCw, Eye, Activity } from 'lucide-react';
import Header from '@/components/layout/Header';
import { tabdealApi } from '@/lib/api';
import Link from 'next/link';

export default function EventLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [page, clientFilter, statusFilter]);

  const fetchClients = async () => {
    try {
      const res = await tabdealApi.getClients({ limit: 100 });
      setClients(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLogs = async (forceSearch?: boolean) => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      if (clientFilter) params.clientId = clientFilter;
      if (statusFilter) params.status = statusFilter;
      if (search || forceSearch) params.search = search;
      
      const res = await tabdealApi.getEventLogs(params);
      setLogs(res.data);
      setTotalPages(res.pagination.pages);
    } catch (err: any) {
      setError(err.message || 'Failed to load event logs');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500 }}>{status}</span>;
      case 'failed':
        return <span style={{ background: '#fee2e2', color: '#991b1b', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500 }}>{status}</span>;
      case 'skipped':
        return <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500 }}>{status}</span>;
      default:
        return <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500 }}>{status}</span>;
    }
  };

  return (
    <>
      <Header title="API Event Logs" subtitle="Diagnostic view of incoming notification API triggers" />
      
      <div className="page-content" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Search by event name or event ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchLogs(true)}
              style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
            />
          </div>
          
          <select 
            value={clientFilter} 
            onChange={(e) => { setClientFilter(e.target.value); setPage(1); }}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: '#fff', minWidth: '150px' }}
          >
            <option value="">All Clients</option>
            {clients.map(c => (
              <option key={c._id} value={c._id}>{c.businessName}</option>
            ))}
          </select>

          <select 
            value={statusFilter} 
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: '#fff', minWidth: '120px' }}
          >
            <option value="">All Statuses</option>
            <option value="processing">Processing</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="skipped">Skipped</option>
          </select>

          <button onClick={() => fetchLogs(true)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#6366F1', color: 'white', cursor: 'pointer', fontWeight: 500 }}>
            Search
          </button>
        </div>

        {error && (
          <div style={{ padding: '16px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '24px' }}>
            {error}
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '16px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Date</th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Client</th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Event Name</th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'right', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>No event logs found.</td></tr>
              ) : (
                logs.map(log => (
                  <tr key={log._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#334155' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#334155', fontWeight: 500 }}>
                      {log.clientId?.businessName || 'Unknown'}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#334155' }}>
                      <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{log.event}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                        ID: {log.eventId}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {getStatusBadge(log.status)}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <Link href={`/tabdeal/event-logs/${log._id}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', background: '#f1f5f9', color: '#475569', textDecoration: 'none' }}>
                        <Eye size={16} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {!loading && logs.length > 0 && (
            <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <span style={{ fontSize: '14px', color: '#64748b' }}>Page {page} of {totalPages || 1}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: page === 1 ? '#f1f5f9' : '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
                >
                  Previous
                </button>
                <button 
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: page >= totalPages ? '#f1f5f9' : '#fff', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
