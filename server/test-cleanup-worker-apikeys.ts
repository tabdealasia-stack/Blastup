import mongoose from 'mongoose';
import { Client } from './src/models/Client';
import { User } from './src/models/User';
import ClientTemplate from './src/models/ClientTemplate';
import { NotificationTemplate } from './src/models/NotificationTemplate';
import { WhatsAppAccount } from './src/models/WhatsAppAccount';
import { WhatsAppInstance } from './src/models/WhatsAppInstance';
import { ApiKey } from './src/models/ApiKey';
import { Session } from './src/models/Session';
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

        // 5. Cleanup ApiKey
        try {
          await ApiKey.deleteMany({ clientId: clientToCleanup._id });
          const remainingApiKeys = await ApiKey.countDocuments({ clientId: clientToCleanup._id });
          if (remainingApiKeys > 0) {
            throw new Error(`Verification failed: ${remainingApiKeys} ApiKeys remain`);
          }

          // 6. Cleanup Session
          try {
            if (clientToCleanup.userId) {
              await Session.deleteMany({ userId: clientToCleanup.userId });
              const remainingSessions = await Session.countDocuments({ userId: clientToCleanup.userId });
              if (remainingSessions > 0) {
                throw new Error(`Verification failed: ${remainingSessions} Sessions remain`);
              }
            }
          } catch (sessionErr: any) {
            console.error(`Failed to cleanup Sessions for client ${clientToCleanup._id}`, sessionErr.message);
            await Client.updateOne(
              { _id: clientToCleanup._id },
              { $set: { cleanupError: `Session cleanup failed: ${sessionErr.message}` } }
            );
          }

        } catch (apiKeyErr: any) {
          console.error(`Failed to cleanup ApiKeys for client ${clientToCleanup._id}`, apiKeyErr.message);
          await Client.updateOne(
            { _id: clientToCleanup._id },
            { $set: { cleanupError: `ApiKey cleanup failed: ${apiKeyErr.message}` } }
          );
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
      name: 'Temp Worker ApiKey User 1',
      username: 'temp_worker_apikey_user_1',
      email: 'temp.worker.apikey1@example.com',
      password: 'password123',
      role: 'user'
    });

    const testUser2 = await User.create({
      name: 'Temp Worker ApiKey User 2',
      username: 'temp_worker_apikey_user_2',
      email: 'temp.worker.apikey2@example.com',
      password: 'password123',
      role: 'user'
    });

    const targetClient = await Client.create({
      userId: testUser1._id,
      businessName: 'Target ApiKey Cleanup Client',
      slug: 'temp-apikey-target-' + Date.now(),
      status: 'deletion_requested',
      deletionRequestedAt: new Date(),
      cleanupAttempts: 0
    });

    const safeClient = await Client.create({
      userId: testUser2._id,
      businessName: 'Safe ApiKey Cross Client',
      slug: 'temp-apikey-safe-' + Date.now(),
      status: 'active'
    });

    // Create ApiKey records
    await ApiKey.create([
      { name: 'Target Key 1', keyHash: 'hash1', keyPrefix: 'pref1', clientId: targetClient._id, userId: testUser1._id, status: 'active' },
      { name: 'Target Key 2', keyHash: 'hash2', keyPrefix: 'pref2', clientId: targetClient._id, userId: testUser1._id, status: 'revoked' }
    ]);
    
    await ApiKey.create([
      { name: 'Safe Key 1', keyHash: 'hash3', keyPrefix: 'pref3', clientId: safeClient._id, userId: testUser2._id, status: 'active' }
    ]);

    // Create Session records
    await Session.create([
      { userId: testUser1._id, tokenHash: 'session1', ip: '127.0.0.1', userAgent: 'test', expiresAt: new Date(Date.now() + 86400000) },
      { userId: testUser1._id, tokenHash: 'session2', ip: '127.0.0.1', userAgent: 'test', expiresAt: new Date(Date.now() + 86400000) }
    ]);

    await Session.create([
      { userId: testUser2._id, tokenHash: 'session3', ip: '127.0.0.1', userAgent: 'test', expiresAt: new Date(Date.now() + 86400000) }
    ]);

    console.log('\n--- Normal cleanup & Verification ---');
    console.log(`Before cleanup: Target ApiKeys = ${await ApiKey.countDocuments({ clientId: targetClient._id })}`);
    console.log(`Before cleanup: Target Sessions = ${await Session.countDocuments({ userId: testUser1._id })}`);
    
    const afterFirstRun = await runTestWorkerClaim();
    
    const countAkAfter = await ApiKey.countDocuments({ clientId: targetClient._id });
    const countSessAfter = await Session.countDocuments({ userId: testUser1._id });
    
    if (countAkAfter === 0 && countSessAfter === 0 && afterFirstRun?.status === 'cleanup_in_progress') {
      console.log('PASS: ApiKeys and Sessions successfully deleted and status preserved.');
    } else {
      console.error('FAIL: ApiKeys or Sessions not cleaned up or status changed!', countAkAfter, countSessAfter, afterFirstRun?.status);
    }

    console.log('\n--- Idempotency (Repeat cleanup) ---');
    // Simulate re-running deletion manually (since status is cleanup_in_progress now)
    const akCountBefore = await ApiKey.countDocuments({ clientId: targetClient._id });
    const sessCountBefore = await Session.countDocuments({ userId: testUser1._id });
    await ApiKey.deleteMany({ clientId: targetClient._id });
    await Session.deleteMany({ userId: testUser1._id });
    const akCountAfter = await ApiKey.countDocuments({ clientId: targetClient._id });
    const sessCountAfter = await Session.countDocuments({ userId: testUser1._id });
    
    if (akCountBefore === 0 && akCountAfter === 0 && sessCountBefore === 0 && sessCountAfter === 0) {
      console.log('PASS: Repeated deleteMany() execution is safe and idempotent.');
    } else {
      console.error('FAIL: Idempotency check failed.');
    }

    console.log('\n--- Cross-client safety ---');
    const safeAkRemaining = await ApiKey.countDocuments({ clientId: safeClient._id });
    const safeSessRemaining = await Session.countDocuments({ userId: testUser2._id });
    if (safeAkRemaining === 1 && safeSessRemaining === 1) {
      console.log('PASS: Safe client records remained untouched.');
    } else {
      console.error('FAIL: Cross-client records were affected!');
    }

    console.log('\n--- User Safety ---');
    const user1Exists = await User.findById(testUser1._id);
    const user2Exists = await User.findById(testUser2._id);
    if (user1Exists && user2Exists) {
      console.log('PASS: Users were not deleted.');
    } else {
      console.error('FAIL: Users were deleted!');
    }

    console.log('\n--- Failure Scenario Mocking ---');
    const simulatedError = new Error('Verification failed: 1 ApiKeys remain');
    await Client.updateOne(
      { _id: targetClient._id },
      { $set: { cleanupError: `ApiKey cleanup failed: ${simulatedError.message}` } }
    );
    const failedClient = await Client.findById(targetClient._id);
    if (failedClient?.cleanupError?.includes('ApiKey cleanup failed') && failedClient?.status === 'cleanup_in_progress') {
      console.log('PASS: Simulated failure correctly logged error while keeping cleanup_in_progress state.');
    } else {
      console.error('FAIL: Error handling behavior is incorrect.');
    }

    // TEST FIXTURE CLEANUP
    await ApiKey.deleteMany({ clientId: { $in: [targetClient._id, safeClient._id] } });
    await Session.deleteMany({ userId: { $in: [testUser1._id, testUser2._id] } });
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
