const fs = require('fs');
const files = [
  'server/src/middleware/auth.ts',
  'server/src/controllers/telemetry.controller.ts',
  'server/src/controllers/apikey.controller.ts',
  'server/src/controllers/notification-event.controller.ts'
];

for (const f of files) {
  console.log(`\n\n--- ${f} ---`);
  if (fs.existsSync(f)) {
    console.log(fs.readFileSync(f, 'utf8').substring(0, 1500) + '\n...[TRUNCATED]');
  } else {
    console.log('FILE NOT FOUND');
  }
}
