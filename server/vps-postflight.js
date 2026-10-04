const mongoose = require('mongoose');
const { execSync } = require('child_process');

async function checkPost() {
  const pm2Status = execSync('pm2 jlist').toString();
  const processes = JSON.parse(pm2Status);
  console.log("=== PM2 STATUS ===");
  console.log(processes.map(p => ({name: p.name, status: p.pm2_env.status})));

  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const eventLogsCounts = await db.collection('notification_event_logs').aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]).toArray();
  const msgLogsCounts = await db.collection('message_logs').aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]).toArray();
  const failedEvent = await db.collection('notification_event_logs').findOne({ eventId: "outbox-live-evt-1790257063966" });
  
  console.log("=== POST MONGODB ===");
  console.log("EventLogs:", eventLogsCounts);
  console.log("MessageLogs:", msgLogsCounts);
  console.log("Historical Event:", failedEvent ? { status: failedEvent.status, attempts: failedEvent.attempts } : null);
  
  process.exit(0);
}
require('dotenv').config({ path: '/opt/tabdeal/Blastup/.env' });
checkPost();
