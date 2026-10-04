const fs = require('fs');
const content = fs.readFileSync('server/src/config/env.ts', 'utf8');
console.log(content.substring(0, 1500));
