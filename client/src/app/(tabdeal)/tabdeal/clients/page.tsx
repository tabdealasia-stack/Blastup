import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/States';

export default function ClientsPage() {
  return (
    <div>
      <PageHeader title="Clients" description="Manage clients" />
      <EmptyState 
        title="Module coming in Phase 9A-10B" 
        description="This functionality has not yet been implemented." 
      />
    </div>
  );
}
