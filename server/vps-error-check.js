const mongoose = require('mongoose');
require('dotenv').config({ path: '/opt/tabdeal/Blastup/.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const eventLog = await db.collection('notification_event_logs').findOne({ eventId: "outbox-live-evt-1790257063966" });
  console.log("EventLog ErrorMessage:", eventLog.errorMessage);
  console.log("EventLog ErrorCode:", eventLog.errorCode);
  process.exit(0);
}
run();
