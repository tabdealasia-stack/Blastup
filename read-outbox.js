const fs = require('fs');
const content = fs.readFileSync('server/src/services/outbox.worker.ts', 'utf8');
console.log(content.substring(0, 1500) + '\n...[TRUNCATED]');
