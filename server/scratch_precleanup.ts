import mongoose from 'mongoose';
import { Client } from './src/models/Client';
import { TemplatePack } from './src/models/TemplatePack';
import { NotificationTemplate } from './src/models/NotificationTemplate';
import { WhatsAppAccount } from './src/models/WhatsAppAccount';
import { WhatsAppInstance } from './src/models/WhatsAppInstance';
import ClientTemplate from './src/models/ClientTemplate';
import { ApiKey } from './src/models/ApiKey';
import { Session } from './src/models/Session';
import { Driver } from './src/models/Driver';
import { Vehicle } from './src/models/Vehicle';
import { TravelBooking } from './src/models/TravelBooking';
import { Chat } from './src/models/Chat';
import { Contact } from './src/models/Contact';
import { Message } from './src/models/Message';
import { Reminder } from './src/models/Reminder';
import { Campaign } from './src/models/Campaign';
import { CampaignLog } from './src/models/CampaignLog';
import { Chatbot } from './src/models/Chatbot';
import { ChatbotKnowledge } from './src/models/ChatbotKnowledge';
import { ChatbotLead } from './src/models/ChatbotLead';
import { AITrainingMessage } from './src/models/AITrainingMessage';
import { ClientCategory } from './src/models/ClientCategory';
import { MessageLog } from './src/models/MessageLog';
import { NotificationEventLog } from './src/models/NotificationEventLog';
import { Log } from './src/models/Log';
import fs from 'fs';
import path from 'path';

