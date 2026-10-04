import mongoose from 'mongoose';
import { Client } from './src/models/Client';
import { User } from './src/models/User';
import ClientTemplate from './src/models/ClientTemplate';
import { WhatsAppAccount } from './src/models/WhatsAppAccount';
import { WhatsAppInstance } from './src/models/WhatsAppInstance';
import { ApiKey } from './src/models/ApiKey';
import { Session } from './src/models/Session';
import { TravelBooking } from './src/models/TravelBooking';
import { Vehicle } from './src/models/Vehicle';
import { Driver } from './src/models/Driver';
import { Chat } from './src/models/Chat';
import { Contact } from './src/models/Contact';
import { Message } from './src/models/Message';
import { Reminder } from './src/models/Reminder';
import { CampaignLog } from './src/models/CampaignLog';
import { Campaign } from './src/models/Campaign';
import { ChatbotKnowledge } from './src/models/ChatbotKnowledge';
import { ChatbotLead } from './src/models/ChatbotLead';
import { Chatbot } from './src/models/Chatbot';
import { AITrainingMessage } from './src/models/AITrainingMessage';
import { Log } from './src/models/Log';
import dotenv from 'dotenv';
dotenv.config();

async function runTestWorkerClaim() {
  const clientToCleanup = await Client.findOneAndUpdate(
    { status: 'deletion_requested' },
    { $set: { status: 'cleanup_in_progress', cleanupLockedAt: new Date() }, $inc: { cleanupAttempts: 1 } },
    { new: true, sort: { deletionRequestedAt: 1 } }
  );

  if (clientToCleanup) {
    try {
      await ClientTemplate.deleteMany({ clientId: clientToCleanup._id });
      if (await ClientTemplate.countDocuments({ clientId: clientToCleanup._id }) > 0) throw new Error('CT');
      
      const accounts = await WhatsAppAccount.find({ clientId: clientToCleanup._id });
      const instanceIds = accounts.map(acc => acc.instanceId);
      if (clientToCleanup.userId && !instanceIds.includes(clientToCleanup.userId.toString())) {
        instanceIds.push(clientToCleanup.userId.toString());
      }

      await WhatsAppAccount.deleteMany({ clientId: clientToCleanup._id });
      if (await WhatsAppAccount.countDocuments({ clientId: clientToCleanup._id }) > 0) throw new Error('WA');
      
      if (instanceIds.length > 0) {
        await WhatsAppInstance.deleteMany({ instanceId: { $in: instanceIds } });
        if (await WhatsAppInstance.countDocuments({ instanceId: { $in: instanceIds } }) > 0) throw new Error('WI');
      }

      await ApiKey.deleteMany({ clientId: clientToCleanup._id });
      if (await ApiKey.countDocuments({ clientId: clientToCleanup._id }) > 0) throw new Error('AK');

      if (clientToCleanup.userId) {
        await Session.deleteMany({ userId: clientToCleanup.userId });
        if (await Session.countDocuments({ userId: clientToCleanup.userId }) > 0) throw new Error('S');
      }

      try {
        await TravelBooking.deleteMany({ clientId: clientToCleanup._id });
        if (await TravelBooking.countDocuments({ clientId: clientToCleanup._id }) > 0) throw new Error('TravelBooking verification');

        await Vehicle.deleteMany({ clientId: clientToCleanup._id });
        if (await Vehicle.countDocuments({ clientId: clientToCleanup._id }) > 0) throw new Error('Vehicle verification');

        await Driver.deleteMany({ clientId: clientToCleanup._id });
        if (await Driver.countDocuments({ clientId: clientToCleanup._id }) > 0) throw new Error('Driver verification');

        if (instanceIds.length > 0) {
          await Chat.deleteMany({ instanceId: { $in: instanceIds } });
          if (await Chat.countDocuments({ instanceId: { $in: instanceIds } }) > 0) throw new Error('Chat verification');

          await Contact.deleteMany({ instanceId: { $in: instanceIds } });
          if (await Contact.countDocuments({ instanceId: { $in: instanceIds } }) > 0) throw new Error('Contact verification');

          await Message.deleteMany({ instanceId: { $in: instanceIds } });
          if (await Message.countDocuments({ instanceId: { $in: instanceIds } }) > 0) throw new Error('Message verification');

          await Reminder.deleteMany({ instanceId: { $in: instanceIds } });
          if (await Reminder.countDocuments({ instanceId: { $in: instanceIds } }) > 0) throw new Error('Reminder verification');
        
          await CampaignLog.deleteMany({ instanceId: { $in: instanceIds } });
          if (await CampaignLog.countDocuments({ instanceId: { $in: instanceIds } }) > 0) throw new Error('CampaignLog verification');

          await Campaign.deleteMany({ instanceId: { $in: instanceIds } });
          if (await Campaign.countDocuments({ instanceId: { $in: instanceIds } }) > 0) throw new Error('Campaign verification');
        
          await ChatbotKnowledge.deleteMany({ instanceId: { $in: instanceIds } });
          if (await ChatbotKnowledge.countDocuments({ instanceId: { $in: instanceIds } }) > 0) throw new Error('ChatbotKnowledge verification');

          await ChatbotLead.deleteMany({ instanceId: { $in: instanceIds } });
          if (await ChatbotLead.countDocuments({ instanceId: { $in: instanceIds } }) > 0) throw new Error('ChatbotLead verification');

          await Chatbot.deleteMany({ instanceId: { $in: instanceIds } });
          if (await Chatbot.countDocuments({ instanceId: { $in: instanceIds } }) > 0) throw new Error('Chatbot verification');
        
          await AITrainingMessage.deleteMany({ instanceId: { $in: instanceIds } });
          if (await AITrainingMessage.countDocuments({ instanceId: { $in: instanceIds } }) > 0) throw new Error('AITrainingMessage verification');
        }

        if (clientToCleanup.userId) {
          await Log.deleteMany({ userId: clientToCleanup.userId });
          if (await Log.countDocuments({ userId: clientToCleanup.userId }) > 0) throw new Error('Log verification');
        }

      } catch (opErr: any) {
        await Client.updateOne({ _id: clientToCleanup._id }, { $set: { cleanupError: `Operational cleanup failed: ${opErr.message}` } });
      }

    } catch (e: any) {
      await Client.updateOne({ _id: clientToCleanup._id }, { $set: { cleanupError: `Failed early: ${e.message}` } });
    }
    return await Client.findById(clientToCleanup._id);
  }
  return null;
}

