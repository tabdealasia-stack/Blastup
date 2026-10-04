const fs = require('fs');
let file = fs.readFileSync('client/src/app/(dashboard)/dashboard/settings/page.tsx', 'utf8');

file = file.replace(
  "import { useAuth } from '@/components/providers/AuthProvider';",
  "import { useAuth } from '@/providers/AuthProvider';"
);

fs.writeFileSync('client/src/app/(dashboard)/dashboard/settings/page.tsx', file, 'utf8');
