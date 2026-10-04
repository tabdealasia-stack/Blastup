const Redis = require('ioredis');
require('dotenv').config({ path: '/opt/tabdeal/Blastup/.env' });
async function check() {
  const redis = new Redis(process.env.REDIS_URI);
  const clientId = "6aaffa5454372935ed58b083";
  const recipient = "918698884383";
  const key = `safemode:known_contacts:${clientId}`;
  const isKnown = await redis.sismember(key, recipient);
  console.log("Known contact SISMEMBER result:", isKnown);
  process.exit(0);
}
check();
