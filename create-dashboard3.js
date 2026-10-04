const fs = require('fs');

// 6. Notifications
fs.writeFileSync('client/src/app/(dashboard)/dashboard/notifications/page.tsx', `'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { AlertTriangle } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div>
      <PageHeader 
        title="Event Notifications" 
        description="View notification events received by the Blastup API."
      />
      <Card className="p-12 text-center border-dashed border-2 bg-gray-50">
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Feature Not Yet Available</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          The client-scoped Event Log retrieval API is not currently available in this deployment phase. Contact administration if you require historical event exports.
        </p>
      </Card>
    </div>
  );
}
`, 'utf8');

// 7. Message Logs
fs.writeFileSync('client/src/app/(dashboard)/dashboard/message-logs/page.tsx', `'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { AlertTriangle } from 'lucide-react';

export default function MessageLogsPage() {
  return (
    <div>
      <PageHeader 
        title="WhatsApp Message Logs" 
        description="View dispatch history and delivery statuses of WhatsApp messages."
      />
      <Card className="p-12 text-center border-dashed border-2 bg-gray-50">
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Feature Not Yet Available</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          The client-scoped Message Log retrieval API is not currently available in this deployment phase. Contact administration if you require WhatsApp delivery reports.
        </p>
      </Card>
    </div>
  );
}
`, 'utf8');

// 8. Settings
fs.writeFileSync('client/src/app/(dashboard)/dashboard/settings/page.tsx', `'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/components/providers/AuthProvider';
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
                <span className={\`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium \${user?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}\`}>
                  {user?.isActive ? 'Active' : 'Suspended'}
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
`, 'utf8');

