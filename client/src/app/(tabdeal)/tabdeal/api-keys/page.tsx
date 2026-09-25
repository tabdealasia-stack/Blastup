import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/States';

export default function ApiKeysPage() {
  return (
    <div>
      <PageHeader title="Api Keys" description="Manage api keys" />
      <EmptyState 
        title="Module coming in Phase 9A-10B" 
        description="This functionality has not yet been implemented." 
      />
    </div>
  );
}
