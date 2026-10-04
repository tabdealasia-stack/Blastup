const fs = require('fs');
const lines = fs.readFileSync('src/services/outbox.worker.ts', 'utf8').split('\n');
console.log(lines.slice(0, 15).join('\n'));
