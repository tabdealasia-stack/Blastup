const fs = require('fs');
const path = require('path');

const tabdealRoutes = [
  '',
  'clients',
  'categories',
  'template-packs',
  'templates',
  'client-templates',
  'whatsapp',
  'api-keys',
  'notifications',
  'message-logs',
  'integrations',
  'settings'
];

const dashboardRoutes = [
  '',
  'whatsapp',
  'templates',
  'integrations',
  'notifications',
  'message-logs',
  'settings'
];

function createPage(baseDir, route, group) {
  const dir = path.join(baseDir, route);
  fs.mkdirSync(dir, { recursive: true });
  const title = route === '' ? 'Dashboard' : route.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  
  const content = `import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/States';

export default function ${title.replace(/\s+/g, '')}Page() {
  return (
    <div>
      <PageHeader title="${title}" description="Manage ${title.toLowerCase()}" />
      <EmptyState 
        title="Module coming in Phase 9A-10B" 
        description="This functionality has not yet been implemented." 
      />
    </div>
  );
}
`;
  fs.writeFileSync(path.join(dir, 'page.tsx'), content);
}

// Generate layouts
const layoutContent = `import { AppLayout } from '@/components/layout/AppLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
`;
fs.writeFileSync('client/src/app/(tabdeal)/layout.tsx', layoutContent);
fs.writeFileSync('client/src/app/(dashboard)/layout.tsx', layoutContent);

// Generate pages
tabdealRoutes.forEach(r => createPage('client/src/app/(tabdeal)/tabdeal', r, 'tabdeal'));
dashboardRoutes.forEach(r => createPage('client/src/app/(dashboard)/dashboard', r, 'dashboard'));

console.log("Pages generated");
