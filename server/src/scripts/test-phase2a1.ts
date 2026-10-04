async function sendNotificationEvent(params: any) {
  const res = await fetch('http://localhost:3001/api/notifications/event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer wa_8e6f7e3bde73b8151c8ddabb2ed9775800a169643cc04a0a46d7054ec81e509e`
    },
    body: JSON.stringify(params)
  });
  const data: any = await res.json();
  if (!res.ok && data.error === 'SafeModeError') {
     throw new Error('SafeModeError: ' + data.message);
  }
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

async function runTests() {
  console.log('--- TEST A: FIRST ATTEMPT SUCCEEDS, SECOND DUPLICATE ---');
  const eventIdA = 'test-success-' + Date.now();
  const paramsA = {
    event: 'booking.confirmed',
    eventId: eventIdA,
    to: '919999999999',
    variables: { customerName: 'Test A' }
  };

  const resA1 = await sendNotificationEvent(paramsA);
  console.log('Attempt 1 (Success):', resA1.status);

  const resA2 = await sendNotificationEvent(paramsA);
  console.log('Attempt 2 (Duplicate):', resA2.status);

  console.log('\n--- TEST B & C: FIRST ATTEMPT FAILS, SECOND RETRY SUCCEEDS ---');
  const eventIdB = 'test-fail-retry-' + Date.now();
  const paramsB_fail = {
    event: 'booking.confirmed',
    eventId: eventIdB,
    to: '910000000000', // Unseen number, will trigger SafeMode 429
    variables: { customerName: 'Test B Fail' }
  };

  try {
    await sendNotificationEvent(paramsB_fail);
  } catch (error: any) {
    console.log('Attempt 1 (Failed): Caught error ->', error.message || error);
  }

  const paramsB_success = {
    ...paramsB_fail,
    to: '919999999999', // Seen number, will succeed
    variables: { customerName: 'Test B Success' }
  };
  
  await new Promise(r => setTimeout(r, 12000)); const resB2 = await sendNotificationEvent(paramsB_success);
  console.log('Attempt 2 (Retry Success):', resB2.status);

  console.log('\n--- TEST D: AFTER RETRY SUCCESS, THIRD ATTEMPT IS DUPLICATE ---');
  const resB3 = await sendNotificationEvent(paramsB_success);
  console.log('Attempt 3 (Duplicate):', resB3.status);

  console.log('\n--- TEST E: CONCURRENT DUPLICATE REQUESTS ---');
  const eventIdE = 'test-concurrency-' + Date.now();
  const paramsE = {
    event: 'booking.confirmed',
    eventId: eventIdE,
    to: '919999999999',
    variables: { customerName: 'Test E Concurrency' }
  };

  await new Promise(r => setTimeout(r, 12000)); const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(sendNotificationEvent(paramsE).catch((err: any) => ({ status: 'error', message: err.message })));
  }

  const results = await Promise.all(promises);
  const sentCount = results.filter((r: any) => r.status === 'sent').length;
  const dupCount = results.filter((r: any) => r.status === 'duplicate').length;
  console.log('Concurrency Results:', results.map((r: any) => r.status));
  console.log(`Sent: ${sentCount}, Duplicate: ${dupCount}`);
}

runTests().catch(console.error);
