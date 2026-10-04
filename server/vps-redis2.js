const mongoose = require('mongoose');
require('dotenv').config({ path: '/opt/tabdeal/Blastup/.env' });
async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const client = await db.collection('clients').findOne({ name: "TABDEAL DIGITAL" });
  console.log("Client ID for TABDEAL DIGITAL:", client._id.toString());
  
  const Redis = require('ioredis');
  const redis = new Redis(process.env.REDIS_URI);
  const key = `safemode:known_contacts:${client._id.toString()}`;
  const isKnown = await redis.sismember(key, "918698884383");
  console.log("Known contact SISMEMBER result for this client:", isKnown);
  process.exit(0);
}
check();
