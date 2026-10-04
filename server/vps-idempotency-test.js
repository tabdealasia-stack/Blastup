
const mongoose = require('mongoose');
const { execSync } = require('child_process');
require('dotenv').config({ path: '../.env' });

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;

    const rawKey = "blastup_live_7794228f121f741f97dc18a687ed79889be63157d946eebf6fdaa1031d0dd58e";
    const clientId = new mongoose.Types.ObjectId('6aaffa5454372935ed58b083');
    const eventId = 'final-live-evt-1790231146235';

    // -- PRE-FLIGHT RECORDING ---------------------------------------------
    const msgCountBefore = await db.collection('message_logs').countDocuments({ clientId });
    const evLogCountBefore = await db.collection('notification_event_logs').countDocuments({ clientId });
    
    const existingMsg = await db.collection('message_logs').findOne({ clientId });
    const existingEvt = await db.collection('notification_event_logs').findOne({ eventId });

    console.log('--- PRE-FLIGHT ---');
    console.log('MessageLogs count before:', msgCountBefore);
    console.log('NotificationEventLogs count before:', evLogCountBefore);
    console.log('Existing MessageLog:', JSON.stringify(existingMsg));
    console.log('Existing EventLog:', JSON.stringify(existingEvt));
    console.log('------------------');

    require('fs').unlinkSync(__filename);

    const payload = {
      event: 'customer.thank_you',
      eventId: eventId,
      to: '919730226137',
      variables: {
        customer_name: 'TABDEAL TEST',
        business_name: 'TABDEAL DIGITAL'
      }
    };

    console.log('Executing DUPLICATE POST request with eventId:', eventId);

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

    await new Promise(r => setTimeout(r, 2000));

    // -- POSTFLIGHT VERIFICATION ---------------------------------------------
    const msgCountAfter = await db.collection('message_logs').countDocuments({ clientId });
    const evLogCountAfter = await db.collection('notification_event_logs').countDocuments({ clientId });
    
    const evtMatches = await db.collection('notification_event_logs').countDocuments({ clientId, eventId });
    const waMatches = await db.collection('message_logs').countDocuments({ clientId });
    const originalEvent = await db.collection('notification_event_logs').findOne({ eventId });

    const smActive = !process.env.DISABLE_SAFEMODE || process.env.DISABLE_SAFEMODE !== 'true';
    const wa = await db.collection('whatsapp_instances').findOne({ instanceId: '6aacb5fa069dffca7ac76126' });
    const waConnected = wa && wa.phone === '917887884383' && wa.status === 'connected';

    console.log('--- POST-FLIGHT ---');
    console.log('MessageLogs count after:', msgCountAfter);
    console.log('NotificationEventLogs count after:', evLogCountAfter);
    console.log('Number of MessageLogs associated with the eventId:', waMatches);
    console.log('Number of WhatsApp messages associated with the eventId:', evtMatches === 1 && waMatches === 1 ? 1 : 'Ambiguous');
    console.log('Original event status:', originalEvent.status);
    console.log('SafeMode Active:', smActive);
    console.log('WhatsApp connected:', waConnected);

    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message || e);
    process.exit(1);
  }
}
run();
