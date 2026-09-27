'use client';

import useSWR from 'swr';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ErrorState, EmptyState } from '@/components/ui/States';
import { Lock } from 'lucide-react';
import { tabdealApi } from '@/lib/api';
import { CatalogueNav } from '@/components/tabdeal/CatalogueNav';

export default function CategoriesPage() {
  const { data, error, isLoading } = useSWR(
    '/api/tabdeal/categories',
    tabdealApi.getCategories
  );

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-6 pb-12">
      <PageHeader 
        title="Master Catalogue" 
        description="Master business categories used to organize notification templates and client onboarding."
        action={
          <div className="flex items-center text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
            <Lock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
            READ ONLY
          </div>
        }
      />

      <CatalogueNav />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-center">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Categories</div>
          <div className="mt-1 text-3xl font-bold text-gray-900">
            {isLoading ? <span className="animate-pulse text-gray-300">...</span> : (data?.data?.length || 0)}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-50 rounded-lg"></div>
              ))}
            </div>
          </div>
        ) : error ? (
          <ErrorState title="Failed to load categories" description="There was an error communicating with the server." />
        ) : !data?.data || data.data.length === 0 ? (
          <EmptyState title="No categories found" description="No master categories have been established." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category / Slug</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Packs</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Clients</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {data.data.map((category: any) => (
                  <tr key={category._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{category.name}</div>
                      <div className="text-xs font-mono text-gray-500 mt-0.5">{category.slug}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={category.active ? 'success' : 'gray'}>
                        {category.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                        {category.packCount || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {category.clientCount || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {new Date(category.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
