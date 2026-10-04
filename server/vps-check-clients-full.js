const mongoose = require('mongoose');
require('dotenv').config({ path: '/opt/tabdeal/Blastup/.env' });
async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const clients = await db.collection('clients').find({}).toArray();
  console.log(JSON.stringify(clients, null, 2));
  process.exit(0);
}
check();
