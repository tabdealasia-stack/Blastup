'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { tabdealApi } from '@/lib/api';
import { Plus, Search, Eye, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
 // We need to check if this exists or just write inline debounce

export default function ClientsListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  // Manual Debounce for search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset page when filters change
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoryId(e.target.value);
    setPage(1);
  };
  
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value);
    setPage(1);
  };

  const { data: categoriesData } = useSWR('/api/tabdeal/categories', tabdealApi.getCategories);
  const categories = categoriesData?.data || [];

  const { data, error, isLoading } = useSWR(
    `/api/tabdeal/clients?page=${page}&limit=${limit}${debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ''}${categoryId ? `&categoryId=${categoryId}` : ''}${status ? `&status=${status}` : ''}`,
    () => tabdealApi.getClients({ page, limit, search: debouncedSearch, categoryId, status })
  );

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <PageHeader 
        title="Clients" 
        description="Manage business tenants connected to the TABDEAL BLASTUP platform."
        action={
          <Link href="/tabdeal/clients/new">
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </Link>
        }
      />

      <Card>
        {/* Filters Toolbar */}
        <div className="p-4 border-b border-gray-200/60 bg-gray-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="w-full md:w-96 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by business name or slug..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
                value={categoryId}
                onChange={handleCategoryChange}
              >
                <option value="">All Categories</option>
                {categories.map((c: any) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <select
              className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
              value={status}
              onChange={handleStatusChange}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          {isLoading && !data ? (
            <div className="p-8">
              <LoadingState />
            </div>
          ) : error ? (
            <div className="p-8">
              <ErrorState title="Failed to load clients" />
            </div>
          ) : !data?.data || data.data.length === 0 ? (
            <div className="p-8">
              <EmptyState 
                
                title="No clients found" 
                description="Try adjusting your search or filters to find what you're looking for."
              />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Business</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">WhatsApp Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.data.map((client: any) => (
                  <tr key={client._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{client.businessName}</div>
                      <div className="text-xs font-mono text-gray-500 mt-0.5">{client.slug}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">{client.categoryId?.name || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={client.status === 'active' ? 'success' : client.status === 'suspended' ? 'danger' : 'gray'}>
                        {client.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${client.whatsappStatus === 'connected' ? 'bg-emerald-500' : client.whatsappStatus === 'pending' ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                        <span className="text-sm font-medium text-gray-700 capitalize">{client.whatsappStatus}</span>
                      </div>
                      {client.whatsappNumber && (
                        <div className="text-xs text-gray-500 mt-1 font-mono">{client.whatsappNumber}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(client.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/tabdeal/clients/${client._id}`} className="inline-flex items-center justify-center text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-colors">
                        <Eye className="w-4 h-4 mr-1.5" /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination */}
        {data?.pagination && data.pagination.pages > 1 && (
          <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-200/60 flex items-center justify-between rounded-b-xl">
            <p className="text-sm text-gray-700">
              Showing page <span className="font-semibold text-gray-900">{data.pagination.page}</span> of <span className="font-semibold text-gray-900">{data.pagination.pages}</span> ({data.pagination.total} total records)
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page <= 1 || isLoading} 
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page >= data.pagination.pages || isLoading} 
                onClick={() => setPage(p => p + 1)}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
