const Redis = require('ioredis');
require('dotenv').config({ path: '/opt/tabdeal/Blastup/.env' });
async function check() {
  const redis = new Redis(process.env.REDIS_URI);
  const keys = await redis.keys('*');
  const sets = [];
  for (const k of keys) {
      if (await redis.type(k) === 'set') {
          sets.push(k);
      }
  }
  console.log("Set keys:", sets);
  
  for (const k of sets) {
      const isKnown = await redis.sismember(k, "918698884383");
      const isKnownJid = await redis.sismember(k, "918698884383@s.whatsapp.net");
      if (isKnown || isKnownJid) {
          console.log(`FOUND in ${k}`);
      }
  }
  process.exit(0);
}
check();
