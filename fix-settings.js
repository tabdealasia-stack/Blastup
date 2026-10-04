const fs = require('fs');
let file = fs.readFileSync('client/src/app/(dashboard)/dashboard/settings/page.tsx', 'utf8');

file = file.replace(
  "user?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'",
  "'bg-green-100 text-green-800'"
);

file = file.replace(
  "user?.isActive ? 'Active' : 'Suspended'",
  "'Active'"
);

fs.writeFileSync('client/src/app/(dashboard)/dashboard/settings/page.tsx', file, 'utf8');
