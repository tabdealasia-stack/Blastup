'use client';

import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function TopNav({ setMobileOpen }: { setMobileOpen: (o: boolean) => void }) {
  const pathname = usePathname();
  const paths = pathname?.split('/').filter(Boolean) || [];

  return (
    <header className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 lg:px-8">
      <div className="flex items-center">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 mr-4 text-gray-500 rounded-md lg:hidden hover:text-gray-900 hover:bg-gray-100"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            {paths.map((path, index) => (
              <li key={path} className="flex items-center">
                {index > 0 && <span className="mx-2 text-gray-300">/</span>}
                <span className={index === paths.length - 1 ? 'font-medium text-gray-900 capitalize' : 'capitalize'}>
                  {path.replace(/-/g, ' ')}
                </span>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </header>
  );
}
