const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
async function drop() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  await db.collection('client_categories').deleteMany({});
  await db.collection('template_packs').deleteMany({});
  await db.collection('notification_templates').deleteMany({});
  console.log('Collections dropped.');
  process.exit(0);
}
drop();
