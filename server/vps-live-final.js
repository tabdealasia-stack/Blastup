
const mongoose = require('mongoose');
const { execSync } = require('child_process');
require('dotenv').config({ path: '../.env' });

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;

    const rawKey = "blastup_live_7794228f121f741f97dc18a687ed79889be63157d946eebf6fdaa1031d0dd58e";
    const clientId = new mongoose.Types.ObjectId('6aaffa5454372935ed58b083');

    // -- PREFLIGHT ----------------------------------------------------------
    const ct = await db.collection('client_templates').findOne({ clientId });
    const tmpl = await db.collection('notification_templates').findOne({ event: 'customer.thank_you' });
    const wa = await db.collection('whatsapp_instances').findOne({ instanceId: '6aacb5fa069dffca7ac76126' });
    const msgCountBefore = await db.collection('message_logs').countDocuments({ clientId, direction: 'outbound' });
    const evLogCountBefore = await db.collection('notification_event_logs').countDocuments({ clientId });
    const redisSismember = execSync('docker exec tabdeal-redis redis-cli SISMEMBER sm:6aacb5fa069dffca7ac76126:seenJids 919730226137@s.whatsapp.net').toString().trim();

    if (!ct || ct.enabled !== true) throw new Error('Preflight: ClientTemplate not enabled');
    if (!tmpl || tmpl.active !== true) throw new Error('Preflight: Master Template not active');
    if (!wa || wa.status !== 'connected' || !wa.phone.includes('917887884383')) throw new Error('Preflight: WA not connected or wrong phone');
    if (redisSismember !== '1') throw new Error('Preflight: Recipient not in seenJids');
    if (msgCountBefore !== 0) throw new Error('Preflight: MessageLogs are not 0');
    if (evLogCountBefore !== 1) throw new Error('Preflight: EventLogs are not 1');
    if (process.env.DISABLE_SAFEMODE === 'true') throw new Error('Preflight: SafeMode disabled in env');

    console.log('Preflight checks passed.');

    // Remove the script file itself to hide the key
    require('fs').unlinkSync(__filename);

    // -- EXECUTE REQUEST ----------------------------------------------------
    const eventId = 'final-live-evt-' + Date.now();
    
    const payload = {
      event: 'customer.thank_you',
      eventId: eventId,
      to: '919730226137',
      variables: {
        customer_name: 'TABDEAL TEST',
        business_name: 'TABDEAL DIGITAL'
      }
    };

    console.log('Executing POST request with eventId:', eventId);

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

    // Wait a brief moment to ensure async processing completes
    await new Promise(r => setTimeout(r, 2500));

    // -- POSTFLIGHT VERIFICATION ---------------------------------------------
    const msgCountAfter = await db.collection('message_logs').countDocuments({ clientId, direction: 'outbound' });
    const evLogCountAfter = await db.collection('notification_event_logs').countDocuments({ clientId });
    
    const eventLog = await db.collection('notification_event_logs').findOne({ clientId, eventId });
    console.log('New EventLog:', JSON.stringify(eventLog));

    const msgLog = await db.collection('message_logs').find({ clientId, direction: 'outbound' }).sort({createdAt:-1}).limit(1).toArray();
    console.log('New MessageLog:', JSON.stringify(msgLog[0] || null));

    console.log('Total MessageLogs:', msgCountAfter);
    console.log('Total EventLogs:', evLogCountAfter);

    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message || e);
    process.exit(1);
  }
}
run();
