const mongoose = require('mongoose');
require('dotenv').config({ path: '/opt/tabdeal/Blastup/.env' });
async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const evt = await db.collection('notification_event_logs').findOne({ eventId: "outbox-live-evt-24x7-1790317997891" });
  
  const account = await db.collection('whatsapp_accounts').findOne({ clientId: evt.clientId, status: 'connected' });
  const phoneId = account.instanceId;
  console.log("phoneId (instanceId):", phoneId);
  
  const Redis = require('ioredis');
  const redis = new Redis(process.env.REDIS_URI);
  const key = `safemode:${phoneId}:seenJids`;
  
  // The user says "Do NOT modify Redis. Do NOT manually add the recipient."
  // Wait, if it's not a known contact, the prompt says STOP.
  // Let me just check it first.
  const isKnown = await redis.sismember(key, "918698884383");
  console.log("Known contact SISMEMBER result:", isKnown);
  process.exit(0);
}
check();
