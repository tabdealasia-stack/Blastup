'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Edit3, ShieldBan, Trash2, CheckCircle, Package, Folder, Plus, Settings, FileText } from 'lucide-react';
import Header from '@/components/layout/Header';
import { tabdealApi } from '@/lib/api';
import Link from 'next/link';

export default function TemplatePackDetailPage({ params }: { params: { id: string } }) {
  const [pack, setPack] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPackAndTemplates();
  }, [params.id]);

  const fetchPackAndTemplates = async () => {
    try {
      setLoading(true);
      const [packRes, templatesRes] = await Promise.all([
        tabdealApi.getTemplatePack(params.id),
        tabdealApi.getTemplates({ templatePackId: params.id, limit: 100 })
      ]);
      setPack(packRes.data);
      setTemplates(templatesRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load pack');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header title="Template Pack Details" subtitle="Loading..." />
        <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>Loading...</div>
      </>
    );
  }

  if (error || !pack) {
    return (
      <>
        <Header title="Error" subtitle="Could not load template pack" />
        <div style={{ textAlign: 'center', padding: '48px', color: '#ef4444' }}>{error || 'Not found'}</div>
      </>
    );
  }

  return (
    <>
      <Header title={pack.name} subtitle={`Manage templates for ${pack.name}`} />
      
      <div className="page-content" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '24px' }}>
          <Link href="/tabdeal/template-packs" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>
            <ArrowLeft size={16} /> Back to Template Packs
          </Link>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Slug</div>
              <div style={{ fontWeight: 500, color: '#0f172a' }}>{pack.slug}</div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Category</div>
              <div style={{ fontWeight: 500, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Folder size={14} className="text-slate-400" />
                {pack.categoryId?.name}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Status</div>
              <div>
                {pack.active ? (
                  <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={14} /> Active
                  </span>
                ) : (
                  <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldBan size={14} /> Inactive
                  </span>
                )}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Description</div>
              <div style={{ color: '#334155', fontSize: '14px' }}>{pack.description || 'No description provided.'}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 600 }}>Master Templates ({pack.templates?.length || 0})</h2>
        </div>

        {pack.templates && pack.templates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <FileText size={48} style={{ color: '#94a3b8', margin: '0 auto 16px' }} />
            <h3 style={{ margin: '0 0 8px', color: '#334155' }}>No Templates Found</h3>
            <p style={{ margin: 0, color: '#64748b' }}>There are no templates in this pack yet.</p>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Template Name</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Event</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Variables</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Status</th>
                  <th style={{ padding: '16px', textAlign: 'right', color: '#64748b', fontWeight: 500, fontSize: '13px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.length > 0 ? (
                  templates.map(t => (
                    <tr key={t._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '16px', fontWeight: 500, color: '#334155' }}>{t.name}</td>
                      <td style={{ padding: '16px', color: '#475569', fontFamily: 'monospace' }}>{t.event}</td>
                      <td style={{ padding: '16px', color: '#64748b', fontSize: '13px' }}>
                        {t.variables?.length ? t.variables.join(', ') : 'None'}
                      </td>
                      <td style={{ padding: '16px' }}>
                        {t.active ? (
                          <span style={{ color: '#16a34a', fontSize: '13px', fontWeight: 500 }}>Active</span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>Inactive</span>
                        )}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <Link href={`/tabdeal/templates/${t._id}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', background: '#f1f5f9', color: '#475569', textDecoration: 'none' }}>
                          <Settings size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                      No templates in this pack yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </>
  );
}
