const mongoose = require('mongoose');
const { Client } = require('./dist/models/Client');
const { User } = require('./dist/models/User');
const ClientTemplate = require('./dist/models/ClientTemplate').default;
const { NotificationTemplate } = require('./dist/models/NotificationTemplate');
const { WhatsAppAccount } = require('./dist/models/WhatsAppAccount');
const { ApiKey } = require('./dist/models/ApiKey');

function reportAnomaly(resourceType, resourceId, relatedResourceId, problemType, severity, action) {
  console.log(`Resource: ${resourceType}`);
  console.log(`ID: ${resourceId}`);
  if (relatedResourceId) console.log(`Related ID: ${relatedResourceId}`);
  console.log(`Problem: ${problemType}`);
  console.log(`Severity: ${severity}`);
  console.log(`Action: ${action}`);
  console.log('---');
}

async function detectOrphans() {
  await mongoose.connect('mongodb://127.0.0.1:27017/wa_platform');
  console.log('--- TABDEAL ORPHAN DETECTOR START ---\n');

  let anomalies = 0;

  // A. User without Client (excluding superadmin/admin)
  const users = await User.find({ role: 'user' }).lean();
  for (const u of users) {
    const c = await Client.findOne({ userId: u._id }).lean();
    if (!c) {
      reportAnomaly('User', u._id, null, 'missing Client', 'WARNING', 'verify if intentional; consider deactivating User if orphan');
      anomalies++;
    }
  }

  // B, C, D. Client checks
  const clients = await Client.find().lean();
  for (const c of clients) {
    const u = await User.findById(c.userId).lean();
    if (!u) {
      reportAnomaly('Client', c._id, c.userId, 'missing User', 'CRITICAL', 'cannot authenticate. requires superadmin repair or removal');
      anomalies++;
    }

    const tmpl = await ClientTemplate.findOne({ clientId: c._id }).lean();
    if (!tmpl) {
      reportAnomaly('Client', c._id, null, 'missing ClientTemplates', 'WARNING', 'client cannot send notifications. re-provision templates');
      anomalies++;
    }

    const wa = await WhatsAppAccount.findOne({ clientId: c._id }).lean();
    if (!wa) {
      reportAnomaly('Client', c._id, null, 'missing WhatsAppAccount', 'CRITICAL', 'client cannot connect WhatsApp. requires superadmin repair');
      anomalies++;
    }
  }

  // E. WhatsAppAccount without Client
  const was = await WhatsAppAccount.find().lean();
  for (const wa of was) {
    const c = await Client.findById(wa.clientId).lean();
    if (!c) {
      reportAnomaly('WhatsAppAccount', wa._id, wa.clientId, 'missing Client', 'WARNING', 'safe to delete orphan record');
      anomalies++;
    }
  }

  // F, G. ClientTemplate checks
  const templates = await ClientTemplate.find().lean();
  for (const tmpl of templates) {
    const c = await Client.findById(tmpl.clientId).lean();
    if (!c) {
      reportAnomaly('ClientTemplate', tmpl._id, tmpl.clientId, 'missing Client', 'WARNING', 'safe to delete orphan record');
      anomalies++;
    }

    const master = await NotificationTemplate.findById(tmpl.templateId).lean();
    if (!master) {
      reportAnomaly('ClientTemplate', tmpl._id, tmpl.templateId, 'missing NotificationTemplate (Master)', 'CRITICAL', 'broken template reference. delete and re-provision');
      anomalies++;
    }
  }

  // H. API key without Client
  const apiKeys = await ApiKey.find().lean();
  for (const key of apiKeys) {
    const c = await Client.findById(key.clientId).lean();
    if (!c) {
      reportAnomaly('ApiKey', key._id, key.clientId, 'missing Client', 'WARNING', 'safe to revoke/delete orphan record');
      anomalies++;
    }
  }

  console.log(`\n--- TABDEAL ORPHAN DETECTOR END ---`);
  console.log(`Total anomalies found: ${anomalies}`);
  process.exit(0);
}

detectOrphans();
