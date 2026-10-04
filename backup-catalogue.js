const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config({ path: '../.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const backup = {
    categories: await db.collection('client_categories').find({}).toArray(),
    packs: await db.collection('template_packs').find({}).toArray(),
    templates: await db.collection('notification_templates').find({}).toArray(),
    clientTemplates: await db.collection('client_templates').find({}).toArray(),
  };

  fs.writeFileSync('catalogue_backup.json', JSON.stringify(backup, null, 2));
  console.log('Backup saved to catalogue_backup.json');
  process.exit(0);
}
run();
