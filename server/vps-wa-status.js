const mongoose = require('mongoose');
require('dotenv').config({ path: '/opt/tabdeal/Blastup/.env' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const accounts = await db.collection('whatsapp_accounts').find({}).toArray();
  for (const acc of accounts) {
      console.log(`WhatsApp Account ${acc._id} status: ${acc.status}`);
  }
  process.exit(0);
}
check();
