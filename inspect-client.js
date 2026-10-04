const fs = require('fs');
const content = fs.readFileSync('server/src/services/client.service.ts', 'utf8');
console.log(content.substring(3500, 6000));
