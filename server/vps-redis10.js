const Redis = require('ioredis');
require('dotenv').config({ path: '/opt/tabdeal/Blastup/.env' });
async function check() {
  const redis = new Redis(process.env.REDIS_URI);
  const isKnown = await redis.sismember('sm:6aacb5fa069dffca7ac76126:seenJids', "918698884383");
  const isKnownJid = await redis.sismember('sm:6aacb5fa069dffca7ac76126:seenJids', "918698884383@s.whatsapp.net");
  console.log("isKnown:", isKnown);
  console.log("isKnownJid:", isKnownJid);
  process.exit(0);
}
check();
