const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const packs = await db.collection('template_packs').find({}).toArray();
  const templates = await db.collection('notification_templates').find({}).toArray();
  console.log('Total packs:', packs.length);
  console.log('Total templates:', templates.length);
  process.exit(0);
}
run();
