import { Client } from '../models/Client';
import ClientTemplate from '../models/ClientTemplate';
import { WhatsAppAccount } from '../models/WhatsAppAccount';
import { WhatsAppInstance } from '../models/WhatsAppInstance';
import { ApiKey } from '../models/ApiKey';
import { Session } from '../models/Session';
import { TravelBooking } from '../models/TravelBooking';
import { Vehicle } from '../models/Vehicle';
import { Driver } from '../models/Driver';
import { Chat } from '../models/Chat';
import { Contact } from '../models/Contact';
import { Message } from '../models/Message';
import { Reminder } from '../models/Reminder';
import { CampaignLog } from '../models/CampaignLog';
import { Campaign } from '../models/Campaign';
import { ChatbotKnowledge } from '../models/ChatbotKnowledge';
import { ChatbotLead } from '../models/ChatbotLead';
import { Chatbot } from '../models/Chatbot';
import { AITrainingMessage } from '../models/AITrainingMessage';
import { Log } from '../models/Log';
import { logger } from '../config/logger';

let intervalId: NodeJS.Timeout | null = null;

export function initClientCleanupWorker() {
  if (intervalId) return;

  logger.info('Initializing Client Cleanup background worker (runs every 60s)...');

  intervalId = setInterval(async () => {
    try {
      // 1. Attempt Stalled Lease Recovery (10-minute expiry)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      
      const recoveredClient = await Client.findOneAndUpdate(
        {
          status: 'cleanup_in_progress',
          cleanupLockedAt: { $lte: tenMinutesAgo } // Note: Ignores null values automatically
        },
        {
          $set: {
            status: 'deletion_requested',
            cleanupLockedAt: null
          }
          // Do NOT increment cleanupAttempts here. 
          // Do NOT overwrite cleanupError.
        },
        {
          new: true,
          sort: {
            cleanupLockedAt: 1
          }
        }
      );

      if (recoveredClient) {
        logger.warn(`Client lifecycle cleanup worker recovered stalled client ${recoveredClient._id}`);
      }

      // 2. Atomically claim one client that needs deletion
      const clientToCleanup = await Client.findOneAndUpdate(
        {
          status: 'deletion_requested'
        },
        {
          $set: {
            status: 'cleanup_in_progress',
            cleanupLockedAt: new Date()
          },
          $inc: {
            cleanupAttempts: 1
          }
        },
        {
          new: true,
          sort: {
            deletionRequestedAt: 1
          }
        }
      );

      if (clientToCleanup) {
        logger.info(`Client lifecycle cleanup worker claimed client ${clientToCleanup._id}`);
        
        // 3. Cleanup ClientTemplates
        try {
          await ClientTemplate.deleteMany({ clientId: clientToCleanup._id });
          
          const remainingTemplates = await ClientTemplate.countDocuments({ clientId: clientToCleanup._id });
          if (remainingTemplates > 0) {
            throw new Error(`Verification failed: ${remainingTemplates} ClientTemplates remain`);
          }

          logger.info(`Successfully cleaned up ClientTemplates for client ${clientToCleanup._id}`);
          
          // 4. Cleanup WhatsAppAccount and WhatsAppInstance
          try {
            // Find accounts first to extract instanceIds for WhatsAppInstance deletion
            const accounts = await WhatsAppAccount.find({ clientId: clientToCleanup._id });
            const instanceIds = accounts.map(acc => acc.instanceId);
            
            // Fallback: in this architecture instanceId typically maps to userId
            if (clientToCleanup.userId && !instanceIds.includes(clientToCleanup.userId.toString())) {
              instanceIds.push(clientToCleanup.userId.toString());
            }

            // A. Cleanup WhatsAppAccount
            await WhatsAppAccount.deleteMany({ clientId: clientToCleanup._id });
            const remainingAccounts = await WhatsAppAccount.countDocuments({ clientId: clientToCleanup._id });
            if (remainingAccounts > 0) {
              throw new Error(`Verification failed: ${remainingAccounts} WhatsAppAccounts remain`);
            }
            logger.info(`Successfully cleaned up WhatsAppAccounts for client ${clientToCleanup._id}`);

            // B. Cleanup WhatsAppInstance
            if (instanceIds.length > 0) {
              await WhatsAppInstance.deleteMany({ instanceId: { $in: instanceIds } });
              const remainingInstances = await WhatsAppInstance.countDocuments({ instanceId: { $in: instanceIds } });
              if (remainingInstances > 0) {
                throw new Error(`Verification failed: ${remainingInstances} WhatsAppInstances remain`);
              }
              logger.info(`Successfully cleaned up WhatsAppInstances for client ${clientToCleanup._id}`);
            }

            // 5. Cleanup ApiKey
            try {
              await ApiKey.deleteMany({ clientId: clientToCleanup._id });
              const remainingApiKeys = await ApiKey.countDocuments({ clientId: clientToCleanup._id });
              if (remainingApiKeys > 0) {
                throw new Error(`Verification failed: ${remainingApiKeys} ApiKeys remain`);
              }
              logger.info(`Successfully cleaned up ApiKeys for client ${clientToCleanup._id}`);

              // 6. Cleanup Session
              try {
                if (clientToCleanup.userId) {
                  await Session.deleteMany({ userId: clientToCleanup.userId });
                  const remainingSessions = await Session.countDocuments({ userId: clientToCleanup.userId });
                  if (remainingSessions > 0) {
                    throw new Error(`Verification failed: ${remainingSessions} Sessions remain`);
                  }
                  logger.info(`Successfully cleaned up Sessions for client ${clientToCleanup._id}`);
                  
                  // 7. Cleanup Operational Dependencies
                  try {
                    // GROUP A - Fleet / Travel
                    await TravelBooking.deleteMany({ clientId: clientToCleanup._id });
                    if (await TravelBooking.countDocuments({ clientId: clientToCleanup._id }) > 0) throw new Error('TravelBooking verification');

                    await Vehicle.deleteMany({ clientId: clientToCleanup._id });
                    if (await Vehicle.countDocuments({ clientId: clientToCleanup._id }) > 0) throw new Error('Vehicle verification');

                    await Driver.deleteMany({ clientId: clientToCleanup._id });
                    if (await Driver.countDocuments({ clientId: clientToCleanup._id }) > 0) throw new Error('Driver verification');

                    // GROUP B - Communications
                    if (instanceIds.length > 0) {
                      await Chat.deleteMany({ instanceId: { $in: instanceIds } });
                      if (await Chat.countDocuments({ instanceId: { $in: instanceIds } }) > 0) throw new Error('Chat verification');

                      await Contact.deleteMany({ instanceId: { $in: instanceIds } });
                      if (await Contact.countDocuments({ instanceId: { $in: instanceIds } }) > 0) throw new Error('Contact verification');

                      await Message.deleteMany({ instanceId: { $in: instanceIds } });
                      if (await Message.countDocuments({ instanceId: { $in: instanceIds } }) > 0) throw new Error('Message verification');

                      await Reminder.deleteMany({ instanceId: { $in: instanceIds } });
                      if (await Reminder.countDocuments({ instanceId: { $in: instanceIds } }) > 0) throw new Error('Reminder verification');
                    }

                    // GROUP C - Marketing
                    if (instanceIds.length > 0) {
                      await CampaignLog.deleteMany({ instanceId: { $in: instanceIds } });
                      if (await CampaignLog.countDocuments({ instanceId: { $in: instanceIds } }) > 0) throw new Error('CampaignLog verification');

                      await Campaign.deleteMany({ instanceId: { $in: instanceIds } });
                      if (await Campaign.countDocuments({ instanceId: { $in: instanceIds } }) > 0) throw new Error('Campaign verification');
                    }

                    // GROUP D - Chatbot
                    if (instanceIds.length > 0) {
                      await ChatbotKnowledge.deleteMany({ instanceId: { $in: instanceIds } });
                      if (await ChatbotKnowledge.countDocuments({ instanceId: { $in: instanceIds } }) > 0) throw new Error('ChatbotKnowledge verification');

                      await ChatbotLead.deleteMany({ instanceId: { $in: instanceIds } });
                      if (await ChatbotLead.countDocuments({ instanceId: { $in: instanceIds } }) > 0) throw new Error('ChatbotLead verification');

                      await Chatbot.deleteMany({ instanceId: { $in: instanceIds } });
                      if (await Chatbot.countDocuments({ instanceId: { $in: instanceIds } }) > 0) throw new Error('Chatbot verification');
                    }

                    // GROUP E - AI / Audit
                    if (instanceIds.length > 0) {
                      await AITrainingMessage.deleteMany({ instanceId: { $in: instanceIds } });
                      if (await AITrainingMessage.countDocuments({ instanceId: { $in: instanceIds } }) > 0) throw new Error('AITrainingMessage verification');
                    }

                    if (clientToCleanup.userId) {
                      await Log.deleteMany({ userId: clientToCleanup.userId });
                      if (await Log.countDocuments({ userId: clientToCleanup.userId }) > 0) throw new Error('Log verification');
                    }

                    logger.info(`Successfully cleaned up Operational dependencies for client ${clientToCleanup._id}`);

                    // 8. FINAL DEPENDENCY VERIFICATION
                    let totalDependencies = 0;
                    totalDependencies += await ClientTemplate.countDocuments({ clientId: clientToCleanup._id });
                    totalDependencies += await WhatsAppAccount.countDocuments({ clientId: clientToCleanup._id });
                    if (instanceIds.length > 0) {
                      totalDependencies += await WhatsAppInstance.countDocuments({ instanceId: { $in: instanceIds } });
                    }
                    totalDependencies += await ApiKey.countDocuments({ clientId: clientToCleanup._id });
                    if (clientToCleanup.userId) {
                      totalDependencies += await Session.countDocuments({ userId: clientToCleanup.userId });
                    }
                    totalDependencies += await TravelBooking.countDocuments({ clientId: clientToCleanup._id });
                    totalDependencies += await Vehicle.countDocuments({ clientId: clientToCleanup._id });
                    totalDependencies += await Driver.countDocuments({ clientId: clientToCleanup._id });
                    if (instanceIds.length > 0) {
                      totalDependencies += await Chat.countDocuments({ instanceId: { $in: instanceIds } });
                      totalDependencies += await Contact.countDocuments({ instanceId: { $in: instanceIds } });
                      totalDependencies += await Message.countDocuments({ instanceId: { $in: instanceIds } });
                      totalDependencies += await Reminder.countDocuments({ instanceId: { $in: instanceIds } });
                      totalDependencies += await CampaignLog.countDocuments({ instanceId: { $in: instanceIds } });
                      totalDependencies += await Campaign.countDocuments({ instanceId: { $in: instanceIds } });
                      totalDependencies += await ChatbotKnowledge.countDocuments({ instanceId: { $in: instanceIds } });
                      totalDependencies += await ChatbotLead.countDocuments({ instanceId: { $in: instanceIds } });
                      totalDependencies += await Chatbot.countDocuments({ instanceId: { $in: instanceIds } });
                      totalDependencies += await AITrainingMessage.countDocuments({ instanceId: { $in: instanceIds } });
                    }
                    if (clientToCleanup.userId) {
                      totalDependencies += await Log.countDocuments({ userId: clientToCleanup.userId });
                    }

                    if (totalDependencies > 0) {
                      throw new Error(`Final dependency verification failed: ${totalDependencies} remaining records`);
                    }

                    // 9. Protect Shared/System Users
                    const mongoose = require('mongoose');
                    const User = mongoose.model('User');
                    if (!clientToCleanup.userId) {
                      throw new Error('Final verification failed: Client has no userId');
                    }
                    const user = await User.findById(clientToCleanup.userId);
                    
                    // 10. Root Deletion (USER FIRST)
                    // Check lease ownership
                    const finalClientCheck = await Client.findOne({ 
                      _id: clientToCleanup._id, 
                      status: 'cleanup_in_progress', 
                      cleanupLockedAt: clientToCleanup.cleanupLockedAt 
                    });
                    
                    if (!finalClientCheck) {
                      throw new Error('Final verification failed: Lost cleanup lease');
                    }
                    
                    if (user) {
                      // For safety, assume Tabdeal or system user might be shared.
                      if (user.role === 'admin' || user.email === 'admin@tabdeal.in' || user.username === 'tabdeal_admin') {
                         throw new Error('Final verification failed: User appears to be a shared system admin');
                      }
                      
                      await User.deleteOne({ _id: clientToCleanup.userId });
                      const userCheck = await User.findById(clientToCleanup.userId);
                      if (userCheck) {
                        throw new Error('User still exists after User.deleteOne');
                      }
                    }

                    // Log retained data counts for audit
                    const retainedMessageLogs = await mongoose.model('MessageLog').countDocuments({ clientId: clientToCleanup._id });
                    const retainedEventLogs = await mongoose.model('NotificationEventLog').countDocuments({ clientId: clientToCleanup._id });
                    logger.info(`Retained audit logs for client ${clientToCleanup._id} - MessageLogs: ${retainedMessageLogs}, EventLogs: ${retainedEventLogs}`);

                    // Proceed with root deletion
                    await Client.deleteOne({ _id: clientToCleanup._id });
                    const clientCheck = await Client.findById(clientToCleanup._id);
                    if (clientCheck) {
                      throw new Error('Root deletion failed: Client still exists');
                    }

                    logger.info(`Successfully deleted root Client and User for ${clientToCleanup._id}`);

                  } catch (opErr: any) {
                    logger.error(`Failed to cleanup Operational dependencies for client ${clientToCleanup._id}`, opErr);
                    await Client.updateOne(
                      { _id: clientToCleanup._id },
                      { $set: { cleanupError: `Operational cleanup failed: ${opErr.message}` } }
                    );
                  }
                }
              } catch (sessionErr: any) {
                logger.error(`Failed to cleanup Sessions for client ${clientToCleanup._id}`, sessionErr);
                await Client.updateOne(
                  { _id: clientToCleanup._id },
                  { $set: { cleanupError: `Session cleanup failed: ${sessionErr.message}` } }
                );
              }

            } catch (apiKeyErr: any) {
              logger.error(`Failed to cleanup ApiKeys for client ${clientToCleanup._id}`, apiKeyErr);
              await Client.updateOne(
                { _id: clientToCleanup._id },
                { $set: { cleanupError: `ApiKey cleanup failed: ${apiKeyErr.message}` } }
              );
            }

          } catch (waErr: any) {
            logger.error(`Failed to cleanup WhatsApp records for client ${clientToCleanup._id}`, waErr);
            await Client.updateOne(
              { _id: clientToCleanup._id },
              { $set: { cleanupError: `WhatsApp cleanup failed: ${waErr.message}` } }
            );
          }

        } catch (cleanupErr: any) {
          logger.error(`Failed to cleanup ClientTemplates for client ${clientToCleanup._id}`, cleanupErr);
          
          // Record error but keep status as cleanup_in_progress
          await Client.updateOne(
            { _id: clientToCleanup._id },
            { $set: { cleanupError: `ClientTemplate cleanup failed: ${cleanupErr.message}` } }
          );
        }
      }
    } catch (err) {
      logger.error('Client Cleanup Worker encountered a database error', err);
    }
  }, 60000);
}

export function stopClientCleanupWorker() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('Client Cleanup background worker stopped.');
  }
}
