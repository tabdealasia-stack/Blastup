'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { tabdealApi, ApiError } from '@/lib/api';
import toast from 'react-hot-toast';

export default function CreateClientPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    businessName: '',
    categoryId: '',
    email: '',
    whatsappNumber: '',
  });

  const { data: categoriesData, isLoading: loadingCategories } = useSWR(
    '/api/tabdeal/categories',
    tabdealApi.getCategories
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.businessName.trim() || !formData.categoryId) {
      setFormError('Business name and category are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await tabdealApi.createClient({
        ...formData,
        email: formData.email || undefined,
        whatsappNumber: formData.whatsappNumber || undefined,
      });

      toast.success('Client created successfully');
      router.push(`/tabdeal/clients/${res.data._id}`);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setFormError(err.message || 'Failed to create client');
      } else {
        setFormError('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = categoriesData?.data?.filter((c: any) => c.active) || [];

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader 
        title="Create Client" 
        description="Provision a new client workspace and automatically assign notification templates." 
      />

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {formError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {formError}
            </div>
          )}

          <Input
            label="Business Name *"
            placeholder="e.g. Divine Tours"
            value={formData.businessName}
            onChange={(e) => setFormData(f => ({ ...f, businessName: e.target.value }))}
            required
            maxLength={150}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category (Determines Master Templates) *
            </label>
            <select
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={formData.categoryId}
              onChange={(e) => setFormData(f => ({ ...f, categoryId: e.target.value }))}
              required
              disabled={loadingCategories}
            >
              <option value="">Select a category...</option>
              {categories.map((c: any) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.defaultTemplatePackId ? '' : '(No default pack)'}
                </option>
              ))}
            </select>
            {loadingCategories && <p className="text-xs text-gray-500 mt-1">Loading categories...</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Email (Optional)"
              type="email"
              placeholder="contact@business.com"
              value={formData.email}
              onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
            />
            
            <Input
              label="WhatsApp Number (Optional)"
              placeholder="e.g. 919876543210"
              value={formData.whatsappNumber}
              onChange={(e) => setFormData(f => ({ ...f, whatsappNumber: e.target.value }))}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/tabdeal/clients')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={!formData.businessName || !formData.categoryId || isSubmitting}
            >
              Create Client & Provision Templates
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
