const mongoose = require('mongoose');
require('dotenv').config({ path: '/opt/tabdeal/Blastup/.env' });
async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const clients = await db.collection('clients').find({}).toArray();
  clients.forEach(c => console.log(`Client ID: ${c._id}, Name: ${c.name}, Status: ${c.status}`));
  process.exit(0);
}
check();
