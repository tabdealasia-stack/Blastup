const mongoose = require('mongoose');
require('dotenv').config({ path: '/opt/tabdeal/Blastup/.env' });

async function activate() {
  const rawKey = "blastup_live_7794228f121f741f97dc18a687ed79889be63157d946eebf6fdaa1031d0dd58e";
  const eventId = "outbox-live-evt-final-1790326081612";
  
  console.log(`Sending DUPLICATE outbox notification with eventId: ${eventId}`);
  
  const payload = {
    event: 'customer.thank_you',
    eventId: eventId,
    to: '918698884383',
    variables: {
      customer_name: 'TABDEAL FINAL TEST',
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

  if (status !== 200 || data.status !== 'duplicate') {
     console.error("FAIL: Did not get 200 Duplicate!");
     process.exit(1);
  } else {
     console.log("PASS: 200 Duplicate!");
  }

  // Wait a moment to ensure no dual processing
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  await mongoose.connect(process.env.MONGODB_URI);
  const actualDb = mongoose.connection.db;
  
  const evCount = await actualDb.collection('notification_event_logs').countDocuments({ eventId });
  const mlCount = await actualDb.collection('message_logs').countDocuments({ eventId });
  
  console.log("EventLog count:", evCount);
  console.log("MessageLog count:", mlCount);

  process.exit(0);
}
activate();
