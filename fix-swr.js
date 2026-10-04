const fs = require('fs');
let swr = fs.readFileSync('client/src/providers/SWRProvider.tsx', 'utf8');
swr = swr.replace('request(url).then(res => res.data)', 'request<{data: any}>(url).then(res => res.data)');
fs.writeFileSync('client/src/providers/SWRProvider.tsx', swr);
