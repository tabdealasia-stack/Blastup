const { execSync } = require('child_process');

try {
  console.log("Checking VPS status...");
  const cmd = `
    echo "--- GIT ---";
    cd /opt/tabdeal/Blastup && git log -1 --oneline;
    echo "--- PM2 ---";
    pm2 jlist | grep -E "name|status|restart_time";
    echo "--- HEALTH ---";
    curl -s http://localhost:8080/api/health;
  `;
  const result = execSync(`ssh root@82.112.238.16 '${cmd}'`, { encoding: 'utf8' });
  console.log(result);
} catch(e) {
  console.error("Error", e.message);
  if (e.stdout) console.log("STDOUT", e.stdout.toString());
  if (e.stderr) console.log("STDERR", e.stderr.toString());
}
