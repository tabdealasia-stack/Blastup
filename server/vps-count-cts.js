const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const cts = await db.collection('client_templates').find({}).toArray();
  console.log('Client templates:', cts.length);
  process.exit(0);
}
run();
