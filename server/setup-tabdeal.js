const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config({ path: '../.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const clientId = new mongoose.Types.ObjectId('6aaffa5454372935ed58b083');

  // Find a simple template
  const tmpl = await db.collection('notification_templates').findOne({ slug: 'thank-you' });
  if (!tmpl) {
    console.log('Template not found');
    process.exit(1);
  }

  // Map ClientTemplate
  const ctId = new mongoose.Types.ObjectId();
  await db.collection('client_templates').insertOne({
    _id: ctId,
    clientId: clientId,
    templateId: tmpl._id,
    active: true,
    customMessage: null,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  console.log('ClientTemplate mapped:', ctId);

  // Create API Key
  const rawKey = 'blastup_live_' + crypto.randomBytes(32).toString('hex');
  const hashedKey = await bcrypt.hash(rawKey, 10);
  
  const apiKeyId = new mongoose.Types.ObjectId();
  await db.collection('api_keys').insertOne({
    _id: apiKeyId,
    clientId: clientId,
    name: 'Production Notification API Key',
    hashedKey: hashedKey,
    prefix: rawKey.substring(0, 8),
    status: 'active',
    lastUsedAt: null,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  console.log('API Key Created successfully.');
  console.log('RAW_KEY:', rawKey); // ONLY printed once!
  
  // Find a recipient in chats for instanceId: '6aacb5fa069dffca7ac76126'
  const chats = await db.collection('chats').find({ instanceId: '6aacb5fa069dffca7ac76126' }).limit(5).toArray();
  const contacts = await db.collection('contacts').find({ instanceId: '6aacb5fa069dffca7ac76126' }).limit(5).toArray();
  
  console.log('Chats found:', chats.map(c => c.jid || c.id || c.remoteJid));
  console.log('Contacts found:', contacts.map(c => c.id || c.jid || c.remoteJid));
  
  process.exit(0);
}
run();
