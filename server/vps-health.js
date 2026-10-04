const mongoose = require('mongoose');
const Redis = require('ioredis');
require('dotenv').config({ path: '/opt/tabdeal/Blastup/.env' });

async function check() {
  let healthy = true;
  try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("MongoDB = HEALTHY");
  } catch (e) {
      console.log("MongoDB = FAILED");
      healthy = false;
  }
  
  try {
      const redis = new Redis(process.env.REDIS_URI);
      await redis.ping();
      console.log("Redis = HEALTHY");
  } catch (e) {
      console.log("Redis = FAILED");
      healthy = false;
  }
  
  process.exit(healthy ? 0 : 1);
}
check();
