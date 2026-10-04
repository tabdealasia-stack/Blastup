require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const crypto = require('crypto');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);

  const keyHash = crypto
    .createHash('sha256')
    .update(process.env.TEST_API_KEY)
    .digest('hex');

  const doc = await mongoose.connection.db.collection('apikeys').findOne(
    { keyHash },
    { projection: { name: 1, key: 1, keyHash: 1, keyPrefix: 1, clientId: 1, status: 1 } }
  );

  console.log({
    found: !!doc,
    hasRawKey: !!doc?.key,
    keyPrefix: doc?.keyPrefix,
    hasKeyHash: !!doc?.keyHash,
    clientId: doc?.clientId,
    status: doc?.status
  });

  await mongoose.disconnect();
}

check().catch(error => {
  console.error(error);
  process.exit(1);
});
