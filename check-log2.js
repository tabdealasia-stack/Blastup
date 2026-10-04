const fs = require('fs');
const lines = fs.readFileSync('server/src/services/notification-event.service.ts', 'utf8').split('\n');
const loggerLines = lines.filter(l => l.includes('logger.'));
console.log('logger lines in notification-event.service.ts:', loggerLines.length);
