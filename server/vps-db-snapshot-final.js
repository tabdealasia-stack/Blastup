const mongoose = require('mongoose');
require('dotenv').config({ path: '/opt/tabdeal/Blastup/.env' });
async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  const eventLogs = await db.collection('notification_event_logs').countDocuments();
  const messageLogs = await db.collection('message_logs').countDocuments();
  
  const freshEventId = "outbox-live-evt-final-" + Date.now();
  console.log("FRESH_EVENT_ID:", freshEventId);
  console.log("EventLog total:", eventLogs);
  console.log("MessageLog total:", messageLogs);
  
  const eventLogsFresh = await db.collection('notification_event_logs').countDocuments({ eventId: freshEventId });
  const messageLogsFresh = await db.collection('message_logs').countDocuments({ eventId: freshEventId });
  console.log("EventLog count for fresh:", eventLogsFresh);
  console.log("MessageLog count for fresh:", messageLogsFresh);
  
  process.exit(0);
}
check();
