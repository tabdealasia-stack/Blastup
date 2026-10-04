const fs = require('fs');
console.log(fs.readFileSync('server/src/config/redis.ts', 'utf8').substring(0, 500));
