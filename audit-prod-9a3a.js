const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;

    const ApiKeys = db.collection('apikeys');
    const ClientTemplates = db.collection('client_templates');
    const MasterTemplates = db.collection('notification_templates');
    const WAInstances = db.collection('whatsapp_instances');

    const clientIdString = '6aaffa5454372935ed58b083';
    const waInstanceIdString = '6aacb5fa2e5788ac1fbd6ac2';

    console.log('--- API KEYS ---');
    const keys = await ApiKeys.find({ clientId: new mongoose.Types.ObjectId(clientIdString) }).toArray();
    console.log('Count:', keys.length);
    for (const k of keys) {
      console.log('Name:', k.name, 'Prefix:', k.keyPrefix, 'Status:', k.status, 'Created:', k.createdAt, 'LastUsed:', k.lastUsedAt);
    }

    console.log('--- CLIENT TEMPLATES ---');
    const cTpls = await ClientTemplates.find({ clientId: new mongoose.Types.ObjectId(clientIdString) }).toArray();
    console.log('Count:', cTpls.length);
    for (const c of cTpls) {
      console.log('ID:', c._id, 'TemplateID:', c.templateId, 'Enabled:', c.enabled);
    }

    console.log('--- MASTER TEMPLATES ---');
    const mTpls = await MasterTemplates.find({}).toArray();
    console.log('Total Master Templates:', mTpls.length);
    for (const m of mTpls) {
      if (m.name && (m.name.toLowerCase().includes('otp') || m.name.toLowerCase().includes('generic') || m.name.toLowerCase().includes('test') || m.name.toLowerCase().includes('welcome'))) {
        console.log('Name:', m.name, 'Event:', m.event, 'Active:', m.active, 'Variables:', m.variables);
      }
    }
    // Print all events if we didn't find specific ones
    if (mTpls.length > 0) {
        console.log('Some events:', mTpls.slice(0, 5).map(m => m.event).join(', '));
    }

    console.log('--- SAFE MODE ---');
    const inst = await WAInstances.findOne({ _id: new mongoose.Types.ObjectId(waInstanceIdString) });
    if (inst) {
      console.log('SafeModeEnabled:', inst.safeModeEnabled);
      console.log('safeModeStartTier:', inst.safeModeStartTier);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
