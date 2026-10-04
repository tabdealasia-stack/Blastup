require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

async function createMapping() {
  await mongoose.connect(process.env.MONGODB_URI);

  const clientId = new mongoose.Types.ObjectId('6aa186447e696881eba941de');
  const instanceId = '6aa02cef98a9832c24726e6d';

  const existing = await mongoose.connection.db
    .collection('whatsapp_accounts')
    .findOne({ clientId });

  if (existing) {
    console.log('WhatsApp account mapping already exists:', {
      id: existing._id,
      clientId: existing.clientId,
      instanceId: existing.instanceId,
      status: existing.status
    });
    await mongoose.disconnect();
    return;
  }

  const result = await mongoose.connection.db
    .collection('whatsapp_accounts')
    .insertOne({
      clientId,
      instanceId,
      phoneNumber: null,
      displayName: 'Tabdeal WhatsApp',
      status: 'disconnected',
      sessionPath: null,
      safeMode: true,
      connectedAt: null,
      lastSeenAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

  console.log('WhatsApp account mapping created:', result.insertedId);

  await mongoose.disconnect();
}

createMapping().catch(error => {
  console.error(error);
  process.exit(1);
});
