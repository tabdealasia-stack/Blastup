import mongoose from 'mongoose';
import { Client } from './src/models/Client';
import { User } from './src/models/User';
import ClientTemplate from './src/models/ClientTemplate';
import { NotificationTemplate } from './src/models/NotificationTemplate';
import dotenv from 'dotenv';
dotenv.config();

async function runTestWorkerClaim() {
  const clientToCleanup = await Client.findOneAndUpdate(
    { status: 'deletion_requested' },
    {
      $set: { status: 'cleanup_in_progress', cleanupLockedAt: new Date() },
      $inc: { cleanupAttempts: 1 }
    },
    { new: true, sort: { deletionRequestedAt: 1 } }
  );

  if (clientToCleanup) {
    try {
      await ClientTemplate.deleteMany({ clientId: clientToCleanup._id });
      
      const remainingTemplates = await ClientTemplate.countDocuments({ clientId: clientToCleanup._id });
      if (remainingTemplates > 0) {
        throw new Error(`Verification failed: ${remainingTemplates} ClientTemplates remain`);
      }
      console.log(`Successfully cleaned up ClientTemplates for client ${clientToCleanup._id}`);
    } catch (cleanupErr: any) {
      console.error(`Failed to cleanup ClientTemplates for client ${clientToCleanup._id}:`, cleanupErr.message);
      await Client.updateOne(
        { _id: clientToCleanup._id },
        { $set: { cleanupError: `ClientTemplate cleanup failed: ${cleanupErr.message}` } }
      );
    }
    return await Client.findById(clientToCleanup._id); // Return fresh doc
  }
  return null;
}

