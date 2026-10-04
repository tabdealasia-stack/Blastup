const fs = require('fs');
if(fs.existsSync('server/src/services/client.service.ts')){
  const content = fs.readFileSync('server/src/services/client.service.ts', 'utf8');
  console.log('client.service.ts length:', content.length);
}
