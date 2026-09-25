'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopNav } from '@/components/layout/TopNav';

interface MobileNavContextType {
  toggleMobileSidebar: () => void;
}

const MobileNavContext = createContext<MobileNavContextType>({
  toggleMobileSidebar: () => {},
});

export function useMobileNav() {
  return useContext(MobileNavContext);
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <MobileNavContext.Provider value={{ toggleMobileSidebar: () => setMobileOpen((p) => !p) }}>
      <div className="flex h-screen bg-gray-50/50 text-gray-900 font-sans">
        <Sidebar isMobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopNav onMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </MobileNavContext.Provider>
  );
}
