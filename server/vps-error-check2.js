const mongoose = require('mongoose');
require('dotenv').config({ path: '/opt/tabdeal/Blastup/.env' });

async function activate() {
  const eventId = "outbox-live-evt-9ai-1790400000001";
  
  await mongoose.connect(process.env.MONGODB_URI);
  const actualDb = mongoose.connection.db;
  const eventLog = await actualDb.collection('notification_event_logs').findOne({ eventId });
  console.log("errorCode:", eventLog.errorCode);
  console.log("errorMessage:", eventLog.errorMessage);

  process.exit(0);
}
activate();
