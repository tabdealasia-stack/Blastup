const mongoose = require('mongoose');
require('dotenv').config({ path: '/opt/tabdeal/Blastup/.env' });
async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const evt = await db.collection('notification_event_logs').findOne({ eventId: "outbox-live-evt-24x7-1790317997891" });
  console.log("clientId:", evt.clientId.toString());
  
  const Redis = require('ioredis');
  const redis = new Redis(process.env.REDIS_URI);
  const key = `safemode:known_contacts:${evt.clientId.toString()}`;
  const isKnown = await redis.sismember(key, "918698884383");
  console.log("Known contact SISMEMBER result:", isKnown);
  process.exit(0);
}
check();
