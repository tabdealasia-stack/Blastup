require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);

  const result = await mongoose.connection.db.collection('apikeys').updateOne(
    { _id: new mongoose.Types.ObjectId('6aa03fff95b55b86fb74f6bb') },
    {
      $set: {
        clientId: new mongoose.Types.ObjectId('6aa186447e696881eba941de'),
        keyPrefix: 'wa_legacy',
        status: 'active'
      }
    }
  );

  console.log(result);

  await mongoose.disconnect();
}

migrate().catch(error => {
  console.error(error);
  process.exit(1);
});
