const fs = require('fs');
let content = fs.readFileSync('seed-clinic-dot-templates.ts', 'utf8');
content = content.replace('dotenv.config();', 'dotenv.config({ path: \'../.env\' });');
fs.writeFileSync('seed-clinic-dot-templates.ts', content);