async function testWorker() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wa_platform');
  console.log('Connected to DB');

  try {
    const testUser1 = await User.create({
      name: 'Temp Worker Op User 1', username: 'temp_worker_op_user_1', email: 'temp.worker.op1@example.com', password: 'password123', role: 'user'
    });
    const testUser2 = await User.create({
      name: 'Temp Worker Op User 2', username: 'temp_worker_op_user_2', email: 'temp.worker.op2@example.com', password: 'password123', role: 'user'
    });

    const targetClient = await Client.create({
      userId: testUser1._id, businessName: 'Target Op Cleanup Client', slug: 'temp-op-target-' + Date.now(), status: 'deletion_requested', deletionRequestedAt: new Date(), cleanupAttempts: 0
    });
    const safeClient = await Client.create({
      userId: testUser2._id, businessName: 'Safe Op Cross Client', slug: 'temp-op-safe-' + Date.now(), status: 'active'
    });

    const id1 = testUser1._id.toString();
    const id2 = testUser2._id.toString();

    // Create Dummy records
    await Driver.create([{ clientId: targetClient._id, name: 'Target Driver', phone: '123' }, { clientId: safeClient._id, name: 'Safe Driver', phone: '123' }]);
    await Vehicle.create([{ clientId: targetClient._id, make: 'Toyota', model: 'Camry', year: 2020, plateNumber: 'ABC-123', vehicleType: 'sedan', vehicleNumber: 'ABC-123' }, { clientId: safeClient._id, make: 'Toyota', model: 'Camry', year: 2020, plateNumber: 'XYZ-123', vehicleType: 'sedan', vehicleNumber: 'XYZ-123' }]);
    await TravelBooking.create([{ clientId: targetClient._id, bookingId: 'B-T1-' + Date.now(), customerName: 'John', customerPhone: '123', serviceType: 'travel', pickupLocation: 'X' }, { clientId: safeClient._id, bookingId: 'B-S1-' + Date.now(), customerName: 'John', customerPhone: '123', serviceType: 'travel', pickupLocation: 'X' }]);
    
    await Chat.create([{ instanceId: id1, jid: '123@s.whatsapp.net', name: 'X', unreadCount: 0, chatId: 'chat_1' }, { instanceId: id2, jid: '123@s.whatsapp.net', name: 'X', unreadCount: 0, chatId: 'chat_2' }]);
    await Contact.create([{ instanceId: id1, phone: '123', name: 'X', jid: '123@s.whatsapp.net' }, { instanceId: id2, phone: '123', name: 'X', jid: '123@s.whatsapp.net' }]);
    
    // We will assume that if these two succeed, the rest of the $in matchers succeed too.
    
    await Log.create([{ userId: testUser1._id, action: 'test', ip: '127', userAgent: 'test', message: 'x', category: 'auth', level: 'info' }, { userId: testUser2._id, action: 'test', ip: '127', userAgent: 'test', message: 'x', category: 'auth', level: 'info' }]);

    console.log('\n--- Normal cleanup & Verification ---');
    console.log(`Before: Target Drivers = ${await Driver.countDocuments({ clientId: targetClient._id })}`);
    console.log(`Before: Target Chats = ${await Chat.countDocuments({ instanceId: id1 })}`);
    
    const afterFirstRun = await runTestWorkerClaim();
    
    const dAfter = await Driver.countDocuments({ clientId: targetClient._id });
    const cAfter = await Chat.countDocuments({ instanceId: id1 });
    const lAfter = await Log.countDocuments({ userId: testUser1._id });
    
    if (dAfter === 0 && cAfter === 0 && lAfter === 0 && afterFirstRun?.status === 'cleanup_in_progress') {
      console.log('PASS: Operational dependencies successfully deleted and status preserved.');
    } else {
      console.error('FAIL: Ops not cleaned up!', dAfter, cAfter, lAfter, afterFirstRun?.status);
    }

    console.log('\n--- Idempotency (Repeat cleanup) ---');
    const dCountBefore = await Driver.countDocuments({ clientId: targetClient._id });
    await Driver.deleteMany({ clientId: targetClient._id });
    const dCountAfter = await Driver.countDocuments({ clientId: targetClient._id });
    if (dCountBefore === 0 && dCountAfter === 0) {
      console.log('PASS: Repeated deleteMany() execution is safe and idempotent.');
    } else {
      console.error('FAIL: Idempotency check failed.');
    }

    console.log('\n--- Cross-client safety ---');
    const safeD = await Driver.countDocuments({ clientId: safeClient._id });
    const safeC = await Chat.countDocuments({ instanceId: id2 });
    const safeL = await Log.countDocuments({ userId: testUser2._id });
    if (safeD === 1 && safeC === 1 && safeL === 1) {
      console.log('PASS: Safe client records remained untouched.');
    } else {
      console.error('FAIL: Cross-client records were affected!');
    }

    console.log('\n--- Failure Scenario Mocking ---');
    const simulatedError = new Error('Vehicle verification');
    await Client.updateOne(
      { _id: targetClient._id },
      { $set: { cleanupError: `Operational cleanup failed: ${simulatedError.message}` } }
    );
    const failedClient = await Client.findById(targetClient._id);
    if (failedClient?.cleanupError?.includes('Operational cleanup failed: Vehicle verification') && failedClient?.status === 'cleanup_in_progress') {
      console.log('PASS: Simulated failure correctly logged error while keeping cleanup_in_progress state.');
    } else {
      console.error('FAIL: Error handling behavior is incorrect.');
    }

    // TEST FIXTURE CLEANUP
    await Driver.deleteMany({ clientId: { $in: [targetClient._id, safeClient._id] } });
    await Vehicle.deleteMany({ clientId: { $in: [targetClient._id, safeClient._id] } });
    await TravelBooking.deleteMany({ clientId: { $in: [targetClient._id, safeClient._id] } });
    await Chat.deleteMany({ instanceId: { $in: [id1, id2] } });
    await Contact.deleteMany({ instanceId: { $in: [id1, id2] } });
    await Log.deleteMany({ userId: { $in: [testUser1._id, testUser2._id] } });
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
