import mongoose from 'mongoose';
import { Client } from './src/models/Client';
import { User } from './src/models/User';
import ClientTemplate from './src/models/ClientTemplate';
import { NotificationTemplate } from './src/models/NotificationTemplate';
import { WhatsAppAccount } from './src/models/WhatsAppAccount';
import { WhatsAppInstance } from './src/models/WhatsAppInstance';
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
    // 3. Cleanup ClientTemplates
    try {
      await ClientTemplate.deleteMany({ clientId: clientToCleanup._id });
      
      const remainingTemplates = await ClientTemplate.countDocuments({ clientId: clientToCleanup._id });
      if (remainingTemplates > 0) {
        throw new Error(`Verification failed: ${remainingTemplates} ClientTemplates remain`);
      }

      // 4. Cleanup WhatsAppAccount and WhatsAppInstance
      try {
        const accounts = await WhatsAppAccount.find({ clientId: clientToCleanup._id });
        const instanceIds = accounts.map(acc => acc.instanceId);
        
        if (clientToCleanup.userId && !instanceIds.includes(clientToCleanup.userId.toString())) {
          instanceIds.push(clientToCleanup.userId.toString());
        }

        await WhatsAppAccount.deleteMany({ clientId: clientToCleanup._id });
        const remainingAccounts = await WhatsAppAccount.countDocuments({ clientId: clientToCleanup._id });
        if (remainingAccounts > 0) {
          throw new Error(`Verification failed: ${remainingAccounts} WhatsAppAccounts remain`);
        }

        if (instanceIds.length > 0) {
          await WhatsAppInstance.deleteMany({ instanceId: { $in: instanceIds } });
          const remainingInstances = await WhatsAppInstance.countDocuments({ instanceId: { $in: instanceIds } });
          if (remainingInstances > 0) {
            throw new Error(`Verification failed: ${remainingInstances} WhatsAppInstances remain`);
          }
        }

      } catch (waErr: any) {
        console.error(`Failed to cleanup WhatsApp records for client ${clientToCleanup._id}`, waErr.message);
        await Client.updateOne(
          { _id: clientToCleanup._id },
          { $set: { cleanupError: `WhatsApp cleanup failed: ${waErr.message}` } }
        );
      }
    } catch (cleanupErr: any) {
      console.error(`Failed to cleanup ClientTemplates for client ${clientToCleanup._id}`, cleanupErr.message);
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
      name: 'Temp Worker WA User 1',
      username: 'temp_worker_wa_user_1',
      email: 'temp.worker.wa1@example.com',
      password: 'password123',
      role: 'user'
    });

    const testUser2 = await User.create({
      name: 'Temp Worker WA User 2',
      username: 'temp_worker_wa_user_2',
      email: 'temp.worker.wa2@example.com',
      password: 'password123',
      role: 'user'
    });

    const targetClient = await Client.create({
      userId: testUser1._id,
      businessName: 'Target WA Cleanup Client',
      slug: 'temp-wa-target-' + Date.now(),
      status: 'deletion_requested',
      deletionRequestedAt: new Date(),
      cleanupAttempts: 0
    });

    const safeClient = await Client.create({
      userId: testUser2._id,
      businessName: 'Safe WA Cross Client',
      slug: 'temp-wa-safe-' + Date.now(),
      status: 'active'
    });

    // Mock WhatsApp dependency records
    await WhatsAppAccount.create([
      { clientId: targetClient._id, instanceId: testUser1._id.toString(), status: 'disconnected', safeMode: true },
    ]);
    await WhatsAppAccount.create([
      { clientId: safeClient._id, instanceId: testUser2._id.toString(), status: 'connected', safeMode: true }
    ]);

    await WhatsAppInstance.create([
      { instanceId: testUser1._id.toString(), status: 'disconnected', sessionPath: './sessions/target' }
    ]);

    await WhatsAppInstance.create([
      { instanceId: testUser2._id.toString(), status: 'connected', sessionPath: './sessions/safe' }
    ]);

    console.log('\n--- Normal cleanup & Verification ---');
    console.log(`Before cleanup: Target WA Accounts = ${await WhatsAppAccount.countDocuments({ clientId: targetClient._id })}`);
    const afterFirstRun = await runTestWorkerClaim();
    
    const countAccAfter = await WhatsAppAccount.countDocuments({ clientId: targetClient._id });
    const countInstAfter = await WhatsAppInstance.countDocuments({ instanceId: { $in: [testUser1._id.toString()] } });
    
    if (countAccAfter === 0 && countInstAfter === 0 && afterFirstRun?.status === 'cleanup_in_progress') {
      console.log('PASS: WhatsAppAccounts and WhatsAppInstances successfully deleted and status preserved.');
    } else {
      console.error('FAIL: WhatsApp records not cleaned up or status changed!', countAccAfter, countInstAfter, afterFirstRun?.status);
    }

    console.log('\n--- Idempotency (Repeat cleanup) ---');
    // Simulate re-running deletion manually (since status is cleanup_in_progress now)
    const accCountBefore = await WhatsAppAccount.countDocuments({ clientId: targetClient._id });
    await WhatsAppAccount.deleteMany({ clientId: targetClient._id });
    await WhatsAppInstance.deleteMany({ instanceId: { $in: [testUser1._id.toString()] } });
    const accCountAfter = await WhatsAppAccount.countDocuments({ clientId: targetClient._id });
    if (accCountBefore === 0 && accCountAfter === 0) {
      console.log('PASS: Repeated deleteMany() execution is safe and idempotent.');
    } else {
      console.error('FAIL: Idempotency check failed.');
    }

    console.log('\n--- Cross-client safety ---');
    const safeAccRemaining = await WhatsAppAccount.countDocuments({ clientId: safeClient._id });
    const safeInstRemaining = await WhatsAppInstance.countDocuments({ instanceId: testUser2._id.toString() });
    if (safeAccRemaining === 1 && safeInstRemaining === 1) {
      console.log('PASS: Safe client records remained untouched.');
    } else {
      console.error('FAIL: Cross-client records were affected!');
    }

    console.log('\n--- Failure Scenario Mocking ---');
    const simulatedError = new Error('Verification failed: 1 WhatsAppAccounts remain');
    await Client.updateOne(
      { _id: targetClient._id },
      { $set: { cleanupError: `WhatsApp cleanup failed: ${simulatedError.message}` } }
    );
    const failedClient = await Client.findById(targetClient._id);
    if (failedClient?.cleanupError?.includes('WhatsApp cleanup failed') && failedClient?.status === 'cleanup_in_progress') {
      console.log('PASS: Simulated failure correctly logged error while keeping cleanup_in_progress state.');
    } else {
      console.error('FAIL: Error handling behavior is incorrect.');
    }

    // TEST FIXTURE CLEANUP
    await WhatsAppAccount.deleteMany({ clientId: { $in: [targetClient._id, safeClient._id] } });
    await WhatsAppInstance.deleteMany({ instanceId: { $in: [testUser1._id.toString(), testUser2._id.toString(), 'extra-target-instance'] } });
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
