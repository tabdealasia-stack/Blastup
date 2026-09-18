'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, ShieldBan, Copy } from 'lucide-react';
import Header from '@/components/layout/Header';
import { tabdealApi } from '@/lib/api';
import Link from 'next/link';

export default function NewClientPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    businessName: '',
    categoryId: '',
    whatsappNumber: '',
    website: '',
    email: '',
    timezone: 'Asia/Kolkata',
    defaultCountryCode: '91',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await tabdealApi.getCategories();
      setCategories(res.data.filter((c: any) => c.active));
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        whatsappNumber: formData.whatsappNumber || null,
        website: formData.website || null,
        email: formData.email || null,
      };
      
      const res = await tabdealApi.createClient(payload);
      setResult(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to provision client');
    } finally {
      setLoading(false);
    }
  };

  const copyApiKey = () => {
    if (result?.apiKey) {
      navigator.clipboard.writeText(result.apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (result) {
    return (
      <>
        <Header title="Client Provisioned" subtitle="Client created successfully" />
        <div className="page-content" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
          
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '32px', textAlign: 'center' }}>
            <CheckCircle size={64} style={{ color: '#10b981', margin: '0 auto 24px' }} />
            <h2 style={{ margin: '0 0 16px', color: '#0f172a' }}>{result.businessName} has been provisioned</h2>
            
            <div style={{ textAlign: 'left', background: '#f8fafc', padding: '24px', borderRadius: '8px', marginBottom: '32px' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#334155' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><CheckCircle size={16} className="text-emerald-500"/> Client created with slug: <strong>{result.slug}</strong></li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><CheckCircle size={16} className="text-emerald-500"/> Template Pack resolved</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><CheckCircle size={16} className="text-emerald-500"/> <strong>{result.templatesProvisioned}</strong> Templates assigned</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><CheckCircle size={16} className="text-emerald-500"/> WhatsApp instance provisioned</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><CheckCircle size={16} className="text-emerald-500"/> API credentials generated</li>
              </ul>
            </div>

            {result.apiKey && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '24px', marginBottom: '32px', textAlign: 'left' }}>
                <h3 style={{ margin: '0 0 12px', color: '#b45309', fontSize: '16px' }}>API Key Created</h3>
                <p style={{ margin: '0 0 16px', color: '#92400e', fontSize: '14px' }}>This key will only be shown once. Please copy it and store it securely.</p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input 
                    type="text" 
                    readOnly 
                    value={result.apiKey}
                    style={{ flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid #fcd34d', background: '#fff', outline: 'none', fontFamily: 'monospace' }}
                  />
                  <button onClick={copyApiKey} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
                    <Copy size={16} /> {copied ? 'Copied' : 'Copy API Key'}
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
              <Link href="/tabdeal/clients" style={{ padding: '12px 24px', background: '#f1f5f9', color: '#475569', borderRadius: '8px', textDecoration: 'none', fontWeight: 500 }}>
                Back to Clients
              </Link>
              <Link href={`/tabdeal/clients/${result.clientId}`} style={{ padding: '12px 24px', background: '#6366F1', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 500 }}>
                View Client Details & Connect WhatsApp
              </Link>
            </div>
          </div>

        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Add Client" subtitle="Provision a new client tenant" />
      
      <div className="page-content" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '24px' }}>
          <Link href="/tabdeal/clients" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>
            <ArrowLeft size={16} /> Back to Clients
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
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>Business Name *</label>
                <input 
                  type="text" 
                  value={formData.businessName} 
                  onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  required
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>Category *</label>
                <select 
                  value={formData.categoryId} 
                  onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff' }}
                  required
                >
                  <option value="" disabled>Select a Category</option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>WhatsApp Number *</label>
                <input 
                  type="text" 
                  value={formData.whatsappNumber} 
                  onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  required
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>Email</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>Website</label>
              <input 
                type="url" 
                value={formData.website} 
                onChange={e => setFormData({ ...formData, website: e.target.value })}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                placeholder="https://"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>Timezone</label>
                <select 
                  value={formData.timezone} 
                  onChange={e => setFormData({ ...formData, timezone: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff' }}
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>Default Country Code</label>
                <input 
                  type="text" 
                  value={formData.defaultCountryCode} 
                  onChange={e => setFormData({ ...formData, defaultCountryCode: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="submit" 
                disabled={loading}
                style={{ padding: '12px 32px', background: '#6366F1', color: '#fff', borderRadius: '8px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '16px' }}
              >
                {loading ? 'Creating Client...' : 'Create Client'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </>
  );
}
