import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/States';

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="Manage settings" />
      <EmptyState 
        title="Module coming in Phase 9A-10B" 
        description="This functionality has not yet been implemented." 
      />
    </div>
  );
}
