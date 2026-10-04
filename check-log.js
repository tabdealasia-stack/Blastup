const fs = require('fs');
const lines = fs.readFileSync('server/src/services/outbox.worker.ts', 'utf8').split('\n');
const loggerLines = lines.filter(l => l.includes('logger.'));
console.log(loggerLines.join('\n'));
