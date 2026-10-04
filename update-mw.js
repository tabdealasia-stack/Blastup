const fs = require('fs');
let mw = fs.readFileSync('client/src/middleware.ts', 'utf8');
if (!mw.includes("'/tabdeal'")) {
  mw = mw.replace("'/dashboard',", "'/dashboard',\n  '/tabdeal',");
  fs.writeFileSync('client/src/middleware.ts', mw);
}
