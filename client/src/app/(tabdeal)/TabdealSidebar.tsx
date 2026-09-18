'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Folder, Layers, FileText, Wifi,
  Link as LinkIcon, Key, MessageSquare, Activity, Settings, LogOut, X
} from 'lucide-react';
import { logout } from '@/lib/auth';

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function TabdealSidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`} style={{ borderRight: '2px solid #6366F1' }}>
      <div className="sidebar-header">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Image
            src="/logo.svg"
            alt="Blastup Logo"
            width={110}
            height={32}
            style={{ objectFit: 'contain' }}
            priority
          />
          <span style={{ fontSize: 10, fontWeight: 700, color: '#6366F1', letterSpacing: 1, marginTop: 4 }}>TABDEAL MANAGEMENT</span>
        </div>
        {onClose && (
          <button
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close Sidebar"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div className="sidebar-section">
          <span className="sidebar-section-title">OVERVIEW</span>
          <Link
            href="/tabdeal"
            className={`sidebar-item ${pathname === '/tabdeal' ? 'active' : ''}`}
          >
            <LayoutDashboard />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/tabdeal/clients"
            className={`sidebar-item ${pathname.startsWith('/tabdeal/clients') ? 'active' : ''}`}
          >
            <Users />
            <span>Clients</span>
          </Link>
        </div>

        <div className="sidebar-section">
          <span className="sidebar-section-title">TEMPLATES</span>
          <Link
            href="/tabdeal/categories"
            className={`sidebar-item ${pathname.startsWith('/tabdeal/categories') ? 'active' : ''}`}
          >
            <Folder />
            <span>Categories</span>
          </Link>
          <Link
            href="/tabdeal/template-packs"
            className={`sidebar-item ${pathname.startsWith('/tabdeal/template-packs') ? 'active' : ''}`}
          >
            <Layers />
            <span>Template Packs</span>
          </Link>
          <Link
            href="/tabdeal/templates"
            className={`sidebar-item ${pathname.startsWith('/tabdeal/templates') ? 'active' : ''}`}
          >
            <FileText />
            <span>Master Templates</span>
          </Link>
        </div>

        <div className="sidebar-section">
          <span className="sidebar-section-title">INFRASTRUCTURE</span>
          <Link
            href="/tabdeal/whatsapp"
            className={`sidebar-item ${pathname.startsWith('/tabdeal/whatsapp') ? 'active' : ''}`}
          >
            <Wifi />
            <span>WhatsApp Connections</span>
          </Link>
          <Link
            href="/tabdeal/integrations"
            className={`sidebar-item ${pathname.startsWith('/tabdeal/integrations') ? 'active' : ''}`}
          >
            <LinkIcon />
            <span>Integrations</span>
          </Link>
          <Link
            href="/tabdeal/api-keys"
            className={`sidebar-item ${pathname.startsWith('/tabdeal/api-keys') ? 'active' : ''}`}
          >
            <Key />
            <span>API Keys</span>
          </Link>
        </div>

        <div className="sidebar-section">
          <span className="sidebar-section-title">OBSERVABILITY</span>
          <Link
            href="/tabdeal/event-logs"
            className={`sidebar-item ${pathname.startsWith('/tabdeal/event-logs') ? 'active' : ''}`}
          >
            <Activity />
            <span>Event Logs</span>
          </Link>
          <Link
            href="/tabdeal/message-logs"
            className={`sidebar-item ${pathname.startsWith('/tabdeal/message-logs') ? 'active' : ''}`}
          >
            <MessageSquare />
            <span>Message Logs</span>
          </Link>
        </div>
        
        <div className="sidebar-section">
          <span className="sidebar-section-title">SYSTEM</span>
          <Link
            href="/tabdeal/settings"
            className={`sidebar-item ${pathname.startsWith('/tabdeal/settings') ? 'active' : ''}`}
          >
            <Settings />
            <span>Settings</span>
          </Link>
        </div>
      </div>

      <div className="sidebar-footer">
        <Link
          href="/dashboard"
          className="sidebar-item"
          style={{ width: '100%', marginBottom: 8 }}
        >
          <LayoutDashboard />
          <span>Exit to Client View</span>
        </Link>
        <button
          className="sidebar-item"
          style={{ width: '100%', cursor: 'pointer', border: 'none', background: 'none' }}
          onClick={() => logout()}
        >
          <LogOut />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
