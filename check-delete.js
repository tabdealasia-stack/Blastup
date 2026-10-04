const fs = require('fs');
const content = fs.readFileSync('server/src/routes/tabdeal.routes.ts', 'utf8');
if (content.includes('deleteClient')) {
  console.log('Delete client endpoint exists.');
} else {
  console.log('Delete client endpoint DOES NOT exist.');
}
