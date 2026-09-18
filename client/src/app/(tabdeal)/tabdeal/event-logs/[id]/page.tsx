'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Activity, AlertTriangle, Building2, Link as LinkIcon, CheckCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import { tabdealApi } from '@/lib/api';
import Link from 'next/link';

export default function EventLogDetailPage({ params }: { params: { id: string } }) {
  const [log, setLog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLog();
  }, [params.id]);

  const fetchLog = async () => {
    try {
      setLoading(true);
      const res = await tabdealApi.getEventLog(params.id);
      setLog(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load log');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header title="Event Diagnostic Detail" subtitle="Loading..." />
        <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>Loading...</div>
      </>
    );
  }

  if (error || !log) {
    return (
      <>
        <Header title="Event Diagnostic Detail" subtitle="Error" />
        <div style={{ textAlign: 'center', padding: '48px', color: '#ef4444' }}>{error || 'Not found'}</div>
      </>
    );
  }

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
      <Header title="API Event Diagnostics" subtitle={`Log ID: ${log._id}`} />
      
      <div className="page-content" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '24px' }}>
          <Link href="/tabdeal/event-logs" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>
            <ArrowLeft size={16} /> Back to Event Logs
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Header Summary */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Event Name</div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', fontFamily: 'monospace' }}>{log.event}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Status</div>
              {getStatusBadge(log.status)}
            </div>
          </div>

          {/* Trace Info */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={18} className="text-slate-500" />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Client & Origin</h3>
            </div>
            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Business Name</label>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>{log.clientId?.businessName || 'Unknown'}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Idempotency Event ID</label>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#334155', fontFamily: 'monospace', wordBreak: 'break-all' }}>{log.eventId}</div>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} className="text-slate-500" />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Lifecycle Timestamps</h3>
            </div>
            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Received At</label>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>{new Date(log.createdAt).toLocaleString()}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Last Updated</label>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>{new Date(log.updatedAt).toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Outbound Message Reference */}
          {log.messageLogId && (
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LinkIcon size={18} className="text-indigo-500" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Generated Message</h3>
              </div>
              <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                    Message to: {log.messageLogId.to}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    Status: {log.messageLogId.status} | Provider ID: {log.messageLogId.providerMessageId || 'N/A'}
                  </div>
                </div>
                <Link href={`/tabdeal/message-logs/${log.messageLogId._id}`} style={{ padding: '8px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', color: '#475569', fontSize: '13px', fontWeight: 500, textDecoration: 'none' }}>
                  View Message Log
                </Link>
              </div>
            </div>
          )}

          {/* Error Details if any */}
          {(log.errorCode || log.errorMessage) && (
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #fecaca', overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', background: '#fef2f2', borderBottom: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} className="text-red-600" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#991b1b' }}>Failure Diagnostics</h3>
              </div>
              <div style={{ padding: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#991b1b', marginBottom: '4px', fontWeight: 600 }}>Error Code</label>
                  <div style={{ fontSize: '14px', color: '#b91c1c', fontFamily: 'monospace' }}>{log.errorCode || 'UNKNOWN'}</div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#991b1b', marginBottom: '4px', fontWeight: 600 }}>Error Message</label>
                  <div style={{ padding: '12px', background: '#fef2f2', borderRadius: '6px', color: '#b91c1c', fontSize: '14px' }}>
                    {log.errorMessage || 'No error message provided'}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </>
  );
}
