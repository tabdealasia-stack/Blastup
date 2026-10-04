const fs = require('fs');
let file = fs.readFileSync('client/src/app/(tabdeal)/tabdeal/clients/[id]/ClientWhatsAppSection.tsx', 'utf8');

file = file.replace(
  "fallbackData: initialWhatsapp ? { data: { status: initialWhatsapp.status } } : null",
  "fallbackData: initialWhatsapp ? { success: true, data: { status: initialWhatsapp.status } } : undefined"
);

fs.writeFileSync('client/src/app/(tabdeal)/tabdeal/clients/[id]/ClientWhatsAppSection.tsx', file, 'utf8');
