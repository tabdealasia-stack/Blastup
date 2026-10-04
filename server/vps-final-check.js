const mongoose = require('mongoose');
require('dotenv').config({ path: '/opt/tabdeal/Blastup/.env' });

async function activate() {
  const eventId = "outbox-live-evt-9ai-1790400000001";
  
  await mongoose.connect(process.env.MONGODB_URI);
  const actualDb = mongoose.connection.db;
  const eventLog = await actualDb.collection('notification_event_logs').findOne({ eventId });
  console.log("=== FINAL EVENT LOG ===");
  console.log(JSON.stringify(eventLog, null, 2));

  const msgLog = await actualDb.collection('message_logs').findOne({ eventId });
  if (msgLog) {
     console.log("=== MESSAGE LOG ===");
     console.log(JSON.stringify(msgLog, null, 2));
  } else {
     console.log("=== NO MESSAGE LOG FOUND ===");
  }
  
  const eventLogsCount = await actualDb.collection('notification_event_logs').countDocuments({ eventId });
  const msgLogsCount = await actualDb.collection('message_logs').countDocuments({ eventId });
  
  console.log("EventLog count for event:", eventLogsCount);
  console.log("MessageLog count for event:", msgLogsCount);

  process.exit(0);
}
activate();
