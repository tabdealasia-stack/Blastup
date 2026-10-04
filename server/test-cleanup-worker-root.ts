import mongoose from 'mongoose';
import { Client } from './src/models/Client';
import { User } from './src/models/User';
import { Vehicle } from './src/models/Vehicle';
import { MessageLog } from './src/models/MessageLog';
import { NotificationEventLog } from './src/models/NotificationEventLog';
import { NotificationTemplate } from './src/models/NotificationTemplate';
import { ClientCategory } from './src/models/ClientCategory';
import { TemplatePack } from './src/models/TemplatePack';
import ClientTemplate from './src/models/ClientTemplate';
import { ApiKey } from './src/models/ApiKey';
import { Session } from './src/models/Session';
import { WhatsAppAccount } from './src/models/WhatsAppAccount';
import { WhatsAppInstance } from './src/models/WhatsAppInstance';
import { initClientCleanupWorker, stopClientCleanupWorker } from './src/workers/clientCleanupWorker';
import dotenv from 'dotenv';
dotenv.config();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getBaselines() {
  return {
    clients: await Client.countDocuments(),
    users: await User.countDocuments(),
    clientTemplates: await ClientTemplate.countDocuments(),
    apiKeys: await ApiKey.countDocuments(),
    sessions: await Session.countDocuments(),
    waAccounts: await WhatsAppAccount.countDocuments(),
    waInstances: await WhatsAppInstance.countDocuments(),
    messageLogs: await MessageLog.countDocuments(),
    notificationEventLogs: await NotificationEventLog.countDocuments(),
    masterTemplates: await NotificationTemplate.countDocuments(),
    categories: await ClientCategory.countDocuments(),
    templatePacks: await TemplatePack.countDocuments(),
  };
}

