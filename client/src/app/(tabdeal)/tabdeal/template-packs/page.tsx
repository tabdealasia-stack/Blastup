import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/States';

export default function TemplatePacksPage() {
  return (
    <div>
      <PageHeader title="Template Packs" description="Manage template packs" />
      <EmptyState 
        title="Module coming in Phase 9A-10B" 
        description="This functionality has not yet been implemented." 
      />
    </div>
  );
}
