'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FolderTree, Package, FileText, Users } from 'lucide-react';

export function CatalogueNav() {
  const pathname = usePathname();

  const tabs = [
    { name: 'Categories', href: '/tabdeal/categories', icon: FolderTree },
    { name: 'Template Packs', href: '/tabdeal/template-packs', icon: Package },
    { name: 'Master Templates', href: '/tabdeal/templates', icon: FileText },
    { name: 'Client Templates', href: '/tabdeal/client-templates', icon: Users },
  ];

  return (
    <div className="mb-6 border-b border-gray-200">
      <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
          const Icon = tab.icon;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`
                whitespace-nowrap flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${isActive 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <Icon className={`w-4 h-4 mr-2 ${isActive ? 'text-indigo-500' : 'text-gray-400'}`} />
              {tab.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
