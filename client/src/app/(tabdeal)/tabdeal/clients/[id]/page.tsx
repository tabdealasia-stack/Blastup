'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, ShieldBan, Smartphone, FileText, Key, Code, MessageSquare, Zap, Clock, Globe } from 'lucide-react';
import Header from '@/components/layout/Header';
import { tabdealApi } from '@/lib/api';
import Link from 'next/link';
import ClientWhatsApp from './ClientWhatsApp';

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'templates' | 'whatsapp' | 'logs' | 'api' | 'integration'>('overview');

  // Logs state
  const [messageLogs, setMessageLogs] = useState<any[]>([]);
  const [eventLogs, setEventLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    fetchClient();
  }, [params.id]);

  useEffect(() => {
    if (activeTab === 'logs' && messageLogs.length === 0 && eventLogs.length === 0) {
      fetchLogs();
    }
  }, [activeTab]);

  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      const [msgRes, evtRes] = await Promise.all([
        tabdealApi.getMessageLogs({ clientId: params.id, limit: 10 }),
        tabdealApi.getEventLogs({ clientId: params.id, limit: 10 })
      ]);
      setMessageLogs(msgRes.data);
      setEventLogs(evtRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchClient = async () => {
    try {
      setLoading(true);
      const res = await tabdealApi.getClient(params.id);
      setClient(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load client');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header title="Client Details" subtitle="Loading..." />
        <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>Loading...</div>
      </>
    );
  }

  if (error || !client) {
    return (
      <>
        <Header title="Error" subtitle="Could not load client" />
        <div style={{ textAlign: 'center', padding: '48px', color: '#ef4444' }}>{error || 'Not found'}</div>
      </>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FileText size={16} /> },
    { id: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare size={16} /> },
    { id: 'templates', label: 'Templates', icon: <FileText size={16} /> },
    { id: 'api', label: 'API Keys', icon: <Key size={16} /> },
    { id: 'integration', label: 'Integration', icon: <Code size={16} /> },
    { id: 'logs', label: 'Logs', icon: <Zap size={16} /> },
  ];

  return (
    <>
      <Header title={client.businessName} subtitle={`Client tenant management`} />
      
      <div className="page-content" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '24px' }}>
          <Link href="/tabdeal/clients" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>
            <ArrowLeft size={16} /> Back to Clients
          </Link>
        </div>

        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: '32px', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', 
                background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '14px',
                color: activeTab === tab.id ? '#6366F1' : '#64748b',
                borderBottom: activeTab === tab.id ? '2px solid #6366F1' : '2px solid transparent',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '16px', color: '#0f172a' }}>Business Profile</h3>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Business Name</div>
                  <div style={{ fontWeight: 500, color: '#334155' }}>{client.businessName}</div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Category</div>
                  <div style={{ fontWeight: 500, color: '#334155' }}>{client.categoryId?.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Slug</div>
                  <div style={{ fontWeight: 500, color: '#334155' }}>{client.slug}</div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Status</div>
                  <div>
                    {client.status === 'active' ? (
                      <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500 }}>Active</span>
                    ) : (
                      <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500 }}>{client.status}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '16px', color: '#0f172a' }}>Contact & Settings</h3>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Email</div>
                  <div style={{ fontWeight: 500, color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {client.email || 'Not set'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Website</div>
                  <div style={{ fontWeight: 500, color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {client.website ? <a href={client.website} target="_blank" rel="noreferrer" style={{ color: '#6366F1' }}>{client.website}</a> : 'Not set'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Timezone</div>
                  <div style={{ fontWeight: 500, color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Globe size={14} className="text-slate-400" /> {client.settings?.timezone || 'Asia/Kolkata'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Default Country Code</div>
                  <div style={{ fontWeight: 500, color: '#334155' }}>+{client.settings?.defaultCountryCode || '91'}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WHATSAPP TAB */}
        {activeTab === 'whatsapp' && (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <h3 style={{ margin: '0 0 24px', fontSize: '18px', color: '#0f172a' }}>WhatsApp Connection</h3>
            <ClientWhatsApp clientId={client._id} initialStatus={client.whatsapp} />
          </div>
        )}

        {/* TEMPLATES TAB */}
        {activeTab === 'templates' && (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Event Name</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Platform Name</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Status</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Custom Override</th>
                </tr>
              </thead>
              <tbody>
                {client.templates && client.templates.length > 0 ? (
                  client.templates.map((t: any) => (
                    <tr key={t._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '16px', fontWeight: 500, color: '#0f172a' }}>{t.templateId?.eventName || 'Unknown Event'}</td>
                      <td style={{ padding: '16px', color: '#334155' }}>{t.templateId?.platformTemplateName || '-'}</td>
                      <td style={{ padding: '16px' }}>
                        {t.enabled ? (
                          <span style={{ color: '#16a34a', fontSize: '13px', fontWeight: 500 }}>Enabled</span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>Disabled</span>
                        )}
                      </td>
                      <td style={{ padding: '16px', color: '#64748b', fontSize: '13px' }}>
                        {t.customMessage ? 'Yes' : 'No'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>No templates assigned to this client.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* API TAB */}
        {activeTab === 'api' && (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>API Keys</h3>
              <button style={{ padding: '8px 16px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, fontSize: '13px' }}>
                Generate New Key
              </button>
            </div>
            
            {client.apiKeys && client.apiKeys.length > 0 ? (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <tr>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Name</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Prefix</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Created</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Last Used</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {client.apiKeys.map((key: any) => (
                      <tr key={key._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 500, color: '#334155' }}>{key.name}</td>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#475569' }}>{key.keyPrefix}••••••••</td>
                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '13px' }}>{new Date(key.createdAt).toLocaleDateString()}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '13px' }}>{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ color: key.status === 'active' ? '#16a34a' : '#ef4444', fontSize: '13px', fontWeight: 500, textTransform: 'capitalize' }}>
                            {key.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>Revoke</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ color: '#64748b', textAlign: 'center', padding: '32px', background: '#f8fafc', borderRadius: '8px' }}>
                No API keys found.
              </div>
            )}
          </div>
        )}

        {/* INTEGRATION PLACEHOLDER */}
        {activeTab === 'integration' && (
          <div style={{ textAlign: 'center', padding: '64px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 8px', color: '#0f172a' }}>Coming Soon</h3>
            <p style={{ margin: 0, color: '#64748b' }}>This section will be available in a future phase.</p>
          </div>
        )}

        {/* LOGS TAB */}
        {activeTab === 'logs' && (
          <div style={{ display: 'grid', gap: '24px' }}>
            {/* Event Logs */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 600 }}>Recent API Events</h3>
                <Link href={`/tabdeal/event-logs?client=${client._id}`} style={{ fontSize: '13px', color: '#6366F1', textDecoration: 'none', fontWeight: 500 }}>View All</Link>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '12px 24px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Date</th>
                    <th style={{ padding: '12px 24px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Event</th>
                    <th style={{ padding: '12px 24px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logsLoading ? (
                    <tr><td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Loading...</td></tr>
                  ) : eventLogs.length === 0 ? (
                    <tr><td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No events found.</td></tr>
                  ) : (
                    eventLogs.map(log => (
                      <tr key={log._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px 24px', fontSize: '13px', color: '#64748b' }}>{new Date(log.createdAt).toLocaleString()}</td>
                        <td style={{ padding: '12px 24px', fontSize: '13px', color: '#334155', fontFamily: 'monospace' }}>
                          <Link href={`/tabdeal/event-logs/${log._id}`} style={{ color: '#0f172a', textDecoration: 'none', fontWeight: 500 }}>{log.event}</Link>
                        </td>
                        <td style={{ padding: '12px 24px', fontSize: '13px' }}>
                          <span style={{ color: log.status === 'sent' ? '#166534' : log.status === 'skipped' ? '#92400e' : log.status === 'failed' ? '#991b1b' : '#475569', background: log.status === 'sent' ? '#dcfce7' : log.status === 'skipped' ? '#fef3c7' : log.status === 'failed' ? '#fee2e2' : '#f1f5f9', padding: '2px 8px', borderRadius: '9999px', fontWeight: 500 }}>{log.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Message Logs */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: 600 }}>Recent Outbound Messages</h3>
                <Link href={`/tabdeal/message-logs?client=${client._id}`} style={{ fontSize: '13px', color: '#6366F1', textDecoration: 'none', fontWeight: 500 }}>View All</Link>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '12px 24px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Date</th>
                    <th style={{ padding: '12px 24px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>To</th>
                    <th style={{ padding: '12px 24px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logsLoading ? (
                    <tr><td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Loading...</td></tr>
                  ) : messageLogs.length === 0 ? (
                    <tr><td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No messages found.</td></tr>
                  ) : (
                    messageLogs.map(log => (
                      <tr key={log._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px 24px', fontSize: '13px', color: '#64748b' }}>{new Date(log.createdAt).toLocaleString()}</td>
                        <td style={{ padding: '12px 24px', fontSize: '13px', color: '#334155' }}>
                          <Link href={`/tabdeal/message-logs/${log._id}`} style={{ color: '#0f172a', textDecoration: 'none', fontWeight: 500 }}>{log.to}</Link>
                        </td>
                        <td style={{ padding: '12px 24px', fontSize: '13px' }}>
                          <span style={{ color: (log.status === 'sent' || log.status === 'delivered') ? '#166534' : log.status === 'failed' ? '#991b1b' : '#475569', background: (log.status === 'sent' || log.status === 'delivered') ? '#dcfce7' : log.status === 'failed' ? '#fee2e2' : '#f1f5f9', padding: '2px 8px', borderRadius: '9999px', fontWeight: 500 }}>{log.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
