const fs = require('fs');
let file = fs.readFileSync('client/src/app/(tabdeal)/tabdeal/clients/[id]/page.tsx', 'utf8');

file = file.replace(
  "import { tabdealApi } from '@/lib/api';",
  "import { tabdealApi } from '@/lib/api';\nimport { ClientWhatsAppSection } from './ClientWhatsAppSection';"
);

file = file.replace(
  /<\!-- D\. WhatsApp Summary -->[\s\S]*?<\/Card>/,
  "<ClientWhatsAppSection clientId={id} initialWhatsapp={client.whatsapp} />"
);

fs.writeFileSync('client/src/app/(tabdeal)/tabdeal/clients/[id]/page.tsx', file, 'utf8');
