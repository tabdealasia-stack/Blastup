const { sendTabdealNotification } = require('./lib/index.js');

async function test() {
  const params = {
    event: "booking.confirmed",
    eventId: "test-booking-" + Date.now(),
    to: "919999999999",
    variables: {
      customerName: "Test User",
      bookingId: "DIV/2026/0009"
    },
    apiKey: "wa_8e6f7e3bde73b8151c8ddabb2ed9775800a169643cc04a0a46d7054ec81e509e"
  };

  console.log("Calling sendTabdealNotification...");
  const res1 = await sendTabdealNotification(params);
  console.log("Result 1:", res1);

  console.log("Calling again to test idempotency...");
  const res2 = await sendTabdealNotification(params);
  console.log("Result 2:", res2);
}

test().catch(console.error);
