'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { superadminNavigation, clientNavigation } from './navigation';
import { useAuth } from '@/providers/AuthProvider';
import { LogOut, X } from 'lucide-react';
import Image from 'next/image';

export function Sidebar({ isMobileOpen, setMobileOpen }: { isMobileOpen: boolean; setMobileOpen: (o: boolean) => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isSuperadmin = pathname.startsWith('/tabdeal');
  const navigation = isSuperadmin ? superadminNavigation : clientNavigation;

  // Group the navigation items
  const groupedNav = navigation.reduce((acc, item) => {
    const groupName = item.group || 'GENERAL';
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(item);
    return acc;
  }, {} as Record<string, typeof navigation>);

  return (
    <>
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className={clsx(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex lg:flex-col shadow-sm",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100">
          <Link href={isSuperadmin ? '/tabdeal' : '/dashboard'} className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-gray-900">BLASTUP</span>
            <span className="text-[10px] font-bold text-indigo-600 tracking-widest uppercase mt-0.5">
              {isSuperadmin ? 'Tabdeal Management' : 'Operations Platform'}
            </span>
          </Link>
          {isMobileOpen && (
            <button onClick={() => setMobileOpen(false)} className="lg:hidden text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {Object.entries(groupedNav).map(([group, items]) => (
            <div key={group} className="space-y-1">
              <h3 className="px-3 text-xs font-bold tracking-wider text-gray-400 uppercase mb-2">
                {group}
              </h3>
              {items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/tabdeal' && item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href || '#'}
                    onClick={() => setMobileOpen(false)}
                    className={clsx(
                      "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150",
                      isActive
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon className={clsx(
                      "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                      isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-500"
                    )} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center px-3 mb-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.username}</p>
              <p className="text-xs font-medium text-gray-500 truncate capitalize">{user?.role}</p>
            </div>
          </div>
          {isSuperadmin ? (
             <Link
               href="/dashboard"
               className="flex items-center w-full px-3 py-2 mb-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
             >
               <LogOut className="mr-3 h-4 w-4 transform rotate-180" />
               Exit to Client Portal
             </Link>
          ) : (user?.role === 'superadmin' && (
             <Link
               href="/tabdeal"
               className="flex items-center w-full px-3 py-2 mb-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
             >
               <LogOut className="mr-3 h-4 w-4 transform rotate-180" />
               Enter Superadmin
             </Link>
          ))}
          <button
            onClick={() => logout()}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
