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

async function runCleanup() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wa_platform');
  const report: any = {
    preconditions: { passed: true, errors: [] },
    deletions: [],
    immediateVerify: {},
    protectedVerify: {},
    historicalDataVerify: {},
    baselineBefore: {},
    baselineAfter: {},
    phase6Verify: {},
    retainedLogVerify: {},
    mutationCounters: {
      Client: 0,
      User: 0,
      WhatsAppAccount: 0,
      WhatsAppInstance: 0,
      NotificationTemplate: 0,
      TemplatePack: 0,
      ClientCategory: 0,
      ClientTemplate: 0,
      ApiKey: 0,
      Chat: 0,
      Contact: 0,
      Message: 0,
      Reminder: 0,
      Campaign: 0,
      CampaignLog: 0,
      Chatbot: 0,
      ChatbotKnowledge: 0,
      ChatbotLead: 0,
      AITrainingMessage: 0,
      MessageLog: 0,
      NotificationEventLog: 0
    }
  };

  const targetWAs = [
    { _id: '6aaa605d203f0834afc706da', clientId: '6aaa605d8063a7973bc40300', instanceId: '6aaa605d8063a7973bc402f6' },
    { _id: '6aaa793774e9bef38e7c3f7b', clientId: '6aaa793774e9bef38e7c3f77', instanceId: '6aaa793674e9bef38e7c3f63' },
    { _id: '6aaa793774e9bef38e7c3f7d', clientId: '6aaa793774e9bef38e7c3f79', instanceId: '6aaa793674e9bef38e7c3f6d' },
    { _id: '6aaa796173f8a601d380ab6b', clientId: '6aaa796173f8a601d380ab67', instanceId: '6aaa796173f8a601d380ab61' }
  ];

  const targetNT = {
    _id: '6aaa72ff064b013409d28b61',
    slug: 'mock-master-1789555455737',
    event: 'mock_event',
    templatePackId: '6aaa72ff064b013409d28b60'
  };

  const protectedWAs = [
    { _id: '6aa194e0eb2371537fff765f', instanceId: '6aa02cef98a9832c24726e6d', chat: 5693, contact: 7687, message: 50 },
    { _id: '6aa7d531203f0834afc69f99', instanceId: '6aa44c3398b20b15a2dbf51e', chat: 11920, contact: 13610, message: 358 },
    { _id: '6aa7f3f7203f0834afc6a0f6', instanceId: '6aa7f3f6619788a48aea26ca', chat: 11948, contact: 13631, message: 513 }
  ];

  // PHASE 7.4-A — PRECONDITION CHECK

  for (const t of targetWAs) {
    const wa = await WhatsAppAccount.findById(t._id);
    if (!wa) { report.preconditions.passed = false; report.preconditions.errors.push(`WA ${t._id} not found`); continue; }
    if (wa.clientId.toString() !== t.clientId) { report.preconditions.passed = false; report.preconditions.errors.push(`WA ${t._id} clientId mismatch`); }
    if (wa.instanceId?.toString() !== t.instanceId) { report.preconditions.passed = false; report.preconditions.errors.push(`WA ${t._id} instanceId mismatch`); }

    const deps = {
      Chat: await Chat.countDocuments({ instanceId: t.instanceId }),
      Contact: await Contact.countDocuments({ instanceId: t.instanceId }),
      Message: await Message.countDocuments({ instanceId: t.instanceId }),
      Reminder: await Reminder.countDocuments({ instanceId: t.instanceId }),
      Campaign: await Campaign.countDocuments({ instanceId: t.instanceId }),
      CampaignLog: await CampaignLog.countDocuments({ instanceId: t.instanceId }),
      Chatbot: await Chatbot.countDocuments({ instanceId: t.instanceId }),
      ChatbotKnowledge: await ChatbotKnowledge.countDocuments({ instanceId: t.instanceId }),
      ChatbotLead: await ChatbotLead.countDocuments({ instanceId: t.instanceId }),
      AITrainingMessage: await AITrainingMessage.countDocuments({ instanceId: t.instanceId })
    };
    for (const [k, v] of Object.entries(deps)) {
      if (v > 0) {
        report.preconditions.passed = false;
        report.preconditions.errors.push(`WA ${t._id} has >0 ${k}`);
      }
    }
  }

  const nt = await NotificationTemplate.findById(targetNT._id);
  if (!nt) { report.preconditions.passed = false; report.preconditions.errors.push(`NT ${targetNT._id} not found`); }
  else {
    if (nt.slug !== targetNT.slug) { report.preconditions.passed = false; report.preconditions.errors.push(`NT slug mismatch`); }
    if (nt.event !== targetNT.event) { report.preconditions.passed = false; report.preconditions.errors.push(`NT event mismatch`); }
    if (nt.templatePackId.toString() !== targetNT.templatePackId) { report.preconditions.passed = false; report.preconditions.errors.push(`NT pack mismatch`); }
    const packExists = await TemplatePack.exists({ _id: targetNT.templatePackId });
    if (packExists) { report.preconditions.passed = false; report.preconditions.errors.push(`NT pack exists`); }
    const ctRefs = await ClientTemplate.countDocuments({ templateId: targetNT._id });
    if (ctRefs > 0) { report.preconditions.passed = false; report.preconditions.errors.push(`NT has CT refs`); }
  }

  // PHASE 7.4-B — PROTECTED DATA CHECK

  for (const p of protectedWAs) {
    const wa = await WhatsAppAccount.findById(p._id);
    if (!wa) { report.preconditions.passed = false; report.preconditions.errors.push(`Protected WA ${p._id} not found`); }
    const chat = await Chat.countDocuments({ instanceId: p.instanceId });
    const contact = await Contact.countDocuments({ instanceId: p.instanceId });
    const message = await Message.countDocuments({ instanceId: p.instanceId });
    if (chat !== p.chat || contact !== p.contact || message !== p.message) {
      report.preconditions.passed = false;
      report.preconditions.errors.push(`Protected ${p._id} data mismatch (C:${chat}/${p.chat}, c:${contact}/${p.contact}, M:${message}/${p.message})`);
    }
  }

  if (!report.preconditions.passed) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  // PHASE 7.4-C — MASTER BASELINE BEFORE CLEANUP

  const getCounts = async () => ({
    ClientCategory: await ClientCategory.countDocuments(),
    TemplatePack: await TemplatePack.countDocuments(),
    NotificationTemplate: await NotificationTemplate.countDocuments(),
    Client: await Client.countDocuments(),
    ClientTemplate: await ClientTemplate.countDocuments(),
    WhatsAppAccount: await WhatsAppAccount.countDocuments(),
    WhatsAppInstance: await WhatsAppInstance.countDocuments(),
    MessageLog: await MessageLog.countDocuments(),
    NotificationEventLog: await NotificationEventLog.countDocuments()
  });

  report.baselineBefore = await getCounts();

  // PHASE 7.4-D — EXECUTE TARGETED DELETION

  for (const t of targetWAs) {
    await WhatsAppAccount.deleteOne({ _id: t._id });
    report.deletions.push(`Deleted WA ${t._id}`);
    report.mutationCounters.WhatsAppAccount++;
    
    const check = await WhatsAppAccount.findById(t._id);
    report.immediateVerify[t._id] = check ? "FOUND" : "NOT FOUND";
  }

  await NotificationTemplate.deleteOne({ _id: targetNT._id });
  report.deletions.push(`Deleted NT ${targetNT._id}`);
  report.mutationCounters.NotificationTemplate++;
  const ntCheck = await NotificationTemplate.findById(targetNT._id);
  report.immediateVerify[targetNT._id] = ntCheck ? "FOUND" : "NOT FOUND";

  // PHASE 7.4-E — POST-CLEANUP VERIFICATION

  report.baselineAfter = await getCounts();

  for (const p of protectedWAs) {
    const wa = await WhatsAppAccount.findById(p._id);
    report.protectedVerify[p._id] = wa ? "STILL EXISTS" : "MISSING";

    report.historicalDataVerify[p._id] = {
      Chat: await Chat.countDocuments({ instanceId: p.instanceId }),
      Contact: await Contact.countDocuments({ instanceId: p.instanceId }),
      Message: await Message.countDocuments({ instanceId: p.instanceId })
    };
  }

  const phase6Client = await Client.findOne({ slug: 'tabdeal-phase6-events-test' });
  report.phase6Verify = {
    exists: !!phase6Client,
    ClientTemplate: phase6Client ? await ClientTemplate.countDocuments({ clientId: phase6Client._id }) : 0,
    ApiKey: phase6Client ? await ApiKey.countDocuments({ clientId: phase6Client._id }) : 0
  };

  report.retainedLogVerify = {
    MessageLogChanged: report.baselineBefore.MessageLog !== report.baselineAfter.MessageLog,
    NotificationEventLogChanged: report.baselineBefore.NotificationEventLog !== report.baselineAfter.NotificationEventLog
  };

  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

runCleanup().catch(console.error);
