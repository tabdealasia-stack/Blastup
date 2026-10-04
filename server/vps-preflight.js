const mongoose = require('mongoose');
const { execSync } = require('child_process');

async function checkPre() {
  const pm2Status = execSync('pm2 jlist').toString();
  const processes = JSON.parse(pm2Status);
  console.log("=== PM2 STATUS ===");
  console.log(processes.map(p => ({name: p.name, status: p.pm2_env.status})));

  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const eventLogsCounts = await db.collection('notification_event_logs').aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]).toArray();
  const msgLogsCounts = await db.collection('message_logs').aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]).toArray();
  
  const clients = await db.collection('clients').countDocuments();
  const templates = await db.collection('client_templates').countDocuments();
  const apiKeys = await db.collection('api_keys').countDocuments();
  const waAccounts = await db.collection('whatsapp_accounts').countDocuments();
  const waInstances = await db.collection('whatsapp_instances').countDocuments();

  const redisSismember = execSync('docker exec tabdeal-redis redis-cli SISMEMBER sm:6aacb5fa069dffca7ac76126:seenJids 918698884383@s.whatsapp.net').toString().trim();
  const redisScard = execSync('docker exec tabdeal-redis redis-cli SCARD sm:6aacb5fa069dffca7ac76126:seenJids').toString().trim();

  console.log("=== PRE MONGODB ===");
  console.log("Clients:", clients);
  console.log("Templates:", templates);
  console.log("ApiKeys:", apiKeys);
  console.log("WaAccounts:", waAccounts);
  console.log("WaInstances:", waInstances);
  console.log("EventLogs:", eventLogsCounts);
  console.log("MessageLogs:", msgLogsCounts);
  console.log("SafeMode redis target 918698884383 membership:", redisSismember);
  console.log("SafeMode redis total seenJids:", redisScard);
  
  process.exit(0);
}
require('dotenv').config({ path: '/opt/tabdeal/Blastup/.env' });
checkPre();
