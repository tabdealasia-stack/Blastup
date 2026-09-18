import mongoose from 'mongoose';
import Boom from '@hapi/boom';
import { Client } from '../../models/Client';
import { User } from '../../models/User';
import ClientTemplate from '../../models/ClientTemplate';
import { ApiKey } from '../../models/ApiKey';
import { WhatsAppAccount } from '../../models/WhatsAppAccount';
import { WhatsAppInstance } from '../../models/WhatsAppInstance';
import { Session } from '../../models/Session';
import { MessageLog } from '../../models/MessageLog';
import { NotificationEventLog } from '../../models/NotificationEventLog';
import { Driver } from '../../models/Driver';
import { Vehicle } from '../../models/Vehicle';
import { TravelBooking } from '../../models/TravelBooking';
import { Chat } from '../../models/Chat';
import { Contact } from '../../models/Contact';
import { Message } from '../../models/Message';
import { Reminder } from '../../models/Reminder';
import { Campaign } from '../../models/Campaign';
import { CampaignLog } from '../../models/CampaignLog';
import { Chatbot } from '../../models/Chatbot';
import { ChatbotKnowledge } from '../../models/ChatbotKnowledge';
import { ChatbotLead } from '../../models/ChatbotLead';
import { AITrainingMessage } from '../../models/AITrainingMessage';
import { Log } from '../../models/Log';
import { disconnectWhatsApp, getSocket } from './../../services/whatsapp.service';

/**
 * Generates a dependency report for a given client.
 * Does not return sensitive data, only counts.
 */
export async function getClientDependencyReport(clientId: string) {
  const client = await Client.findById(clientId);
  if (!client) {
    throw Boom.notFound('Client not found');
  }

  const cId = client._id;
  const uId = client.userId;
  const iId = uId.toString();

  return {
    clientId: cId.toString(),
    userId: iId,
    businessName: client.businessName,
    status: client.status,
    dependencies: {
      Client: 1,
      User: await User.countDocuments({ _id: uId }),
      ClientTemplate: await ClientTemplate.countDocuments({ clientId: cId }),
      ApiKey: await ApiKey.countDocuments({ clientId: cId }),
      WhatsAppAccount: await WhatsAppAccount.countDocuments({ clientId: cId }),
      WhatsAppInstance: await WhatsAppInstance.countDocuments({ instanceId: iId }),
      Session: await Session.countDocuments({ userId: uId }),
      
      // Client-owned specific records
      Driver: await Driver.countDocuments({ clientId: cId }),
      Vehicle: await Vehicle.countDocuments({ clientId: cId }),
      TravelBooking: await TravelBooking.countDocuments({ clientId: cId }),
      
      // Operational records (instanceId)
      Chat: await Chat.countDocuments({ instanceId: iId }),
      Contact: await Contact.countDocuments({ instanceId: iId }),
      Message: await Message.countDocuments({ instanceId: iId }),
      Reminder: await Reminder.countDocuments({ instanceId: iId }),
      Campaign: await Campaign.countDocuments({ instanceId: iId }),
      CampaignLog: await CampaignLog.countDocuments({ instanceId: iId }),
      Chatbot: await Chatbot.countDocuments({ instanceId: iId }),
      ChatbotKnowledge: await ChatbotKnowledge.countDocuments({ instanceId: iId }),
      ChatbotLead: await ChatbotLead.countDocuments({ instanceId: iId }),
      AITrainingMessage: await AITrainingMessage.countDocuments({ instanceId: iId }),
      Log: await Log.countDocuments({ userId: iId }),

      // Retention-policy undefined audit records
      MessageLog: await MessageLog.countDocuments({ clientId: cId }),
      NotificationEventLog: await NotificationEventLog.countDocuments({ clientId: cId }),
    }
  };
}

export async function disconnectClientWhatsApp(clientId: string) {
  const client = await Client.findById(clientId);
  if (!client) {
    throw Boom.notFound('Client not found');
  }

  const instanceId = client.userId.toString();
  await disconnectWhatsApp(instanceId);
  return { success: true, message: 'WhatsApp disconnected successfully.' };
}

export async function suspendClient(clientId: string) {
  const client = await Client.findById(clientId);
  if (!client) {
    throw Boom.notFound('Client not found');
  }

  client.status = 'suspended';
  await client.save();

  await User.updateOne({ _id: client.userId }, { isActive: false });
  await Session.updateMany({ userId: client.userId }, { isRevoked: true });
  await ApiKey.updateMany({ clientId: client._id }, { status: 'revoked' });

  const instanceId = client.userId.toString();
  await disconnectWhatsApp(instanceId);

  return { success: true, message: 'Client suspended and disconnected successfully.' };
}

