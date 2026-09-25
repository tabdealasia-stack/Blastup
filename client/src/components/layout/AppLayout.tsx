'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { useAuth } from '@/providers/AuthProvider';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setMobileOpen] = useState(false);
  const { loading, user } = useAuth();

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isMobileOpen={isMobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopNav setMobileOpen={setMobileOpen} />
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 py-8 mx-auto max-w-7xl lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
