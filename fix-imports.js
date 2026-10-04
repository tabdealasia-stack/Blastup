const fs = require('fs');

let api = fs.readFileSync('client/src/lib/api.ts', 'utf8');
api = api.replace('export { ApiError };', 'export { ApiError, request };');
fs.writeFileSync('client/src/lib/api.ts', api);

let ds = fs.readFileSync('client/src/components/layout/DashboardShell.tsx', 'utf8');
ds = ds.replace("import Sidebar from '@/components/layout/Sidebar';", "import { Sidebar } from '@/components/layout/Sidebar';");
fs.writeFileSync('client/src/components/layout/DashboardShell.tsx', ds);
