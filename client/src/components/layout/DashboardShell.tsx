'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';

// Context so Header can trigger the mobile sidebar toggle
interface MobileNavContextType {
  toggleMobileSidebar: () => void;
}

const MobileNavContext = createContext<MobileNavContextType>({
  toggleMobileSidebar: () => {},
});

export function useMobileNav() {
  return useContext(MobileNavContext);
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <MobileNavContext.Provider value={{ toggleMobileSidebar: () => setMobileOpen((p) => !p) }}>
      <div className={`app-layout ${mobileOpen ? 'sidebar-open' : ''}`}>
        <Sidebar isMobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        <main className="main-wrapper">
          {children}
        </main>
      </div>
    </MobileNavContext.Provider>
  );
}
