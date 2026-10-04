const Redis = require('ioredis');
require('dotenv').config({ path: '/opt/tabdeal/Blastup/.env' });
async function check() {
  const redis = new Redis(process.env.REDIS_URI);
  const key = `safemode:6aacb5fa069dffca7ac76126:seenJids`;
  const members = await redis.smembers(key);
  console.log("Known contacts:", members);
  process.exit(0);
}
check();
