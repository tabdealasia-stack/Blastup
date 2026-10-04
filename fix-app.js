const fs = require('fs');
let appTs = fs.readFileSync('server/src/app.ts', 'utf8');

const lines = appTs.split('\n');
const newLines = [];
let seenClientTemplate = false;

for (const line of lines) {
  if (line.includes("import clientTemplateRoutes from './routes/client-template.routes';")) {
    if (!seenClientTemplate) {
      newLines.push(line);
      seenClientTemplate = true;
    }
  } else {
    newLines.push(line);
  }
}

fs.writeFileSync('server/src/app.ts', newLines.join('\n'), 'utf8');
