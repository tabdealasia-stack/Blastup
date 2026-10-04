const fs = require('fs');
const content = fs.readFileSync('server/src/routes/tabdeal.routes.ts', 'utf8');
const lines = content.split('\n').filter(line => line.includes('router.') && line.includes('client'));
console.log(lines.join('\n'));
