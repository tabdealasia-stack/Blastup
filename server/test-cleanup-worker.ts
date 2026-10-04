import mongoose from 'mongoose';
import { Client } from './src/models/Client';
import { User } from './src/models/User';
import dotenv from 'dotenv';
dotenv.config();

async function runTestWorkerReclaim() {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  return await Client.findOneAndUpdate(
    {
      status: 'cleanup_in_progress',
      cleanupLockedAt: { $lte: tenMinutesAgo }
    },
    {
      $set: {
        status: 'deletion_requested',
        cleanupLockedAt: null
      }
    },
    {
      new: true,
      sort: { cleanupLockedAt: 1 }
    }
  );
}

async function runTestWorkerClaim() {
  return await Client.findOneAndUpdate(
    { status: 'deletion_requested' },
    {
      $set: { status: 'cleanup_in_progress', cleanupLockedAt: new Date() },
      $inc: { cleanupAttempts: 1 }
    },
    { new: true, sort: { deletionRequestedAt: 1 } }
  );
}

async function testWorker() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wa_platform');
  console.log('Connected to DB');

  try {
    const testUser = await User.create({
      name: 'Temp Worker Test User 2',
      username: 'temp_worker_test_user_2',
      email: 'temp.worker.test2@example.com',
      password: 'password123',
      role: 'user'
    });

    console.log('\n--- Case A: Valid recent lease ---');
    const recentClient = await Client.create({
      userId: testUser._id,
      businessName: 'Valid Lease Client',
      slug: 'temp-valid-' + Date.now(),
      status: 'cleanup_in_progress',
      cleanupLockedAt: new Date(Date.now() - 2 * 60 * 1000), // 2 mins ago
      cleanupAttempts: 1,
      cleanupError: 'Initial error'
    });

    const reclaimedRecent = await runTestWorkerReclaim();
    if (reclaimedRecent && reclaimedRecent._id.toString() === recentClient._id.toString()) {
      console.error('FAIL: Reclaimed a client with a valid lease!');
    } else {
      console.log('PASS: Client with valid recent lease was safely ignored.');
    }

    console.log('\n--- Case B & C: Expired lease & Simultaneous reclaim attempts ---');
    const testUser2 = await User.create({
      name: 'Temp Worker Test User 3',
      username: 'temp_worker_test_user_3',
      email: 'temp.worker.test3@example.com',
      password: 'password123',
      role: 'user'
    });

    const expiredClient = await Client.create({
      userId: testUser2._id,
      businessName: 'Expired Lease Client',
      slug: 'temp-expired-' + Date.now(),
      status: 'cleanup_in_progress',
      cleanupLockedAt: new Date(Date.now() - 11 * 60 * 1000), // 11 mins ago
      cleanupAttempts: 2,
      cleanupError: 'Previous test error'
    });

    // Fire two reclaim attempts simultaneously
    const [reclaim1, reclaim2] = await Promise.all([
      runTestWorkerReclaim(),
      runTestWorkerReclaim()
    ]);

    const successfulReclaims = [reclaim1, reclaim2].filter(c => c && c._id.toString() === expiredClient._id.toString());
    
    if (successfulReclaims.length === 1) {
      console.log('PASS: Exactly one simultaneous reclaim succeeded (Atomic behavior verified).');
      const recovered = successfulReclaims[0];
      console.log(`Status after reclaim: ${recovered?.status}`); // Should be deletion_requested
      console.log(`cleanupLockedAt after reclaim: ${recovered?.cleanupLockedAt}`); // Should be null
      
      console.log('\n--- Case E & F: Previous Attempts & Error Preserved ---');
      if (recovered?.cleanupAttempts === 2 && recovered?.cleanupError === 'Previous test error') {
        console.log('PASS: cleanupAttempts and cleanupError were perfectly preserved.');
      } else {
        console.error('FAIL: State was overwritten!', recovered?.cleanupAttempts, recovered?.cleanupError);
      }
    } else {
      console.error(`FAIL: Simultaneous reclaim failed. Count: ${successfulReclaims.length}`);
    }

    console.log('\n--- Case D: Subsequent worker claim ---');
    const nextClaim = await runTestWorkerClaim();
    if (nextClaim && nextClaim._id.toString() === expiredClient._id.toString()) {
      console.log('PASS: Recovered client was successfully reclaimed by next poll cycle.');
      console.log(`Status after next claim: ${nextClaim.status}`); // Should be cleanup_in_progress
      console.log(`cleanupAttempts after next claim: ${nextClaim.cleanupAttempts}`); // Should be 3 (2 + 1)
      console.log(`cleanupLockedAt populated: ${!!nextClaim.cleanupLockedAt}`);
    } else {
      console.error('FAIL: Could not re-claim the recovered client.');
    }

    // TEST FIXTURE CLEANUP
    await Client.deleteOne({ _id: recentClient._id });
    await Client.deleteOne({ _id: expiredClient._id });
    await User.deleteOne({ _id: testUser._id });
    await User.deleteOne({ _id: testUser2._id });
    console.log('\nTEST FIXTURE CLEANUP: Cleaned up temporary test records.');

  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

testWorker();
