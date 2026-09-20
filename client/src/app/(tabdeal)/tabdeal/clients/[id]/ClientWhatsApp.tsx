'use client';
import { useState, useEffect, useRef } from 'react';
import { Smartphone, RefreshCw, XCircle } from 'lucide-react';
import { tabdealApi } from '@/lib/api';

export default function ClientWhatsApp({ clientId, initialStatus }: { clientId: string, initialStatus: any }) {
  const [status, setStatus] = useState<string>(initialStatus?.status || 'disconnected');
  const [phoneNumber, setPhoneNumber] = useState<string>(initialStatus?.phoneNumber || '');
  const [qr, setQr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollRef = useRef<any>(null);

  useEffect(() => {
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 5000);
    return () => clearInterval(pollRef.current);
  }, [clientId]);

  const fetchStatus = async () => {
    try {
      const res = await tabdealApi.getClientWhatsAppStatus(clientId);
      if (res.success && res.data) {
        setStatus(res.data.status);
        setPhoneNumber(res.data.phoneNumber || '');
      }
    } catch (err: any) {
      if (err.message?.includes('404') || err.response?.status === 404 || err.message?.includes('not configured')) {
        setStatus('not_provisioned');
      }
    }
  };

  const handleProvision = async () => {
    try {
      setLoading(true);
      setError(null);
      await tabdealApi.provisionClientWhatsApp(clientId);
      await fetchStatus();
    } catch (err: any) {
      setError(err.message || 'Failed to provision');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    try {
      setLoading(true);
      setError(null);
      setQr(null);
      const res = await tabdealApi.getClientWhatsAppQR(clientId);
      if (res.data?.qr) {
        setQr(res.data.qr);
        setStatus('qr_ready');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch QR');
    } finally {
      setLoading(false);
    }
  };

  const handleReconnect = async () => {
    try {
      setLoading(true);
      setError(null);
      await tabdealApi.reconnectClientWhatsApp(clientId);
      await fetchStatus();
      setQr(null);
    } catch (err: any) {
      setError(err.message || 'Failed to reconnect');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'not_provisioned') {
    return (
      <div>
        <div style={{ color: '#64748b', marginBottom: '16px' }}>No WhatsApp account provisioned for this client.</div>
        <button 
          onClick={handleProvision}
          disabled={loading}
          style={{ padding: '8px 16px', background: '#6366F1', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Provisioning...' : 'Provision WhatsApp'}
        </button>
        {error && <div style={{ color: '#ef4444', marginTop: '8px', fontSize: '13px' }}>{error}</div>}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ 
          width: '64px', height: '64px', borderRadius: '50%', 
          background: status === 'connected' ? '#dcfce7' : '#f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: status === 'connected' ? '#10b981' : '#64748b'
        }}>
          <Smartphone size={32} />
        </div>
        <div>
          <h4 style={{ margin: '0 0 4px', fontSize: '18px', color: '#0f172a' }}>{phoneNumber || 'No Number Connected'}</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: status === 'connected' ? '#10b981' : '#64748b', fontWeight: 500, textTransform: 'capitalize' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: status === 'connected' ? '#10b981' : (status === 'qr_ready' ? '#f59e0b' : '#94a3b8') }}></span>
            {status}
          </div>
        </div>
      </div>
      
      {qr && status === 'qr_ready' && (
        <div style={{ marginBottom: '24px', background: '#fff', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'inline-block' }}>
          <img src={qr} alt="WhatsApp QR Code" style={{ width: '256px', height: '256px', display: 'block' }} />
          <div style={{ textAlign: 'center', marginTop: '12px', color: '#64748b', fontSize: '13px' }}>Scan with WhatsApp</div>
        </div>
      )}

      {error && <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '13px', background: '#fee2e2', padding: '8px 12px', borderRadius: '6px' }}>{error}</div>}

      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <h4 style={{ margin: '0 0 16px', fontSize: '14px', color: '#475569', fontWeight: 600 }}>Connection Actions</h4>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleGenerateQR} disabled={loading || status === 'connected'} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#334155', fontWeight: 500, cursor: (loading || status === 'connected') ? 'not-allowed' : 'pointer' }}>
            Generate QR Code
          </button>
          <button onClick={handleReconnect} disabled={loading} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#334155', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer' }}>
            Reconnect
          </button>
        </div>
      </div>
    </div>
  );
}
