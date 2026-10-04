import mongoose from 'mongoose';
import { updateClient } from './src/controllers/tabdeal/client.controller';
import { Client } from './src/models/Client';
import { Log } from './src/models/Log';

async function runTests() {
  await mongoose.connect('mongodb://localhost:27017/blastup-test-db');
  console.log('Connected to DB');

  // Create a mock client
  const client = await Client.create({
    businessName: 'Test Business',
    slug: 'test-business',
    userId: new mongoose.Types.ObjectId(),
    categoryId: new mongoose.Types.ObjectId(),
    email: 'test@example.com',
    phone: '1234567890',
    whatsappNumber: null,
    settings: {
      timezone: 'UTC',
      defaultCountryCode: 'US'
    },
    status: 'active'
  });

  const mockRes = {
    json: (data: any) => {},
  };
  const mockNext = (err: any) => console.error('Error:', err);

  const getLogs = async () => await Log.find({ category: 'system', 'meta.clientId': client._id.toString() }).sort({ timestamp: -1 }).limit(1);

  console.log('\\n--- TEST 1: Change phone ---');
  let req1 = { params: { id: client._id }, body: { phone: '0987654321' }, user: { id: 'admin1' } };
  await updateClient(req1 as any, mockRes as any, mockNext as any);
  let logs = await getLogs();
  console.log('Logs Test 1:', JSON.stringify(logs[0]?.meta?.changedFields));

  console.log('\\n--- TEST 2: Change whatsappNumber ---');
  let req2 = { params: { id: client._id }, body: { whatsappNumber: '5551234' }, user: { id: 'admin1' } };
  await updateClient(req2 as any, mockRes as any, mockNext as any);
  logs = await getLogs();
  console.log('Logs Test 2:', JSON.stringify(logs[0]?.meta?.changedFields));

  console.log('\\n--- TEST 3: Change both ---');
  let req3 = { params: { id: client._id }, body: { phone: '1111', whatsappNumber: '2222' }, user: { id: 'admin1' } };
  await updateClient(req3 as any, mockRes as any, mockNext as any);
  logs = await getLogs();
  console.log('Logs Test 3:', JSON.stringify(logs[0]?.meta?.changedFields));

  console.log('\\n--- TEST 4: Submit identical values ---');
  let req4 = { params: { id: client._id }, body: { phone: '1111', whatsappNumber: '2222' }, user: { id: 'admin1' } };
  await Log.deleteMany({});
  await updateClient(req4 as any, mockRes as any, mockNext as any);
  logs = await getLogs();
  console.log('Logs Test 4 (should be empty):', logs.length === 0 ? 'No log' : logs[0]?.meta?.changedFields);

  console.log('\\n--- TEST 5: Clear whatsappNumber ---');
  let req5 = { params: { id: client._id }, body: { whatsappNumber: '' }, user: { id: 'admin1' } };
  await updateClient(req5 as any, mockRes as any, mockNext as any);
  logs = await getLogs();
  console.log('Logs Test 5:', JSON.stringify(logs[0]?.meta?.changedFields));

  console.log('\\n--- TEST 6: Change timezone ---');
  let req6 = { params: { id: client._id }, body: { timezone: 'America/New_York' }, user: { id: 'admin1' } };
  await updateClient(req6 as any, mockRes as any, mockNext as any);
  logs = await getLogs();
  console.log('Logs Test 6:', JSON.stringify(logs[0]?.meta?.changedFields));

  console.log('\\n--- TEST 7: Change defaultCountryCode ---');
  let req7 = { params: { id: client._id }, body: { defaultCountryCode: 'CA' }, user: { id: 'admin1' } };
  await updateClient(req7 as any, mockRes as any, mockNext as any);
  logs = await getLogs();
  console.log('Logs Test 7:', JSON.stringify(logs[0]?.meta?.changedFields));

  await mongoose.disconnect();
}

runTests().catch(console.error);
