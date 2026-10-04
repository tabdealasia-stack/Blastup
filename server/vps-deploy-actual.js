const { execSync } = require('child_process');

try {
  console.log("Connecting to VPS...");
  const result = execSync('ssh root@82.112.238.16 "cd /opt/tabdeal/Blastup && git fetch origin main && git reset --hard origin/main && cd server && npm install && npm run build && pm2 reload wa-server --update-env"', { encoding: 'utf8' });
  console.log("Deployment output:");
  console.log(result);
} catch(e) {
  console.error("Error", e);
}
