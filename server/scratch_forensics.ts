import mongoose from 'mongoose';
import { Client } from './src/models/Client';
import { TemplatePack } from './src/models/TemplatePack';
import { NotificationTemplate } from './src/models/NotificationTemplate';
import { WhatsAppAccount } from './src/models/WhatsAppAccount';
import { WhatsAppInstance } from './src/models/WhatsAppInstance';
import ClientTemplate from './src/models/ClientTemplate';
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
import fs from 'fs';
import path from 'path';

async function runAudit() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wa_platform');
  const report: any = { orphansWA: [], overlap: {}, waSessionStatus: {}, instanceScopes: {}, orphanNT: null, dependenciesNT: {}, missingPackAnalysis: {} };

  const was = await WhatsAppAccount.find({});
  let clientOrphanIds = new Set<string>();
  let instanceOrphanIds = new Set<string>();

  for (const wa of was) {
    const hasClient = !!await Client.findById(wa.clientId);
    const hasInstance = !!await WhatsAppInstance.findById(wa.instanceId);

    if (!hasClient) clientOrphanIds.add(wa._id.toString());
    if (!hasInstance) instanceOrphanIds.add(wa._id.toString());

    if (!hasClient || !hasInstance) {
      report.orphansWA.push({
        _id: wa._id,
        clientId: wa.clientId,
        instanceId: wa.instanceId,
        status: wa.status,
        phoneNumber: wa.phoneNumber,
        createdAt: wa.createdAt,
        updatedAt: wa.updatedAt,
        hasClient,
        hasInstance,
      });

      // Session Directory Forensics (Step 4)
      if (wa.instanceId) {
          const sessionPath = path.join(process.cwd(), 'wa-sessions', wa.instanceId.toString());
          const exists = fs.existsSync(sessionPath);
          let notEmpty = false;
          if (exists) {
              const files = fs.readdirSync(sessionPath);
              notEmpty = files.length > 0;
          }
          report.waSessionStatus[wa.instanceId.toString()] = { sessionPath, exists, notEmpty };

          // DB references (Step 6)
          report.instanceScopes[wa.instanceId.toString()] = {
            Chat: await Chat.countDocuments({ instanceId: wa.instanceId }),
            Contact: await Contact.countDocuments({ instanceId: wa.instanceId }),
            Message: await Message.countDocuments({ instanceId: wa.instanceId }),
            Reminder: await Reminder.countDocuments({ instanceId: wa.instanceId }),
            Campaign: await Campaign.countDocuments({ instanceId: wa.instanceId }),
            CampaignLog: await CampaignLog.countDocuments({ instanceId: wa.instanceId }),
            Chatbot: await Chatbot.countDocuments({ instanceId: wa.instanceId }),
            ChatbotKnowledge: await ChatbotKnowledge.countDocuments({ instanceId: wa.instanceId }),
            ChatbotLead: await ChatbotLead.countDocuments({ instanceId: wa.instanceId }),
            AITrainingMessage: await AITrainingMessage.countDocuments({ instanceId: wa.instanceId })
          };
      }
    }
  }

  // Overlap Analysis (Step 3)
  report.overlap = {
      clientOnly: 0,
      instanceOnly: 0,
      both: 0
  };
  for (const o of report.orphansWA) {
      if (!o.hasClient && o.hasInstance) report.overlap.clientOnly++;
      if (o.hasClient && !o.hasInstance) report.overlap.instanceOnly++;
      if (!o.hasClient && !o.hasInstance) report.overlap.both++;
  }

  // Step 8 & 9: NotificationTemplate Orphan
  const allNTs = await NotificationTemplate.find({});
  for (const nt of allNTs) {
    if (!await TemplatePack.findById(nt.templatePackId)) {
      report.orphanNT = {
        _id: nt._id,
        slug: nt.slug,
        event: nt.event,
        active: nt.active,
        templatePackId: nt.templatePackId,
        hasPack: false
      };
      
      report.dependenciesNT.clientTemplates = await ClientTemplate.countDocuments({ templateId: nt._id });
      // Note: No other models reference NotificationTemplate dynamically in our current knowledge.
    }
  }

  // Step 10: Master Data History
  if (report.orphanNT) {
     const pId = report.orphanNT.templatePackId;
     // Let's see if any other packs have similar properties or what category it was.
     // Since the pack is deleted, we can't find its category directly unless we check other NTs?
     // Actually, let's just see if ANY other NT references this pack.
     report.missingPackAnalysis.otherNTsUsingPack = await NotificationTemplate.countDocuments({ templatePackId: pId });
     report.missingPackAnalysis.clientTemplatesUsingPack = await ClientTemplate.countDocuments({ templatePackId: pId });
  }

  // Step 11: Current Master Baseline
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

  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

runAudit().catch(console.error);
