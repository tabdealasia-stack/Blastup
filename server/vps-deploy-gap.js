const { execSync } = require('child_process');

try {
  console.log("Pulling origin...");
  execSync('cd /opt/tabdeal/Blastup && git fetch origin main && git reset --hard origin/main', { stdio: 'inherit' });
  console.log("Installing...");
  execSync('cd /opt/tabdeal/Blastup/server && npm install', { stdio: 'inherit' });
  console.log("Building...");
  execSync('cd /opt/tabdeal/Blastup/server && npm run build', { stdio: 'inherit' });
  console.log("Reloading wa-server...");
  execSync('pm2 reload wa-server --update-env', { stdio: 'inherit' });
  
  const status = execSync('pm2 jlist').toString();
  const processes = JSON.parse(status);
  console.log("=== PM2 STATUS ===");
  console.log(processes.map(p => ({name: p.name, status: p.pm2_env.status, restart_time: p.pm2_env.restart_time})));

} catch(e) {
  console.error("Error", e);
}
