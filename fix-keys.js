const fs = require('fs');
let file = fs.readFileSync('client/src/app/(dashboard)/dashboard/integration/keys/page.tsx', 'utf8');

file = file.replace(
  "import { api } from '@/lib/api';",
  "import { keysApi } from '@/lib/api';"
);

file = file.replace(/api\.keys\./g, "keysApi.");

fs.writeFileSync('client/src/app/(dashboard)/dashboard/integration/keys/page.tsx', file, 'utf8');
