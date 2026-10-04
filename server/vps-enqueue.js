const mongoose = require('mongoose');
require('dotenv').config({ path: '/opt/tabdeal/Blastup/.env' });

async function activate() {
  const rawKey = "blastup_live_7794228f121f741f97dc18a687ed79889be63157d946eebf6fdaa1031d0dd58e";

  const timestamp = Date.now();
  const eventId = `outbox-live-evt-24x7-${timestamp}`;
  
  console.log(`Sending controlled outbox notification with eventId: ${eventId}`);
  
  const payload = {
    event: 'customer.thank_you',
    eventId: eventId,
    to: '918698884383',
    variables: {
      customer_name: 'TABDEAL 24X7 TEST',
      business_name: 'TABDEAL DIGITAL'
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
     process.exit(1);
  } else {
     console.log("PASS: 202 Accepted!");
  }
  
  // Wait a few seconds for outbox worker to process
  await new Promise(resolve => setTimeout(resolve, 15000));

  await mongoose.connect(process.env.MONGODB_URI);
  const actualDb = mongoose.connection.db;
  const eventLog = await actualDb.collection('notification_event_logs').findOne({ eventId });
  console.log("=== FINAL EVENT LOG ===");
  console.log(JSON.stringify(eventLog, null, 2));

  if (eventLog && eventLog.messageLogId) {
     const msgLog = await actualDb.collection('message_logs').findOne({ _id: eventLog.messageLogId });
     console.log("=== MESSAGE LOG ===");
     console.log(JSON.stringify(msgLog, null, 2));
  } else {
     console.log("=== NO MESSAGE LOG FOUND ===");
  }

  process.exit(0);
}
activate();
