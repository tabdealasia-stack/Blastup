import mongoose from 'mongoose';
import { Client } from './src/models/Client';
import { User } from './src/models/User';
import { requestClientDeletion } from './src/services/tabdeal/client-lifecycle.service';
import dotenv from 'dotenv';
dotenv.config();

async function testDeletionRequest() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wa_platform');
  console.log('Connected to DB');

  try {
    // 1. Create a dummy test user and client
    const testUser = await User.create({
      name: 'Temp Deletion Test User',
      username: 'temp_del_test_user',
      email: 'temp.del.test@example.com',
      password: 'password123',
      role: 'user'
    });

    const testClient = await Client.create({
      userId: testUser._id,
      businessName: 'Temp Deletion Test Client',
      slug: 'temp-del-test-' + Date.now(),
      status: 'active'
    });

    console.log(`Created test client: ${testClient._id}`);

    // 2. Request deletion (success path)
    const superadminId = new mongoose.Types.ObjectId().toString(); // dummy superadmin ID
    console.log('Requesting deletion...');
    const result = await requestClientDeletion(testClient._id.toString(), superadminId);
    console.log('Result:', result);

    // 3. Verify changes
    const updatedClient = await Client.findById(testClient._id);
    console.log('Client Status after request:', updatedClient?.status);
    console.log('Deletion Requested By:', updatedClient?.deletionRequestedBy?.toString());
    
    const updatedUser = await User.findById(testUser._id);
    console.log('User isActive after request:', updatedUser?.isActive);

    // 4. Test idempotency (should throw conflict)
    console.log('Testing idempotency...');
    try {
      await requestClientDeletion(testClient._id.toString(), superadminId);
      console.log('ERROR: Idempotency failed. Did not throw.');
    } catch (err: any) {
      console.log('Idempotency success, threw:', err.message);
    }

    // 5. Clean up the test records entirely (since we just tested the service)
    await Client.deleteOne({ _id: testClient._id });
    await User.deleteOne({ _id: testUser._id });
    console.log('Cleaned up test records.');

  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

testDeletionRequest();
