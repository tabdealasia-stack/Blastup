'use client';

import { useState, useEffect } from 'react';
import { 
  Users, Server, MessageSquare, AlertCircle, RefreshCw, Send, CheckCircle, SkipForward, AlertOctagon
} from 'lucide-react';
import Header from '@/components/layout/Header';
import { tabdealApi } from '@/lib/api';

export default function TabdealDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await tabdealApi.getDashboardMetrics();
      setData(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, colorClass }: { title: string, value: number | null | undefined, icon: any, colorClass: string }) => (
    <div className="stat-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div className={`icon-container ${colorClass}`} style={{ padding: '12px', borderRadius: '8px', background: '#f8fafc' }}>
        <Icon size={24} />
      </div>
      <div>
        <h3 style={{ fontSize: '14px', color: '#64748b', margin: 0, fontWeight: 500 }}>{title}</h3>
        <p style={{ fontSize: '24px', color: '#0f172a', margin: '4px 0 0 0', fontWeight: 700 }}>
          {value !== undefined && value !== null ? value : <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 400 }}>--</span>}
        </p>
      </div>
    </div>
  );

  return (
    <>
      <Header title="TABDEAL Management" subtitle="Superadmin Dashboard Overview" />
      
      <div className="page-content" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: '#334155' }}>Today's Overview</h2>
          <button 
            onClick={fetchMetrics} 
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            <RefreshCw size={16} className={`text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#475569' }}>Refresh</span>
          </button>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <StatCard title="Active Clients" value={data?.totalActiveClients} icon={Users} colorClass="text-blue-500" />
          <StatCard title="Total Events Received" value={data?.eventsToday} icon={MessageSquare} colorClass="text-indigo-500" />
          <StatCard title="Messages Sent" value={data?.sentToday} icon={Send} colorClass="text-emerald-500" />
          <StatCard title="Messages Failed" value={data?.failedToday} icon={AlertOctagon} colorClass="text-red-500" />
          <StatCard title="Messages Queued" value={data?.queuedToday} icon={RefreshCw} colorClass="text-amber-500" />
          <StatCard title="Events Skipped / Duplicates" value={data?.skippedEventsToday} icon={SkipForward} colorClass="text-slate-500" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
          
          {/* System Status */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Server className="text-indigo-500" size={20} />
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>System Components</h2>
            </div>
            <div style={{ padding: '16px', color: '#334155', background: '#f8fafc', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px' }}>TABDEAL Logs API</span>
                <span style={{ fontSize: '12px', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '9999px', fontWeight: 500 }}>Online</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px' }}>WhatsApp Engine</span>
                <span style={{ fontSize: '12px', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '9999px', fontWeight: 500 }}>Online</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px' }}>Redis SafeMode</span>
                <span style={{ fontSize: '12px', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '9999px', fontWeight: 500 }}>Online</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
