'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import TabdealSidebar from './TabdealSidebar';

interface MobileNavContextType {
  toggleMobileSidebar: () => void;
}

const MobileNavContext = createContext<MobileNavContextType>({
  toggleMobileSidebar: () => {},
});

export function useMobileNav() {
  return useContext(MobileNavContext);
}

export default function TabdealShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <MobileNavContext.Provider value={{ toggleMobileSidebar: () => setMobileOpen((p) => !p) }}>
      <div className={`app-layout ${mobileOpen ? 'sidebar-open' : ''}`}>
        {mobileOpen && (
          <div
            className="sidebar-backdrop"
            onClick={() => setMobileOpen(false)}
            aria-label="Close Mobile Sidebar"
          />
        )}
        <TabdealSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <main className="main-wrapper">
          {children}
        </main>
      </div>
    </MobileNavContext.Provider>
  );
}
