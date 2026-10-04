const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' }); 

async function verify() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const result = {};

  result.categories = await db.collection('client_categories').countDocuments();
  result.packs = await db.collection('template_packs').countDocuments();
  result.templates = await db.collection('notification_templates').countDocuments();

  const clientIdStr = '6aaffa5454372935ed58b083';
  const clientId = new mongoose.Types.ObjectId(clientIdStr);
  result.tabdealCTs = await db.collection('client_templates').countDocuments({ clientId });
  result.tabdealApiKeys = await db.collection('api_keys').countDocuments({ clientId, status: 'active' });

  result.safeModeEnv = process.env.DISABLE_SAFEMODE !== 'true';

  const clients = await db.collection('clients').find({ _id: clientId }).toArray();
  const waAccounts = await db.collection('whatsapp_accounts').find({ clientId }).toArray();
  const waInstances = await db.collection('whatsapp_instances').find({ instanceId: '6aacb5fa069dffca7ac76126' }).toArray();

  result.clientCount = clients.length;
  result.waAccountCount = waAccounts.length;
  result.waInstanceCount = waInstances.length;
  
  result.connectedPhone = waInstances.length > 0 ? waInstances[0].number : null;
  result.isConnected = waInstances.length > 0 ? waInstances[0].status === 'connected' : false;

  const contacts = await db.collection('contacts').find({ instanceId: '6aacb5fa069dffca7ac76126' }).limit(1).toArray();
  result.safeModeRecipient = contacts.length > 0 ? contacts[0].id || contacts[0].jid || contacts[0].remoteJid : null;

  result.outboundMessages = await db.collection('message_logs').countDocuments({ 
    clientId, 
    direction: 'outbound'
  });

  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}
verify().catch(e => { console.error(e); process.exit(1); });
