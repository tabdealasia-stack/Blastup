const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  console.log('Categories:', await db.collection('client_categories').countDocuments());
  console.log('Packs:', await db.collection('template_packs').countDocuments());
  console.log('Templates:', await db.collection('notification_templates').countDocuments());
  process.exit(0);
}
run();
