const mongoose = require('mongoose');
require('dotenv').config({ path: '/opt/tabdeal/Blastup/.env' });

async function activate() {
  const rawKey = "blastup_live_7794228f121f741f97dc18a687ed79889be63157d946eebf6fdaa1031d0dd58e";
  const eventId = "outbox-live-evt-final-1790326081612";
  
  console.log(`Sending final outbox notification with eventId: ${eventId}`);
  
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

  if (status !== 202) {
     console.error("FAIL: Did not get 202 Accepted!");
     process.exit(1);
  } else {
     console.log("PASS: 202 Accepted!");
  }

  process.exit(0);
}
activate();
