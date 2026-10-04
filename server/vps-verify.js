const mongoose = require('mongoose');
require('dotenv').config({ path: '/opt/tabdeal/Blastup/.env' });

async function verify() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const eventLog = await db.collection('notification_event_logs').findOne({ eventId: "outbox-live-evt-24x7-1790317997891" });
  console.log("=== FAILED EVENT LOG ===");
  console.log(JSON.stringify(eventLog, null, 2));

  const count = await db.collection('notification_event_logs').countDocuments({ eventId: "outbox-live-evt-24x7-1790317997891" });
  console.log("EventLogs count for this eventId:", count);

  const msgCount = await db.collection('message_logs').countDocuments({ to: "918698884383", clientId: eventLog?.clientId });
  console.log("MessageLogs for this recipient:", msgCount);

  process.exit(0);
}
verify();