export async function requestClientDeletion(clientId: string, superadminUserId: string) {
  // 1. Atomic state transition
  const client = await Client.findOneAndUpdate(
    {
      _id: clientId,
      status: { $in: ['active', 'suspended'] },
    },
    {
      $set: {
        status: 'deletion_requested',
        deletionRequestedAt: new Date(),
        deletionRequestedBy: new mongoose.Types.ObjectId(superadminUserId),
        cleanupLockedAt: null,
        cleanupAttempts: 0,
        cleanupError: null,
      },
    },
    { new: true }
  );

  if (!client) {
    // Determine the failure reason safely
    const existingClient = await Client.findById(clientId);
    if (!existingClient) {
      throw Boom.notFound('Client not found');
    }
    if (['deletion_requested', 'cleanup_in_progress', 'cleanup_failed'].includes(existingClient.status)) {
      throw Boom.conflict('Client is already in the deletion lifecycle.');
    }
    throw Boom.badRequest(`Cannot request deletion for a client with status: ${existingClient.status}`);
  }

  const uId = client.userId;
  const instanceId = uId.toString();

  // 2. Access Revocation (Independent execution)
  const revocationErrors: string[] = [];

  try {
    await User.updateOne({ _id: uId }, { isActive: false });
  } catch (err: any) {
    revocationErrors.push(`User revocation failed: ${err.message}`);
  }

  try {
    await Session.updateMany({ userId: uId }, { isRevoked: true });
  } catch (err: any) {
    revocationErrors.push(`Session revocation failed: ${err.message}`);
  }

  try {
    await ApiKey.updateMany({ clientId: client._id }, { status: 'revoked' });
  } catch (err: any) {
    revocationErrors.push(`ApiKey revocation failed: ${err.message}`);
  }

  // 3. WhatsApp Disconnect
  try {
    await disconnectWhatsApp(instanceId);
  } catch (err: any) {
    revocationErrors.push(`WhatsApp Disconnect Error: ${err.message}`);
  }

  // 4. Record any errors
  if (revocationErrors.length > 0) {
    try {
      await Client.updateOne(
        { _id: client._id },
        { $set: { cleanupError: revocationErrors.join(' | ') } }
      );
    } catch (dbErr: any) {
      // If we fail to write the cleanup error, the client is still locked as 'deletion_requested'.
      // We log locally but do not fail the request, as the primary objective succeeded.
      console.error(`Failed to write cleanupError for client ${client._id}:`, dbErr);
    }
    return { 
      success: true, 
      message: 'Client deletion requested, but some access revocation steps failed. Cleanup is pending retry.',
      revocationWarning: true
    };
  }

  return { success: true, message: 'Client deletion requested successfully. Access revoked.' };
}

export async function deleteClient(clientId: string) {
  const client = await Client.findById(clientId);
  if (!client) {
    throw Boom.notFound('Client not found');
  }

  // Safety Checks
  if (client.businessName.toLowerCase().includes('divine tours')) {
    throw Boom.forbidden('Cannot delete Divine Tours master client.');
  }

  const cId = client._id;
  const uId = client.userId;
  const iId = uId.toString();

  // 1. WhatsApp Lifecycle
  await disconnectWhatsApp(iId);

  // 2. Delete WhatsApp infra
  await WhatsAppAccount.deleteMany({ clientId: cId });
  await WhatsAppInstance.deleteMany({ instanceId: iId });

  // 3. Auth
  await ApiKey.deleteMany({ clientId: cId });
  await Session.deleteMany({ userId: uId });

  // 4. Assignments
  await ClientTemplate.deleteMany({ clientId: cId });

  // 5. Client specific operational
  await Driver.deleteMany({ clientId: cId });
  await Vehicle.deleteMany({ clientId: cId });
  await TravelBooking.deleteMany({ clientId: cId });

  // 6. Instance operational
  await Chat.deleteMany({ instanceId: iId });
  await Contact.deleteMany({ instanceId: iId });
  await Message.deleteMany({ instanceId: iId });
  await Reminder.deleteMany({ instanceId: iId });
  await Campaign.deleteMany({ instanceId: iId });
  await CampaignLog.deleteMany({ instanceId: iId });
  await Chatbot.deleteMany({ instanceId: iId });
  await ChatbotKnowledge.deleteMany({ instanceId: iId });
  await ChatbotLead.deleteMany({ instanceId: iId });
  await AITrainingMessage.deleteMany({ instanceId: iId });
  await Log.deleteMany({ userId: iId });

  // 7. Undefined policy records - wait for explicit business rule, but we leave them or delete them?
  // User instructions say: "DO NOT delete MessageLog or NotificationEventLog automatically."
  // Wait, the prompt says "do not delete them automatically. The lifecycle service must classify them as REQUIRES RETENTION POLICY unless codebase proves..."
  // For the actual `deleteClient` implementation, I will NOT delete them.
  // No-op for MessageLog and NotificationEventLog.

  // 8. Delete Root
  await Client.deleteOne({ _id: cId });
  await User.deleteOne({ _id: uId });

  return { success: true, message: 'Client deleted successfully. Retention policy logs retained.' };
}
