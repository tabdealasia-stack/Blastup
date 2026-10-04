const Redis = require('ioredis');
require('dotenv').config({ path: '/opt/tabdeal/Blastup/.env' });
async function check() {
  const redis = new Redis(process.env.REDIS_URI);
  const key = `safemode:known_contacts:6aaffa5454372935ed58b083`;
  const members = await redis.smembers(key);
  console.log("Known contacts:", members);
  process.exit(0);
}
check();
