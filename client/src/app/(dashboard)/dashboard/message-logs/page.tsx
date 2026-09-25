'use client';

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
