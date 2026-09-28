'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/providers/AuthProvider';
import { Building2, Shield, Info } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto space-y-6 pb-12">
      <PageHeader 
        title="Account Settings" 
        description="View your tenant account identity and administrative access details."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-0 overflow-hidden shadow-sm border border-gray-200">
          <div className="p-6 bg-white">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
              <Building2 className="w-5 h-5 text-gray-400" /> Organization Profile
            </h3>
            
            <dl className="space-y-6">
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Account Identity</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {user?.username || 'Unknown'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">System Role</dt>
                <dd className="text-sm font-medium text-gray-900 capitalize">
                  {user?.role || 'Client'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Account Status</dt>
                <dd className="mt-1">
                  <Badge variant="success">Active</Badge>
                </dd>
              </div>
            </dl>
          </div>
        </Card>

        <Card className="p-0 overflow-hidden shadow-sm border border-gray-200">
          <div className="p-6 bg-white h-full flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
              <Shield className="w-5 h-5 text-gray-400" /> Administrative Governance
            </h3>
            
            <div className="flex-1 flex flex-col justify-center">
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                Your organizational profile (Business Name, Webhooks, Feature Flags, Default Templates, and Identity Slugs) is strictly managed by Blastup administrators to ensure systemic data integrity across API integrations.
              </p>
              
              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-lg flex gap-3 mt-auto">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <strong className="font-semibold block mb-1">Update Requests</strong>
                  <p className="text-blue-800/80 leading-relaxed">
                    Contact your account manager to request changes to your core profile, business name, or timezone settings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
