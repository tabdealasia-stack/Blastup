const fs = require('fs');
let file = fs.readFileSync('client/src/app/(tabdeal)/tabdeal/clients/[id]/ClientWhatsAppSection.tsx', 'utf8');

// replace external api with qrcode.react
file = file.replace(
  "import { tabdealApi, ApiError } from '@/lib/api';",
  "import { tabdealApi, ApiError } from '@/lib/api';\nimport { QRCodeSVG } from 'qrcode.react';"
);

file = file.replace(
  /<img[\s\S]*?className="w-48 h-48 border bg-white"[\s\S]*?\/>/g,
  "<QRCodeSVG value={qrData.data.qr} size={200} className=\"bg-white p-2 border rounded-md\" />"
);

fs.writeFileSync('client/src/app/(tabdeal)/tabdeal/clients/[id]/ClientWhatsAppSection.tsx', file, 'utf8');
