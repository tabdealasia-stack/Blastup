'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { superadminNavigation, clientNavigation } from './navigation';
import { useAuth } from '@/providers/AuthProvider';
import { LogOut } from 'lucide-react';

export function Sidebar({ isMobileOpen, setMobileOpen }: { isMobileOpen: boolean; setMobileOpen: (o: boolean) => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navigation = user?.role === 'superadmin' ? superadminNavigation : clientNavigation;

  return (
    <>
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/80 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className={clsx(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:flex lg:flex-col",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <Link href={user?.role === 'superadmin' ? '/tabdeal' : '/dashboard'} className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">Blastup</span>
            {user?.role === 'superadmin' && <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md">Admin</span>}
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {navigation.map((item) => (
            <div key={item.name}>
              {item.children ? (
                <div className="mb-2 mt-4">
                  <div className="px-3 mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                    {item.name}
                  </div>
                  <div className="space-y-1">
                    {item.children.map((child) => {
                      const isActive = pathname === child.href;
                      return (
                        <Link
                          key={child.name}
                          href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className={clsx(
                            "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                            isActive
                              ? "bg-blue-50 text-blue-700"
                              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          )}
                        >
                          <child.icon className={clsx(
                            "mr-3 h-5 w-5 flex-shrink-0",
                            isActive ? "text-blue-700" : "text-gray-400 group-hover:text-gray-500"
                          )} />
                          {child.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <Link
                  href={item.href || '#'}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md mt-1",
                    pathname === item.href
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <item.icon className={clsx(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    pathname === item.href ? "text-blue-700" : "text-gray-400 group-hover:text-gray-500"
                  )} />
                  {item.name}
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center mb-4 px-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.username}</p>
              <p className="text-xs text-gray-500 truncate capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