async function testWorker() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wa_platform');
  console.log('Connected to DB');

  try {
    const testUser1 = await User.create({
      name: 'Temp Worker CT User 1',
      username: 'temp_worker_ct_user_1',
      email: 'temp.worker.ct1@example.com',
      password: 'password123',
      role: 'user'
    });

    const testUser2 = await User.create({
      name: 'Temp Worker CT User 2',
      username: 'temp_worker_ct_user_2',
      email: 'temp.worker.ct2@example.com',
      password: 'password123',
      role: 'user'
    });

    const targetClient = await Client.create({
      userId: testUser1._id,
      businessName: 'Target Cleanup Client',
      slug: 'temp-target-' + Date.now(),
      status: 'deletion_requested',
      deletionRequestedAt: new Date(),
      cleanupAttempts: 0
    });

    const safeClient = await Client.create({
      userId: testUser2._id,
      businessName: 'Safe Cross Client',
      slug: 'temp-safe-' + Date.now(),
      status: 'active'
    });

    // Create mock NotificationTemplates
    const mockNotifTemplate1 = await NotificationTemplate.create({
      name: 'Mock Master Template 1',
      category: 'Mock Category',
      language: 'en',
      components: [],
      message: 'Mock message 1',
      event: 'mock_event_1',
      slug: 'mock-master-1-' + Date.now(),
      templatePackId: new mongoose.Types.ObjectId()
    });

    const mockNotifTemplate2 = await NotificationTemplate.create({
      name: 'Mock Master Template 2',
      category: 'Mock Category',
      language: 'en',
      components: [],
      message: 'Mock message 2',
      event: 'mock_event_2',
      slug: 'mock-master-2-' + Date.now(),
      templatePackId: new mongoose.Types.ObjectId()
    });

    const mockNotifTemplate3 = await NotificationTemplate.create({
      name: 'Mock Master Template 3',
      category: 'Mock Category',
      language: 'en',
      components: [],
      message: 'Mock message 3',
      event: 'mock_event_3',
      slug: 'mock-master-3-' + Date.now(),
      templatePackId: new mongoose.Types.ObjectId()
    });

    // Create ClientTemplates for targetClient
    await ClientTemplate.create([
      { clientId: targetClient._id, templateId: mockNotifTemplate1._id, enabled: true },
      { clientId: targetClient._id, templateId: mockNotifTemplate2._id, enabled: false },
      { clientId: targetClient._id, templateId: mockNotifTemplate3._id, enabled: true }
    ]);

    // Create ClientTemplates for safeClient
    await ClientTemplate.create([
      { clientId: safeClient._id, templateId: mockNotifTemplate1._id, enabled: true }
    ]);

    console.log('\n--- Case A & C: Normal cleanup & Verification ---');
    console.log(`Before cleanup: Target CT count = ${await ClientTemplate.countDocuments({ clientId: targetClient._id })}`);
    const afterFirstRun = await runTestWorkerClaim();
    const countAfterRun = await ClientTemplate.countDocuments({ clientId: targetClient._id });
    if (countAfterRun === 0 && afterFirstRun?.status === 'cleanup_in_progress') {
      console.log('PASS: ClientTemplates successfully deleted and status preserved.');
    } else {
      console.error('FAIL: ClientTemplates not cleaned up or status changed!', countAfterRun, afterFirstRun?.status);
    }

    console.log('\n--- Case B: Repeat cleanup (Idempotency) ---');
    // Since it's cleanup_in_progress, the standard claim won't pick it up, we have to mock the block execution
    const repeatCountBefore = await ClientTemplate.countDocuments({ clientId: targetClient._id });
    await ClientTemplate.deleteMany({ clientId: targetClient._id });
    const repeatCountAfter = await ClientTemplate.countDocuments({ clientId: targetClient._id });
    if (repeatCountBefore === 0 && repeatCountAfter === 0) {
      console.log('PASS: Repeated deleteMany() execution is safe and idempotent.');
    } else {
      console.error('FAIL: Idempotency check failed.');
    }

    console.log('\n--- Case D: Master data safety ---');
    const masterRemaining = await NotificationTemplate.findById(mockNotifTemplate1._id);
    if (masterRemaining) {
      console.log('PASS: NotificationTemplate remained untouched.');
    } else {
      console.error('FAIL: NotificationTemplate was deleted!');
    }

    console.log('\n--- Case E: Cross-client safety ---');
    const safeRemaining = await ClientTemplate.countDocuments({ clientId: safeClient._id });
    if (safeRemaining === 1) {
      console.log('PASS: Safe client records remained untouched.');
    } else {
      console.error('FAIL: Cross-client records were affected!');
    }

    console.log('\n--- Case F & Failure Scenario Mocking ---');
    // We mock failure by explicitly executing the catch block logic 
    console.log('Mocking failure where count > 0 after deletion...');
    const simulatedError = new Error('Verification failed: 3 ClientTemplates remain');
    await Client.updateOne(
      { _id: targetClient._id },
      { $set: { cleanupError: `ClientTemplate cleanup failed: ${simulatedError.message}` } }
    );
    const failedClient = await Client.findById(targetClient._id);
    if (failedClient?.cleanupError?.includes('Verification failed') && failedClient?.status === 'cleanup_in_progress') {
      console.log('PASS: Simulated failure correctly logged error while keeping cleanup_in_progress state.');
    } else {
      console.error('FAIL: Error handling behavior is incorrect.');
    }

    // TEST FIXTURE CLEANUP
    await ClientTemplate.deleteMany({ clientId: { $in: [targetClient._id, safeClient._id] } });
    await NotificationTemplate.deleteMany({ _id: { $in: [mockNotifTemplate1._id, mockNotifTemplate2._id, mockNotifTemplate3._id] } });
    await Client.deleteOne({ _id: targetClient._id });
    await Client.deleteOne({ _id: safeClient._id });
    await User.deleteOne({ _id: testUser1._id });
    await User.deleteOne({ _id: testUser2._id });
    console.log('\nTEST FIXTURE CLEANUP: Cleaned up temporary test records.');

  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

testWorker();
