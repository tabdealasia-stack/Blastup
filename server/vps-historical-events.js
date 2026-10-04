const mongoose = require('mongoose');
require('dotenv').config({ path: '/opt/tabdeal/Blastup/.env' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const ev1 = await db.collection('notification_event_logs').findOne({ eventId: "outbox-live-evt-24x7-1790317997891" });
  const ev2 = await db.collection('notification_event_logs').findOne({ eventId: "outbox-live-evt-9ai-1790400000001" });
  
  console.log("Historical Event 1 State:");
  console.log(ev1 ? `status: ${ev1.status}, attempts: ${ev1.attempts}, error: ${ev1.errorCode}` : "NOT FOUND");
  
  console.log("Historical Event 2 State:");
  console.log(ev2 ? `status: ${ev2.status}, attempts: ${ev2.attempts}, error: ${ev2.errorCode}` : "NOT FOUND");

  process.exit(0);
}
check();
