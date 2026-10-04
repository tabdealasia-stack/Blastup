import mongoose from 'mongoose';
import { Client } from './src/models/Client';
import { User } from './src/models/User';
import ClientTemplate from './src/models/ClientTemplate';
import { ClientCategory } from './src/models/ClientCategory';
import { TemplatePack } from './src/models/TemplatePack';
import { NotificationTemplate } from './src/models/NotificationTemplate';
import { MessageLog } from './src/models/MessageLog';
import { NotificationEventLog } from './src/models/NotificationEventLog';
import { Vehicle } from './src/models/Vehicle';
import { initClientCleanupWorker, stopClientCleanupWorker } from './src/workers/clientCleanupWorker';

async function getBaselines() {
  return {
    clients: await Client.countDocuments(),
    users: await User.countDocuments(),
    clientTemplates: await ClientTemplate.countDocuments(),
    messageLogs: await MessageLog.countDocuments(),
    notificationEventLogs: await NotificationEventLog.countDocuments(),
    masterTemplates: await NotificationTemplate.countDocuments(),
    categories: await ClientCategory.countDocuments(),
    templatePacks: await TemplatePack.countDocuments(),
  };
}

async function runWorker(workerFn: any, targetClient: any) {
  await Client.updateOne({ _id: targetClient._id }, { $set: { status: 'deletion_requested', cleanupLockedAt: null } });
  await workerFn();
}

async function testRootDeletionUserFirst() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wa_platform');
  console.log('Connected to DB\n');

  try {
    // Cleanup any leftovers from previous failed runs
    await Client.deleteMany({ slug: { $regex: '^temp-root-' } });
    await User.deleteMany({ username: { $regex: '^temp_root_' } });
    await Vehicle.deleteMany({ vehicleNumber: { $in: ['456'] } });
    
    const preTestBaseline = await getBaselines();
    
    // Intercept worker fn
    let workerFn: any = null;
    const originalSetInterval = global.setInterval;
    (global as any).setInterval = (fn: any, ms: number) => {
      workerFn = fn;
      return null as any;
    };
    initClientCleanupWorker();
    
    // Helper to create a fresh target
    const createTarget = async (id: string, role = 'user') => {
      const user = await User.create({ username: `temp_root_${id}_user`, password: 'password123', role });
      const client = await Client.create({ userId: user._id, businessName: `Temp Root ${id}`, slug: `temp-root-${id}`, status: 'deletion_requested', cleanupAttempts: 0 });
      return { client, user };
    };

    console.log('--- TEST 1: USER-FIRST SUCCESS ---');
    let t1 = await createTarget('t1');
    await runWorker(workerFn, t1.client);
    if (await User.findById(t1.user._id)) throw new Error('User was not deleted');
    if (await Client.findById(t1.client._id)) throw new Error('Client was not deleted');
    console.log('PASS: User and Client both absent.');

    console.log('\n--- TEST 2: USER ALREADY MISSING (IDEMPOTENCY) ---');
    let t2 = await createTarget('t2');
    await User.deleteOne({ _id: t2.user._id }); // Manually remove user first
    await runWorker(workerFn, t2.client);
    if (await Client.findById(t2.client._id)) throw new Error('Client was not deleted when User was missing');
    console.log('PASS: Missing User accepted safely; Client deleted.');

    console.log('\n--- TEST 3: USER DELETION FAILURE ---');
    let t3 = await createTarget('t3');
    const originalUserDeleteOne = User.deleteOne;
    User.deleteOne = function() { return Promise.reject(new Error('Simulated User DB Error')) } as any;
    await runWorker(workerFn, t3.client);
    User.deleteOne = originalUserDeleteOne;
    const t3Client = await Client.findById(t3.client._id);
    if (!await User.findById(t3.user._id)) throw new Error('User was deleted despite mock');
    if (!t3Client) throw new Error('Client was deleted despite User deletion failure');
    if (t3Client.status !== 'cleanup_in_progress') throw new Error('Client status changed incorrectly');
    console.log('PASS: User deletion failure gracefully handled; Client remains.');

    console.log('\n--- TEST 4/5: CRASH SIMULATION / CLIENT DELETION FAILURE ---');
    let t4 = await createTarget('t4');
    const originalClientDeleteOne = Client.deleteOne;
    Client.deleteOne = function() { return Promise.reject(new Error('Simulated Client DB Error')) } as any;
    await runWorker(workerFn, t4.client);
    Client.deleteOne = originalClientDeleteOne;
    if (await User.findById(t4.user._id)) throw new Error('User was not deleted');
    const t4Client = await Client.findById(t4.client._id);
    if (!t4Client) throw new Error('Client was deleted despite mock');
    console.log('PASS: User deleted successfully. Client deletion failed gracefully. Client remains as durable record.');

    console.log('\n--- TEST 6: CROSS-CLIENT ISOLATION ---');
    let tSafe = await createTarget('safe');
    await Client.updateOne({ _id: tSafe.client._id }, { $set: { status: 'active' } });
    await Vehicle.create({ clientId: tSafe.client._id, vehicleType: 'car', vehicleNumber: '456' });
    let t6 = await createTarget('t6');
    await runWorker(workerFn, t6.client);
    if (!await Client.findById(tSafe.client._id)) throw new Error('Safe Client deleted');
    if (!await User.findById(tSafe.user._id)) throw new Error('Safe User deleted');
    console.log('PASS: Safe Client and dependencies unharmed.');

    console.log('\n--- TEST 7: PROTECTED/SYSTEM USER BLOCK ---');
    let t7 = await createTarget('t7', 'admin');
    await runWorker(workerFn, t7.client);
    if (!await User.findById(t7.user._id)) throw new Error('Admin user was deleted');
    if (!await Client.findById(t7.client._id)) throw new Error('Admin client was deleted');
    console.log('PASS: System/admin user properly blocked.');

    console.log('\n--- TEST FIXTURE CLEANUP ---');
    await Client.deleteMany({ slug: { $regex: '^temp-root-' } });
    await User.deleteMany({ username: { $regex: '^temp_root_' } });
    await Vehicle.deleteMany({ clientId: tSafe.client._id });
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

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

testRootDeletionUserFirst();