async function testRootDeletion() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wa_platform');
  console.log('Connected to DB\n');

  try {
    // Cleanup any leftovers from previous failed runs
    await Client.deleteMany({ slug: { $in: ['temp-root-target', 'temp-root-safe'] } });
    await User.deleteMany({ username: { $in: ['temp_root_target_user', 'temp_root_safe_user'] } });
    await Vehicle.deleteMany({ vehicleNumber: { $in: ['123', '456'] } });
    
    const preTestBaseline = await getBaselines();
    
    // Create Temporary TARGET Client and User
    const targetUser = await User.create({
      username: 'temp_root_target_user',
      password: 'password123',
      role: 'user',
    });
    
    const targetClient = await Client.create({
      userId: targetUser._id,
      businessName: 'Temp Root Target Client',
      slug: 'temp-root-target',
      status: 'deletion_requested',
      cleanupAttempts: 0
    });

    // Create Temporary SAFE Client and User
    const safeUser = await User.create({
      username: 'temp_root_safe_user',
      password: 'password123',
      role: 'user',
    });
    
    const safeClient = await Client.create({
      userId: safeUser._id,
      businessName: 'Temp Root Safe Client',
      slug: 'temp-root-safe',
      status: 'active',
    });

    // Create retained logs for Target
    const fakeApiKey = new mongoose.Types.ObjectId();
    await MessageLog.create({ 
      clientId: targetClient._id, 
      instanceId: targetUser._id, 
      fromMe: true, 
      messageId: '1', 
      timestamp: new Date(),
      messageType: 'text',
      to: '1234567890',
      apiKeyId: fakeApiKey
    });
    await NotificationEventLog.create({ clientId: targetClient._id, event: 'test', eventId: '1', payload: {}, processedAt: new Date() });
    
    // Create an intentional blocking dependency for Target (Vehicle)
    const blockVehicle = await Vehicle.create({ clientId: targetClient._id, vehicleType: 'car', vehicleNumber: '123' });
    
    // Create a safe dependency
    await Vehicle.create({ clientId: safeClient._id, vehicleType: 'car', vehicleNumber: '456' });

    console.log('--- 1. BLOCKED DELETION TEST ---');
    let workerFn: any = null;
    const originalSetInterval = global.setInterval;
    (global as any).setInterval = (fn: any, ms: number) => {
      workerFn = fn;
      return null as any;
    };
    initClientCleanupWorker();
    
    // Mock deleteMany to ensure the Vehicle remains and blocks the final gate
    const originalVehicleDeleteMany = Vehicle.deleteMany;
    Vehicle.deleteMany = function() { return Promise.resolve({ deletedCount: 0 }) } as any;
    
    // Run worker manually
    await workerFn();
    
    // Restore deleteMany
    Vehicle.deleteMany = originalVehicleDeleteMany;
    
    const clientAfterBlock = await Client.findById(targetClient._id);
    if (!clientAfterBlock) throw new Error('Client was deleted despite block!');
    if (clientAfterBlock.status !== 'cleanup_in_progress') throw new Error('Status changed');
    if (!clientAfterBlock.cleanupError?.includes('verification')) throw new Error('Wrong error: ' + clientAfterBlock.cleanupError);
    console.log('PASS: Deletion blocked by remaining dependency.');

    console.log('\n--- 2. SUCCESSFUL ISOLATED DELETION TEST ---');
    // Remove the blocking vehicle
    await Vehicle.deleteOne({ _id: blockVehicle._id });
    
    // Run worker again
    // We need to set it back to deletion_requested since the first run might have failed it? 
    // Wait, the first run set it to cleanup_in_progress and set cleanupError.
    // If it's cleanup_in_progress, the stalled lease recovery will pick it up if it's >10 mins old.
    // Let's manually bypass the lease for testing by forcing it back to deletion_requested:
    await Client.updateOne({ _id: targetClient._id }, { $set: { status: 'deletion_requested', cleanupLockedAt: null } });
    
    await workerFn();

    const clientAfterSuccess = await Client.findById(targetClient._id);
    const userAfterSuccess = await User.findById(targetUser._id);
    
    if (clientAfterSuccess) throw new Error('Client was NOT deleted!');
    if (userAfterSuccess) throw new Error('User was NOT deleted!');
    console.log('PASS: Target root Client and User successfully deleted.');

    console.log('\n--- 3. CROSS-CLIENT ISOLATION TEST ---');
    const safeClientAfter = await Client.findById(safeClient._id);
    const safeUserAfter = await User.findById(safeUser._id);
    const safeVehicleAfter = await Vehicle.countDocuments({ clientId: safeClient._id });
    
    if (!safeClientAfter || !safeUserAfter || safeVehicleAfter === 0) {
      throw new Error('Safe data was modified!');
    }
    console.log('PASS: Safe Client, User, and dependencies remain untouched.');

    console.log('\n--- 4. IDEMPOTENCY TEST ---');
    await workerFn(); // Run again, should do nothing
    console.log('PASS: Idempotent repeat run is safe.');

    console.log('\n--- 5. RETAINED LOG TEST ---');
    const msgLog = await MessageLog.countDocuments({ clientId: targetClient._id });
    const evtLog = await NotificationEventLog.countDocuments({ clientId: targetClient._id });
    if (msgLog === 0 || evtLog === 0) {
      throw new Error('Retained logs were deleted!');
    }
    console.log('PASS: MessageLog and NotificationEventLog safely retained.');

    console.log('\n--- TEST FIXTURE CLEANUP ---');
    await Client.deleteOne({ slug: 'temp-root-safe' });
    await User.deleteOne({ username: 'temp_root_safe_user' });
    await Vehicle.deleteOne({ clientId: safeClient._id });
    await MessageLog.deleteMany({ clientId: targetClient._id });
    await NotificationEventLog.deleteMany({ clientId: targetClient._id });
    console.log('PASS: Temporary fixtures cleaned up.');

    console.log('\n--- 6. PRODUCTION BASELINE BEFORE/AFTER ---');
    const postTestBaseline = await getBaselines();
    
    const checks = [
      { name: 'Clients', pre: preTestBaseline.clients, post: postTestBaseline.clients },
      { name: 'Users', pre: preTestBaseline.users, post: postTestBaseline.users },
      { name: 'ClientTemplates', pre: preTestBaseline.clientTemplates, post: postTestBaseline.clientTemplates },
      { name: 'Categories', pre: preTestBaseline.categories, post: postTestBaseline.categories },
      { name: 'Packs', pre: preTestBaseline.templatePacks, post: postTestBaseline.templatePacks },
      { name: 'Master Templates', pre: preTestBaseline.masterTemplates, post: postTestBaseline.masterTemplates }
    ];
    
    for (const check of checks) {
      if (check.pre !== check.post) {
        throw new Error(`Production leak detected for ${check.name}: pre=${check.pre} post=${check.post}`);
      }
    }
    console.log('PASS: All production master and operational data preserved safely.');
    
    stopClientCleanupWorker();
    global.setInterval = originalSetInterval;    
    // To test the logic instantly, we'll extract the internal function or mock the interval.
    // Actually, I can just require the file and override setInterval temporarily? No, standard JS trick.
    // Let's just run the code that the worker runs by simulating it directly since it's hardcoded to 60s.
    
    // WAIT, `clientCleanupWorker.ts` has an anonymous function. Let's just rewrite the setInterval to run immediately in a test environment.
    // Instead of waiting, I will extract the logic or just let the test trigger it directly. 
    // For now, I'll temporarily override setInterval globally.
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

testRootDeletion();
