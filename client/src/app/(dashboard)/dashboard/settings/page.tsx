'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/providers/AuthProvider';
import { Building2, User, Key, Globe } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader 
        title="Client Settings" 
        description="View your tenant account details and configuration."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gray-500" /> Account Profile
          </h3>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Account Identity</dt>
              <dd className="mt-1 text-sm text-gray-900 font-medium">
                {user?.username || 'Unknown'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">System Role</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">
                {user?.role || 'Client'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Account Status</dt>
              <dd className="mt-1 text-sm">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${'bg-green-100 text-green-800'}`}>
                  {'Active'}
                </span>
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
            <Globe className="w-5 h-5 text-gray-500" /> Administrative Access
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Your client profile (Business Name, Category, Default Templates, and Identity Slugs) is strictly managed by TABDEAL Administration to ensure data integrity across your integrations.
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <p className="text-sm text-blue-700">
              Please contact your TABDEAL account manager to request changes to your core profile, business name, or timezone settings.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
