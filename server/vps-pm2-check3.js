const { execSync } = require('child_process');
const pm2Status = execSync('pm2 jlist').toString();
const processes = JSON.parse(pm2Status);
console.log("=== PM2 STATUS ===");
console.log(processes.map(p => ({
  name: p.name, 
  status: p.pm2_env.status,
  outbox: p.pm2_env.env.OUTBOX_WORKER_ENABLED,
  instances: p.pm2_env.instances
})));
