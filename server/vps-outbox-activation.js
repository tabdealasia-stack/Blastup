const mongoose = require('mongoose');
require('dotenv').config({ path: '/opt/tabdeal/Blastup/.env' });

async function activate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;

    const rawKey = "blastup_live_7794228f121f741f97dc18a687ed79889be63157d946eebf6fdaa1031d0dd58e";
    const clientId = new mongoose.Types.ObjectId('6aaffa5454372935ed58b083');

    const timestamp = Date.now();
    const eventId = `outbox-live-evt-${timestamp}`;
    
    // We expect 202 Accepted!
    console.log(`Sending controlled outbox notification with eventId: ${eventId}`);
    
    const payload = {
      event: 'customer.thank_you',
      eventId: eventId,
      to: '919730226137',
      variables: {
        customer_name: 'SuperAdmin Outbox Test',
      }
    };

    const res = await fetch('http://127.0.0.1:3001/api/notifications/event', {
      method: 'POST',
      headers: {
        'x-api-key': rawKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const status = res.status;
    const data = await res.json();

    console.log(`Response Status: ${status}`);
    console.log(`Response Data:`, data);

    if (status !== 202) {
       console.error("FAIL: Did not get 202 Accepted!");
    } else {
       console.log("PASS: 202 Accepted!");
    }
    
    // Verify EventLog is stuck in processing since OUTBOX_WORKER_ENABLED=false
    const eventLog = await db.collection('notification_event_logs').findOne({ eventId });
    if (eventLog && eventLog.status === 'processing') {
       console.log("PASS: EventLog is strictly queued as processing.");
    } else {
       console.error("FAIL: EventLog status is not processing!");
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}
activate();
