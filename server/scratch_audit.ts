import mongoose from 'mongoose';
import { Client } from './src/models/Client';
import { User } from './src/models/User';
import ClientTemplate from './src/models/ClientTemplate';
import { ClientCategory } from './src/models/ClientCategory';
import { TemplatePack } from './src/models/TemplatePack';
import { NotificationTemplate } from './src/models/NotificationTemplate';
import { ApiKey } from './src/models/ApiKey';
import { Session } from './src/models/Session';
import { WhatsAppAccount } from './src/models/WhatsAppAccount';
import { WhatsAppInstance } from './src/models/WhatsAppInstance';
import { MessageLog } from './src/models/MessageLog';
import { NotificationEventLog } from './src/models/NotificationEventLog';
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
import { Log } from './src/models/Log';

async function runAudit() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wa_platform');
  const report: any = {};

  // Step 2 & 20: Baseline Counts
  report.counts = {
    Categories: await ClientCategory.countDocuments(),
    TemplatePacks: await TemplatePack.countDocuments(),
    NotificationTemplates: await NotificationTemplate.countDocuments(),
    Clients: await Client.countDocuments(),
    ClientTemplates: await ClientTemplate.countDocuments(),
    Users: await User.countDocuments(),
    ApiKeys: await ApiKey.countDocuments(),
    Sessions: await Session.countDocuments(),
    WhatsAppAccounts: await WhatsAppAccount.countDocuments(),
    WhatsAppInstances: await WhatsAppInstance.countDocuments(),
    MessageLogs: await MessageLog.countDocuments(),
    NotificationEventLogs: await NotificationEventLog.countDocuments(),
    Drivers: await Driver.countDocuments(),
    Vehicles: await Vehicle.countDocuments(),
    TravelBookings: await TravelBooking.countDocuments(),
    Chats: await Chat.countDocuments(),
    Contacts: await Contact.countDocuments(),
    Messages: await Message.countDocuments(),
    Reminders: await Reminder.countDocuments(),
    Campaigns: await Campaign.countDocuments(),
    CampaignLogs: await CampaignLog.countDocuments(),
    Chatbots: await Chatbot.countDocuments(),
    ChatbotKnowledge: await ChatbotKnowledge.countDocuments(),
    ChatbotLeads: await ChatbotLead.countDocuments(),
    AITrainingMessages: await AITrainingMessage.countDocuments(),
    Logs: await Log.countDocuments(),
  };

  const clinicCat = await ClientCategory.findOne({ slug: 'clinic-healthcare' });
  if (clinicCat) {
    const pack = await TemplatePack.findOne({ categoryId: clinicCat._id });
    if (pack) {
      report.counts.ClinicActiveTemplates = await NotificationTemplate.countDocuments({ templatePackId: pack._id, active: true });
    }
  }

  const dtClient = await Client.findOne({ slug: 'divine-tours' });
  if (dtClient) {
    report.counts.DivineToursClientTemplates = await ClientTemplate.countDocuments({ clientId: dtClient._id });
  }

  // Step 3: Existing Client Verification
  report.existingClients = [];
  const allCurrentClients = await Client.find({});
  for (const client of allCurrentClients) {
    report.existingClients.push({ slug: client.slug, _id: client._id, businessName: client.businessName, status: client.status });
  }

  // Step 4: Client Relationship Integrity
  const allClients = await Client.find({});
  report.missingUsers = [];
  report.deletionLifecycleClients = [];
  for (const c of allClients) {
    const u = await User.findById(c.userId);
    if (!u) {
      report.missingUsers.push(c._id);
    }
    if (['deletion_requested', 'cleanup_in_progress', 'cleanup_failed'].includes(c.status)) {
      report.deletionLifecycleClients.push(c.slug);
    }
  }

  // Step 5: ClientTemplate Integrity
  const cts = await ClientTemplate.find({});
  report.ctOrphans = { missingClient: 0, missingPack: 0 };
  for (const ct of cts) {
    if (!await Client.findById(ct.clientId)) report.ctOrphans.missingClient++;
    if (!await NotificationTemplate.findById(ct.templateId)) report.ctOrphans.missingPack++;
  }

  // Step 6 & 7: WhatsApp Integrity
  const was = await WhatsAppAccount.find({});
  report.waOrphans = { missingClient: 0, missingInstance: 0 };
  for (const wa of was) {
    if (!await Client.findById(wa.clientId)) report.waOrphans.missingClient++;
    if (!await WhatsAppInstance.findById(wa.instanceId)) report.waOrphans.missingInstance++;
  }
  const wis = await WhatsAppInstance.find({});
  report.wiOrphans = { missingAccount: 0 };
  for (const wi of wis) {
    if (!await WhatsAppAccount.findOne({ instanceId: wi.instanceId })) report.wiOrphans.missingAccount++;
  }

  // Step 8 & 9: ApiKey and Session Integrity
  const keys = await ApiKey.find({});
  report.keyOrphans = { missingClient: 0, missingUser: 0 };
  for (const k of keys) {
    if (!await Client.findById(k.clientId)) report.keyOrphans.missingClient++;
    if (!await User.findById(k.userId)) report.keyOrphans.missingUser++;
  }

  const sessions = await Session.find({});
  report.sessionOrphans = { missingUser: 0 };
  for (const s of sessions) {
    if (!await User.findById(s.userId)) report.sessionOrphans.missingUser++;
  }

  // Step 10: Log Integrity
  const msgLogs = await MessageLog.find({}).limit(100);
  report.msgLogOrphans = 0;
  for (const ml of msgLogs) {
     if (ml.clientId && !await Client.findById(ml.clientId)) report.msgLogOrphans++;
  }
  const evtLogs = await NotificationEventLog.find({}).limit(100);
  report.evtLogOrphans = 0;
  for (const el of evtLogs) {
     if (el.clientId && !await Client.findById(el.clientId)) report.evtLogOrphans++;
  }

  // Step 11 & 12: Master Template Integrity
  const allPacks = await TemplatePack.find({});
  report.masterOrphans = { missingCategory: 0, missingPack: 0 };
  for (const p of allPacks) {
    if (!await ClientCategory.findById(p.categoryId)) report.masterOrphans.missingCategory++;
  }
  const allNTs = await NotificationTemplate.find({});
  let foundClinicEvents = {
    'appointment.booked': false, 'appointment.confirmed': false, 'appointment.reminder': false,
    'prescription.ready': false, 'followup.reminder': false, 'report.ready': false, 'payment.received': false
  };
  for (const nt of allNTs) {
    if (!await TemplatePack.findById(nt.templatePackId)) report.masterOrphans.missingPack++;
    if (Object.keys(foundClinicEvents).includes(nt.event)) foundClinicEvents[nt.event as keyof typeof foundClinicEvents] = true;
  }
  report.foundClinicEvents = foundClinicEvents;

  const expectedCategories = ['restaurant', 'grocery-supermarket', 'salon-beauty', 'clinic-healthcare', 'hotel-hospitality', 'gym-fitness', 'real-estate', 'travel', 'rent-a-car-tour-vehicle', 'home-services', 'education-coaching', 'automobile-car-service', 'retail-e-commerce', 'logistics-courier', 'professional-digital-services', 'travel-rent-a-car', 'events-ticketing', 'finance-banking', 'insurance', 'ngo-charity'];
  report.missingPacks = [];
  for (const ec of expectedCategories) {
     const cat = await ClientCategory.findOne({ slug: ec });
     if (cat) {
       const hasPack = await TemplatePack.findOne({ categoryId: cat._id });
       if (!hasPack) report.missingPacks.push(ec);
     }
  }

  // Step 13: Divine Tours Data Integrity
  if (dtClient) {
     const dtWa = await WhatsAppAccount.findOne({ clientId: dtClient._id });
     report.dtIntegrity = {
        hasWa: !!dtWa,
        unrelatedCts: 0
     };
  }

  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

runAudit().catch(console.error);
