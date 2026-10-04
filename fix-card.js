const fs = require('fs');
let file = fs.readFileSync('client/src/app/(tabdeal)/tabdeal/clients/[id]/page.tsx', 'utf8');
file = file.replace(/<Card className="h-64 bg-gray-50 animate-pulse"><\/Card>/g, '<Card className="h-64 bg-gray-50 animate-pulse"><div/></Card>');
fs.writeFileSync('client/src/app/(tabdeal)/tabdeal/clients/[id]/page.tsx', file, 'utf8');
