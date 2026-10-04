const Redis = require('ioredis');
require('dotenv').config({ path: '/opt/tabdeal/Blastup/.env' });
async function check() {
  const redis = new Redis(process.env.REDIS_URI);
  const keys = await redis.keys('*seenJids*');
  console.log("Keys:", keys);
  
  for (const k of keys) {
      console.log(`Members for ${k}:`, await redis.smembers(k));
  }
  process.exit(0);
}
check();
