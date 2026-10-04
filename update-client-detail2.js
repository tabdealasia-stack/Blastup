const fs = require('fs');
let file = fs.readFileSync('client/src/app/(tabdeal)/tabdeal/clients/[id]/page.tsx', 'utf8');

file = file.replace(
  /\{\/\* D\. WhatsApp Summary \*\/\}\s*<Card className="p-6">[\s\S]*?<\/Card>/g,
  "<ClientWhatsAppSection clientId={id} initialWhatsapp={client.whatsapp} />"
);

fs.writeFileSync('client/src/app/(tabdeal)/tabdeal/clients/[id]/page.tsx', file, 'utf8');
