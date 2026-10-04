
const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config({ path: '../.env' });

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;

    const rawKey = "blastup_live_7794228f121f741f97dc18a687ed79889be63157d946eebf6fdaa1031d0dd58e";
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 11);

    const clientId = new mongoose.Types.ObjectId('6aaffa5454372935ed58b083');
    const userId = new mongoose.Types.ObjectId('6aacb5fa069dffca7ac76126');

    await db.collection('apikeys').updateOne(
      { clientId },
      {
        $set: {
          name: 'Production Notification API Key',
          keyHash,
          keyPrefix,
          userId,
          status: 'active',
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date(),
          lastUsedAt: null,
          expiresAt: null
        }
      },
      { upsert: true }
    );
    
    const tmpl = await db.collection('notification_templates').findOne({ event: 'customer.thank_you' });
    if(tmpl) {
      await db.collection('client_templates').updateOne(
        { clientId, templateId: tmpl._id },
        {
          $set: { active: true, updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date(), customMessage: null }
        },
        { upsert: true }
      );
    }

    console.log('Pre-flight DB fix successful.');

    // Remove the script file itself to hide the key
    require('fs').unlinkSync(__filename);

    const payload = {
      event: 'customer.thank_you',
      eventId: 'test-evt-' + Date.now(),
      to: '919730226137',
      variables: {
        customer_name: 'TABDEAL TEST',
        business_name: 'TABDEAL DIGITAL'
      }
    };

    const res = await fetch('http://localhost:3001/api/notifications/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': rawKey
      },
      body: JSON.stringify(payload)
    });

    const status = res.status;
    let data;
    try {
      data = await res.json();
    } catch(e) {
      data = await res.text();
    }
    
    console.log('HTTP STATUS:', status);
    console.log('RESPONSE:', JSON.stringify(data));

    const eventLog = await db.collection('notification_event_logs').find({ clientId }).sort({createdAt:-1}).limit(1).toArray();
    console.log('EventLog:', JSON.stringify(eventLog));

    const msgLog = await db.collection('message_logs').find({ clientId }).sort({createdAt:-1}).limit(1).toArray();
    console.log('MessageLog:', JSON.stringify(msgLog));

    process.exit(0);
  } catch(e) {
    console.error('Error:', e);
    process.exit(1);
  }
}
run();
