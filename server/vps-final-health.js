const mongoose = require('mongoose');
const Redis = require('ioredis');
require('dotenv').config({ path: '/opt/tabdeal/Blastup/.env' });

async function check() {
  let healthy = true;
  try {
      await mongoose.connect(process.env.MONGODB_URI);
      const db = mongoose.connection.db;
      const account = await db.collection('whatsapp_accounts').findOne({ clientId: mongoose.Types.ObjectId.createFromHexString("6aaffa5454372935ed58b083") });
      console.log(`WhatsApp Status = ${account.status}`);
      console.log("MongoDB = HEALTHY");
  } catch (e) {
      console.log("MongoDB = FAILED");
      healthy = false;
  }
  
  try {
      const redis = new Redis(process.env.REDIS_URI);
      await redis.ping();
      console.log("Redis = HEALTHY");
  } catch (e) {
      console.log("Redis = FAILED");
      healthy = false;
  }
  
  const { execSync } = require('child_process');
  const pm2Status = execSync('pm2 jlist').toString();
  const processes = JSON.parse(pm2Status);
  console.log("=== PM2 STATUS ===");
  console.log(processes.map(p => ({
    name: p.name, 
    status: p.pm2_env.status,
    instances: p.pm2_env.instances,
    outbox: p.pm2_env.env.OUTBOX_WORKER_ENABLED
  })));
  
  process.exit(healthy ? 0 : 1);
}
check();
