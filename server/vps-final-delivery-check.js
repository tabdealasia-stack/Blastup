const mongoose = require('mongoose');
require('dotenv').config({ path: '/opt/tabdeal/Blastup/.env' });
async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const eventId = "outbox-live-evt-final-1790326081612";
  const ev = await db.collection('notification_event_logs').findOne({ eventId });
  console.log("=== FINAL EVENT LOG ===");
  console.log(JSON.stringify(ev, null, 2));
  
  const ml = await db.collection('message_logs').findOne({ eventId });
  console.log("=== FINAL MESSAGE LOG ===");
  console.log(JSON.stringify(ml, null, 2));
  
  const evCount = await db.collection('notification_event_logs').countDocuments({ eventId });
  const mlCount = await db.collection('message_logs').countDocuments({ eventId });
  
  console.log("EventLog count:", evCount);
  console.log("MessageLog count:", mlCount);
  
  process.exit(0);
}
check();
