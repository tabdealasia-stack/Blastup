import mongoose from 'mongoose';
import { Client } from './src/models/Client';
import { User } from './src/models/User';
import { TemplatePack } from './src/models/TemplatePack';
import { NotificationTemplate } from './src/models/NotificationTemplate';
import { WhatsAppAccount } from './src/models/WhatsAppAccount';
import { WhatsAppInstance } from './src/models/WhatsAppInstance';
import ClientTemplate from './src/models/ClientTemplate';
import { ApiKey } from './src/models/ApiKey';
import { Session } from './src/models/Session';
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

async function runFinalAudit() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wa_platform');
  const report: any = {};

  // Step 1: Baseline
  report.baseline = {
    ClientCategory: await ClientCategory.countDocuments(),
    TemplatePack: await TemplatePack.countDocuments(),
    NotificationTemplate: await NotificationTemplate.countDocuments(),
    Client: await Client.countDocuments(),
    ClientTemplate: await ClientTemplate.countDocuments(),
    User: await User.countDocuments(),
    ApiKey: await ApiKey.countDocuments(),
    Session: await Session.countDocuments(),
    WhatsAppAccount: await WhatsAppAccount.countDocuments(),
    WhatsAppInstance: await WhatsAppInstance.countDocuments(),
    MessageLog: await MessageLog.countDocuments(),
    NotificationEventLog: await NotificationEventLog.countDocuments()
  };

  // Step 2: Category -> Pack -> Template Integrity
  report.categoryIntegrity = { exceptions: [] };
  const categories = await ClientCategory.find({});
  for (const cat of categories) {
    const packs = await TemplatePack.find({ categoryId: cat._id });
    if (packs.length !== 1) {
      report.categoryIntegrity.exceptions.push(`Category ${cat.slug} has ${packs.length} packs`);
      continue;
    }
    const pack = packs[0];
    const nts = await NotificationTemplate.find({ templatePackId: pack._id });
    const actives = nts.filter(nt => nt.active);
    
    // Check duplicates
    const eventMap = new Set();
    for (const nt of actives) {
      if (eventMap.has(nt.event)) {
         report.categoryIntegrity.exceptions.push(`Duplicate active event ${nt.event} in pack ${pack._id}`);
      }
      eventMap.add(nt.event);
    }
  }

  // Step 3: Notification Template Orphan Check
  report.orphans = {
     ntMissingPack: 0,
     packMissingCategory: 0,
     ctMissingClient: 0,
     ctMissingNT: 0,
     ctMissingPack: 0 // ClientTemplate doesn't have templatePackId
  };

  const allNTs = await NotificationTemplate.find({});
  for (const nt of allNTs) {
    if (!await TemplatePack.findById(nt.templatePackId)) report.orphans.ntMissingPack++;
  }

  const allPacks = await TemplatePack.find({});
  for (const p of allPacks) {
    if (!await ClientCategory.findById(p.categoryId)) report.orphans.packMissingCategory++;
  }

  const allCTs = await ClientTemplate.find({});
  for (const ct of allCTs) {
    if (!await Client.findById(ct.clientId)) report.orphans.ctMissingClient++;
    if (!await NotificationTemplate.findById(ct.templateId)) report.orphans.ctMissingNT++;
  }

  // Step 4: Client/User Integrity
  report.clientUserIntegrity = { exceptions: [], orphanUsers: [] };
  const clients = await Client.find({});
  const usedUserIds = new Set();
  for (const c of clients) {
    if (!c.userId) { report.clientUserIntegrity.exceptions.push(`Client ${c._id} missing userId`); continue; }
    const u = await User.findById(c.userId);
    if (!u) { report.clientUserIntegrity.exceptions.push(`Client ${c._id} missing User ${c.userId}`); }
    else {
       if (usedUserIds.has(u._id.toString())) {
          report.clientUserIntegrity.exceptions.push(`User ${u._id} claimed by multiple clients`);
       }
       usedUserIds.add(u._id.toString());
    }
  }
  const allUsers = await User.find({});
  for (const u of allUsers) {
    if (!usedUserIds.has(u._id.toString())) {
       report.clientUserIntegrity.orphanUsers.push(u._id.toString());
    }
  }

  // Step 5: API Key Integrity
  report.apiKeyIntegrity = { missingClient: 0, missingUser: 0, exceptions: [] };
  const allKeys = await ApiKey.find({});
  for (const k of allKeys) {
    if (!await Client.findById(k.clientId)) report.apiKeyIntegrity.missingClient++;
    if (k.userId && !await User.findById(k.userId)) report.apiKeyIntegrity.missingUser++;
    if (!k.keyPrefix) report.apiKeyIntegrity.exceptions.push(`ApiKey ${k._id} missing keyPrefix`);
    // Note: tokenHash check is implicit since there's no raw token field in schema.
  }

  // Step 6: Session Integrity
  report.sessionIntegrity = { missingUser: 0 };
  const allSessions = await Session.find({});
  for (const s of allSessions) {
    if (!await User.findById(s.userId)) report.sessionIntegrity.missingUser++;
  }

  // Step 7: WhatsApp Account Integrity
  report.waIntegrity = { normal: 0, historical: 0, unexpected: [] };
  const protectedWAs = ['6aa194e0eb2371537fff765f', '6aa7d531203f0834afc69f99', '6aa7f3f7203f0834afc6a0f6'];
  const allWAs = await WhatsAppAccount.find({});
  for (const wa of allWAs) {
    const isProtected = protectedWAs.includes(wa._id.toString());
    if (isProtected) {
       report.waIntegrity.historical++;
    } else {
       const hasC = !!await Client.findById(wa.clientId);
       const hasI = !!await WhatsAppInstance.findById(wa.instanceId);
       if (hasC && hasI) report.waIntegrity.normal++;
       else report.waIntegrity.unexpected.push(wa._id.toString());
    }
  }

  // Step 8: WhatsApp Instance Integrity
  report.wiIntegrity = { missingAccount: [] };
  const allWIs = await WhatsAppInstance.find({});
  for (const wi of allWIs) {
    const hasWA = !!await WhatsAppAccount.findOne({ instanceId: wi._id });
    if (!hasWA) report.wiIntegrity.missingAccount.push(wi._id.toString());
  }

  // Step 9: Historical Orphan Data Lineage
  report.historicalLineage = {
    'Tabdeal (6aa02cef98a9832c24726e6d)': {
      Chat: await Chat.countDocuments({ instanceId: '6aa02cef98a9832c24726e6d' }),
      Contact: await Contact.countDocuments({ instanceId: '6aa02cef98a9832c24726e6d' }),
      Message: await Message.countDocuments({ instanceId: '6aa02cef98a9832c24726e6d' }),
      Reminder: await Reminder.countDocuments({ instanceId: '6aa02cef98a9832c24726e6d' }),
      Campaign: await Campaign.countDocuments({ instanceId: '6aa02cef98a9832c24726e6d' }),
      CampaignLog: await CampaignLog.countDocuments({ instanceId: '6aa02cef98a9832c24726e6d' }),
      Chatbot: await Chatbot.countDocuments({ instanceId: '6aa02cef98a9832c24726e6d' }),
      ChatbotKnowledge: await ChatbotKnowledge.countDocuments({ instanceId: '6aa02cef98a9832c24726e6d' }),
      ChatbotLead: await ChatbotLead.countDocuments({ instanceId: '6aa02cef98a9832c24726e6d' }),
      AITrainingMessage: await AITrainingMessage.countDocuments({ instanceId: '6aa02cef98a9832c24726e6d' })
    },
    'Restaurant (6aa44c3398b20b15a2dbf51e)': {
      Chat: await Chat.countDocuments({ instanceId: '6aa44c3398b20b15a2dbf51e' }),
      Contact: await Contact.countDocuments({ instanceId: '6aa44c3398b20b15a2dbf51e' }),
      Message: await Message.countDocuments({ instanceId: '6aa44c3398b20b15a2dbf51e' })
    },
    'Divine Tours (6aa7f3f6619788a48aea26ca)': {
      Chat: await Chat.countDocuments({ instanceId: '6aa7f3f6619788a48aea26ca' }),
      Contact: await Contact.countDocuments({ instanceId: '6aa7f3f6619788a48aea26ca' }),
      Message: await Message.countDocuments({ instanceId: '6aa7f3f6619788a48aea26ca' })
    }
  };

  // Step 10: Client Lifecycle Integrity
  report.lifecycle = {
    deletionRequested: await Client.countDocuments({ status: 'deletion_requested' }),
    cleanupInProgress: await Client.countDocuments({ status: 'cleanup_in_progress' }),
    cleanupFailed: await Client.countDocuments({ status: 'cleanup_failed' }),
    staleLock: await Client.countDocuments({ cleanupLockedAt: { $lt: new Date(Date.now() - 15 * 60000) } })
  };

  // Step 11: Retained Log Integrity
  report.retainedLogs = {
    MessageLogTotal: await MessageLog.countDocuments(),
    MessageLogOrphans: 0,
    NotificationEventLogTotal: await NotificationEventLog.countDocuments(),
    NotificationEventLogOrphans: 0
  };
  
  const mLogs = await MessageLog.find({});
  for (const m of mLogs) {
    if (m.clientId && !await Client.findById(m.clientId)) report.retainedLogs.MessageLogOrphans++;
  }
  const nLogs = await NotificationEventLog.find({});
  for (const n of nLogs) {
    if (n.clientId && !await Client.findById(n.clientId)) report.retainedLogs.NotificationEventLogOrphans++;
  }

  // Step 12: Database Index Audit (Using Model.listIndexes() if available)
  report.indexes = {};
  const models = [Client, User, ClientTemplate, NotificationTemplate, TemplatePack, WhatsAppAccount, WhatsAppInstance, ApiKey, Session, MessageLog, NotificationEventLog];
  for (const M of models) {
     try {
       const idx = await M.listIndexes();
       report.indexes[M.modelName] = idx.length > 0 ? "PASS" : "WARN: NO INDEXES FOUND";
     } catch (e) {
       report.indexes[M.modelName] = "FAIL: COULD NOT READ INDEXES";
     }
  }

  // Step 13: Client Template Integrity
  report.clientTemplates = {
    Total: await ClientTemplate.countDocuments(),
    DivineTours: 0,
    Phase6Test: 0,
    Tabdeal: 0,
    TestRestaurant: 0,
    exceptions: []
  };

  for (const ct of allCTs) {
    const c = await Client.findById(ct.clientId);
    if (!c) { report.clientTemplates.exceptions.push(`CT ${ct._id} missing client`); continue; }
    if (c.slug === 'divine-tours') report.clientTemplates.DivineTours++;
    if (c.slug === 'tabdeal-phase6-events-test') report.clientTemplates.Phase6Test++;
    if (c.slug === 'tabdeal') report.clientTemplates.Tabdeal++;
    if (c.slug === 'test-restaurant-01') report.clientTemplates.TestRestaurant++;
  }

  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

runFinalAudit().catch(console.error);
