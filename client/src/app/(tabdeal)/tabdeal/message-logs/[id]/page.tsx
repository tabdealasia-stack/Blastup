'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, ShieldBan, MessageSquare, AlertTriangle, Key, Building2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import { tabdealApi } from '@/lib/api';
import Link from 'next/link';

export default function MessageLogDetailPage({ params }: { params: { id: string } }) {
  const [log, setLog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLog();
  }, [params.id]);

  const fetchLog = async () => {
    try {
      setLoading(true);
      const res = await tabdealApi.getMessageLog(params.id);
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
        <Header title="Diagnostic Detail" subtitle="Loading..." />
        <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>Loading...</div>
      </>
    );
  }

  if (error || !log) {
    return (
      <>
        <Header title="Diagnostic Detail" subtitle="Error" />
        <div style={{ textAlign: 'center', padding: '48px', color: '#ef4444' }}>{error || 'Not found'}</div>
      </>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500 }}>{status}</span>;
      case 'failed':
        return <span style={{ background: '#fee2e2', color: '#991b1b', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500 }}>{status}</span>;
      default:
        return <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500 }}>{status}</span>;
    }
  };

  return (
    <>
      <Header title="Message Diagnostics" subtitle={`Log ID: ${log._id}`} />
      
      <div className="page-content" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '24px' }}>
          <Link href="/tabdeal/message-logs" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>
            <ArrowLeft size={16} /> Back to Message Logs
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Header Summary */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Recipient</div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a' }}>{log.to}</div>
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
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Client & Connection</h3>
            </div>
            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Business Name</label>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>{log.clientId?.businessName || 'Unknown'}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>API Key</label>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>{log.apiKeyId?.name || 'Unknown'} ({log.apiKeyId?.keyPrefix}...)</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>WhatsApp Connection</label>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>
                  {log.whatsappAccountId ? (
                    <>{log.whatsappAccountId.phoneNumber || 'Unknown Number'} ({log.whatsappAccountId.status})</>
                  ) : 'Not provided'}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Provider Message ID</label>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#334155', fontFamily: 'monospace' }}>{log.providerMessageId || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Template Info */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} className="text-slate-500" />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Message Details</h3>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Message Type</label>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#334155', textTransform: 'capitalize' }}>{log.messageType}</div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Template Used</label>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>
                    {log.templateId ? `${log.templateId.name} (${log.templateId.event})` : 'N/A'}
                  </div>
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>Preview Content</label>
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap', color: '#334155', fontSize: '14px' }}>
                  {log.messagePreview || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No preview available</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} className="text-slate-500" />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Lifecycle Timestamps</h3>
            </div>
            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Created (Queued)</label>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>{new Date(log.createdAt).toLocaleString()}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Sent to WhatsApp</label>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>
                  {log.sentAt ? new Date(log.sentAt).toLocaleString() : 'N/A'}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Delivered</label>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>
                  {log.deliveredAt ? new Date(log.deliveredAt).toLocaleString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>

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