async function runAudit() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wa_platform');
  const report: any = { 
    targetAccounts: [], 
    targetDependencies: {}, 
    targetClientDependencies: {}, 
    protectedAccounts: [], 
    sessionDirectories: {},
    orphanNT: null,
    missingPackAnalysis: {},
    baseline: {},
    retainedLogs: {}
  };

  const targetWAs = [
    '6aaa605d203f0834afc706da',
    '6aaa793774e9bef38e7c3f7b',
    '6aaa793774e9bef38e7c3f7d',
    '6aaa796173f8a601d380ab6b'
  ];

  const protectedWAs = [
    '6aa194e0eb2371537fff765f',
    '6aa7d531203f0834afc69f99',
    '6aa7f3f7203f0834afc6a0f6'
  ];

  // 1. Verify exact target WhatsApp accounts
  for (const id of targetWAs) {
    const wa = await WhatsAppAccount.findById(id);
    if (wa) {
      const hasClient = !!await Client.findById(wa.clientId);
      const hasInstance = !!await WhatsAppInstance.findById(wa.instanceId);
      report.targetAccounts.push({
        _id: wa._id.toString(),
        clientId: wa.clientId.toString(),
        instanceId: wa.instanceId?.toString(),
        status: wa.status,
        phoneNumber: wa.phoneNumber,
        createdAt: wa.createdAt,
        updatedAt: wa.updatedAt,
        hasClient,
        hasInstance
      });

      // 2. Verify instance-scoped dependencies
      if (wa.instanceId) {
        const iId = wa.instanceId.toString();
        report.targetDependencies[iId] = {
          Chat: await Chat.countDocuments({ instanceId: iId }),
          Contact: await Contact.countDocuments({ instanceId: iId }),
          Message: await Message.countDocuments({ instanceId: iId }),
          Reminder: await Reminder.countDocuments({ instanceId: iId }),
          Campaign: await Campaign.countDocuments({ instanceId: iId }),
          CampaignLog: await CampaignLog.countDocuments({ instanceId: iId }),
          Chatbot: await Chatbot.countDocuments({ instanceId: iId }),
          ChatbotKnowledge: await ChatbotKnowledge.countDocuments({ instanceId: iId }),
          ChatbotLead: await ChatbotLead.countDocuments({ instanceId: iId }),
          AITrainingMessage: await AITrainingMessage.countDocuments({ instanceId: iId })
        };

        // 5. Verify Session Directories
        const sessionPath = path.join(process.cwd(), 'wa-sessions', iId);
        const exists = fs.existsSync(sessionPath);
        let notEmpty = false;
        if (exists) {
            const files = fs.readdirSync(sessionPath);
            notEmpty = files.length > 0;
        }
        report.sessionDirectories[iId] = { sessionPath, exists, notEmpty };
      }

      // 3. Verify client-scoped dependencies
      const cId = wa.clientId.toString();
      const client = await Client.findById(cId);
      report.targetClientDependencies[cId] = {
        exists: !!client,
        dependencies: {}
      };
      
      if (client) {
        report.targetClientDependencies[cId].dependencies = {
          ClientTemplate: await ClientTemplate.countDocuments({ clientId: cId }),
          ApiKey: await ApiKey.countDocuments({ clientId: cId }),
          Session: await Session.countDocuments({ userId: client.userId }),
          WhatsAppAccount: await WhatsAppAccount.countDocuments({ clientId: cId }),
          WhatsAppInstance: await WhatsAppInstance.countDocuments({ clientId: cId }),
          Driver: await Driver.countDocuments({ clientId: cId }),
          Vehicle: await Vehicle.countDocuments({ clientId: cId }),
          TravelBooking: await TravelBooking.countDocuments({ clientId: cId }),
          Log: await Log.countDocuments({ userId: client.userId })
        };
      }
    }
  }

  // 4. Verify Protected Historical WhatsApp Accounts
  for (const id of protectedWAs) {
    const wa = await WhatsAppAccount.findById(id);
    if (wa) {
       const iId = wa.instanceId?.toString();
       report.protectedAccounts.push({
         _id: wa._id.toString(),
         clientId: wa.clientId.toString(),
         instanceId: iId,
         status: wa.status,
         Chat: iId ? await Chat.countDocuments({ instanceId: iId }) : 0,
         Contact: iId ? await Contact.countDocuments({ instanceId: iId }) : 0,
         Message: iId ? await Message.countDocuments({ instanceId: iId }) : 0
       });
    }
  }

  // 7. Verify Notification Template
  const nt = await NotificationTemplate.findById('6aaa72ff064b013409d28b61');
  if (nt) {
     const hasPack = !!await TemplatePack.findById(nt.templatePackId);
     report.orphanNT = {
       _id: nt._id.toString(),
       slug: nt.slug,
       event: nt.event,
       active: nt.active,
       templatePackId: nt.templatePackId.toString(),
       hasPack,
       clientTemplateReferences: await ClientTemplate.countDocuments({ templateId: nt._id })
     };
  }

  // 8. Verify Missing Template Pack
  const tp = await TemplatePack.findById('6aaa72ff064b013409d28b60');
  report.missingPackAnalysis = {
    exists: !!tp,
    notificationTemplatesRef: await NotificationTemplate.countDocuments({ templatePackId: '6aaa72ff064b013409d28b60' }),
    clientTemplatesRef: 0 // ClientTemplate doesn't reference TemplatePack directly
  };

  // 9. Verify Master Data Baseline
  report.baseline = {
    Categories: await ClientCategory.countDocuments(),
    TemplatePacks: await TemplatePack.countDocuments(),
    NotificationTemplates: await NotificationTemplate.countDocuments(),
  };

  const clinicCat = await ClientCategory.findOne({ slug: 'clinic-healthcare' });
  if (clinicCat) {
    const pack = await TemplatePack.findOne({ categoryId: clinicCat._id });
    if (pack) {
      report.baseline.ClinicActiveTemplates = await NotificationTemplate.countDocuments({ templatePackId: pack._id, active: true });
    }
  }
  
  const dtClient = await Client.findOne({ slug: 'divine-tours' });
  if (dtClient) {
    report.baseline.DivineToursClientTemplates = await ClientTemplate.countDocuments({ clientId: dtClient._id });
  }
  report.baseline.ClientTemplates = await ClientTemplate.countDocuments();

  // 10. Verify Retained Log Data
  const targetClientIds = [...new Set(report.targetAccounts.map((a:any) => a.clientId))];
  for (const _cid of targetClientIds) {
     const cid = String(_cid);
     report.retainedLogs[cid] = {
       MessageLog: await MessageLog.countDocuments({ clientId: cid }),
       NotificationEventLog: await NotificationEventLog.countDocuments({ clientId: cid })
     };
  }

  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

runAudit().catch(console.error);
