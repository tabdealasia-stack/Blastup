'use client';

import { useState, useEffect } from 'react';
import { 
  Users, UserCheck, Wifi, WifiOff, MessageSquare, AlertCircle, 
  Activity, HeartPulse, Server
} from 'lucide-react';
import Header from '@/components/layout/Header';

interface TabdealDashboardData {
  totalClients: number | null;
  activeClients: number | null;
  waConnected: number | null;
  waDisconnected: number | null;
  messagesToday: number | null;
  failedMessages: number | null;
}

export default function TabdealDashboardPage() {
  const [data, setData] = useState<TabdealDashboardData>({
    totalClients: null,
    activeClients: null,
    waConnected: null,
    waDisconnected: null,
    messagesToday: null,
    failedMessages: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // API not yet implemented for phase 1A. 
    // Using empty state handling as requested.
    setLoading(false);
  }, []);

  const StatCard = ({ title, value, icon: Icon, colorClass }: { title: string, value: number | null, icon: any, colorClass: string }) => (
    <div className="stat-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div className={`icon-container ${colorClass}`} style={{ padding: '12px', borderRadius: '8px', background: '#f8fafc' }}>
        <Icon size={24} />
      </div>
      <div>
        <h3 style={{ fontSize: '14px', color: '#64748b', margin: 0, fontWeight: 500 }}>{title}</h3>
        <p style={{ fontSize: '24px', color: '#0f172a', margin: '4px 0 0 0', fontWeight: 700 }}>
          {value !== null ? value : <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 400 }}>Pending API</span>}
        </p>
      </div>
    </div>
  );

  return (
    <>
      <Header title="TABDEAL Management" subtitle="Superadmin Dashboard Overview" />
      
      <div className="page-content" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <StatCard title="Total Clients" value={data.totalClients} icon={Users} colorClass="text-blue-500" />
          <StatCard title="Active Clients" value={data.activeClients} icon={UserCheck} colorClass="text-green-500" />
          <StatCard title="WhatsApp Connected" value={data.waConnected} icon={Wifi} colorClass="text-emerald-500" />
          <StatCard title="WhatsApp Disconnected" value={data.waDisconnected} icon={WifiOff} colorClass="text-red-500" />
          <StatCard title="Messages Today" value={data.messagesToday} icon={MessageSquare} colorClass="text-purple-500" />
          <StatCard title="Failed Messages" value={data.failedMessages} icon={AlertCircle} colorClass="text-orange-500" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
          
          {/* Recent Activity */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Activity className="text-blue-500" size={20} />
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Recent Activity</h2>
            </div>
            <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <p style={{ margin: 0, fontSize: '14px' }}>Data will appear after client management is enabled.</p>
            </div>
          </div>

          {/* Client Health */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <HeartPulse className="text-rose-500" size={20} />
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Client Health</h2>
            </div>
            <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <p style={{ margin: 0, fontSize: '14px' }}>Health metrics require active client connections.</p>
            </div>
          </div>

          {/* System Status */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Server className="text-indigo-500" size={20} />
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>System Status</h2>
            </div>
            <div style={{ padding: '16px', color: '#334155', background: '#f8fafc', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px' }}>Management API</span>
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
