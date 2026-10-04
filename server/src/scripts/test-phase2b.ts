// @ts-ignore
import fetch from 'node-fetch';

const SEEN_NUMBER = '919999999999'; // Simulated seen number from previous tests
const UNSEEN_NUMBER = '910000000000'; // Guaranteed unseen number

const API_KEY = 'wa_8e6f7e3bde73b8151c8ddabb2ed9775800a169643cc04a0a46d7054ec81e509e';
const URL = 'http://localhost:3001/api/notifications/event';

async function sendEvent(event: string, eventId: string, to: string, variables: any = {}) {
  const params = {
    event,
    eventId,
    to,
    variables: {
      customerName: 'Test Customer',
      bookingId: 'DIV/2026/TEST',
      ...variables
    }
  };

  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
    body: JSON.stringify(params)
  });
  
  const data: any = await res.json();
  if (!res.ok) {
    if (data.error === 'SafeModeError') return { success: false, status: 'safemode', message: data.message };
    throw new Error(JSON.stringify(data));
  }
  return { success: true, status: data.status, message: 'Delivered or Duplicate' };
}

async function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function runTests() {
  const ts = Date.now();
  
  console.log('=== PHASE 2B EVENT TESTS ===\n');

  const eventsToTest = [
    { event: 'driver_vehicle.assigned', vars: { driverName: 'Raju', driverPhone: '9876543210', vehicleNo: 'MH13 AB 1234' } },
    { event: 'trip.details_confirmed', vars: { pickup: 'Solapur', date: '2026-10-01' } },
    { event: 'trip.reminder', vars: { date: '2026-10-01', driverName: 'Raju' } },
    { event: 'trip.started', vars: {} },
    { event: 'trip.ended', vars: {} },
    { event: 'bill.generated', vars: { totalAmount: '5000', startKm: '100', endKm: '450' } },
    { event: 'feedback.request', vars: {} },
    { event: 'booking.cancelled', vars: {} },
  ];

  for (const test of eventsToTest) {
    console.log(`\n--- Testing ${test.event} ---`);
    
    // 1. Test UNSEEN (SafeMode Rejection)
    const eventId = `${test.event}-test-${ts}`;
    const resUnseen = await sendEvent(test.event, eventId, UNSEEN_NUMBER, test.vars);
    console.log(`Unseen Contact (SafeMode Expected): ${resUnseen.status}`);
    
    // 2. Test SEEN (Success Delivery)
    // Wait for the minimum gap (SafeMode Tier 1 is 10s. Let's wait 11s to be safe)
    await delay(11000); 
    const resSeen = await sendEvent(test.event, eventId, SEEN_NUMBER, test.vars);
    console.log(`Seen Contact (Retry/Delivery Expected): ${resSeen.status}`);
    
    // 3. Test DUPLICATE (Idempotency)
    const resDup = await sendEvent(test.event, eventId, SEEN_NUMBER, test.vars);
    console.log(`Duplicate Request (Idempotency Expected): ${resDup.status}`);
  }
}

runTests().catch(console.error);
