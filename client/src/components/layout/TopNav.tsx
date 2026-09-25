'use client';

import { Menu, Bell } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function TopNav({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const paths = pathname?.split('/').filter(Boolean) || [];

  return (
    <header className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-100 lg:px-8 shadow-sm">
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="p-2 mr-4 text-gray-500 rounded-lg lg:hidden hover:text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm font-medium text-gray-400">
            {paths.map((path, index) => {
              // Hide UUIDs from breadcrumbs if they look like objectIds
              if (path.length === 24 && /^[0-9a-f]+$/i.test(path)) {
                return (
                  <li key={path} className="flex items-center">
                    <span className="mx-2 text-gray-300">/</span>
                    <span className="text-gray-900">Details</span>
                  </li>
                );
              }
              return (
                <li key={path} className="flex items-center">
                  {index > 0 && <span className="mx-2 text-gray-300">/</span>}
                  <span className={index === paths.length - 1 ? 'text-gray-900 capitalize font-semibold' : 'capitalize hover:text-gray-600'}>
                    {path.replace(/-/g, ' ')}
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Placeholder for future global notifications if needed */}
        <button className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-50 transition-colors">
          <Bell className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
