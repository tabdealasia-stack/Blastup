const mongoose = require('mongoose');
const { execSync } = require('child_process');

async function run() {
  const pm2Status = execSync('pm2 jlist').toString();
  const processes = JSON.parse(pm2Status);
  const waServer = processes.find(p => p.name === 'wa-server');
  console.log("wa-server status:", waServer.pm2_env.status);
  console.log("OUTBOX_WORKER_ENABLED in PM2 env:", waServer.pm2_env.env.OUTBOX_WORKER_ENABLED);
  process.exit(0);
}
run();
