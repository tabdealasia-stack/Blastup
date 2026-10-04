const mongoose = require('mongoose');
require('dotenv').config({ path: '/opt/tabdeal/Blastup/.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const indexes = await db.collection('notification_event_logs').indexes();
  console.log("INDEXES:");
  console.log(JSON.stringify(indexes, null, 2));

  process.exit(0);
}
run();
