const { execSync } = require('child_process');
const jsCode = `
const { execSync } = require('child_process');

function query(col, expr) {
  const cmd = "docker exec tabdeal-mongodb mongosh 'mongodb://tabdeal:ce6c56b6e73676d071020793c0c707e311a27e159db1dfb1f6aa9aa01c1edfaa@127.0.0.1:27017/wa_platform?authSource=admin' --quiet --eval \\"JSON.stringify(db." + col + "." + expr + ")\\"";
  return JSON.parse(execSync(cmd).toString().trim());
}

console.log("=== EventLogs ===");
const eventCounts = query('notification_event_logs', 'aggregate([{ $group: { _id: \\"$status\\", count: { $sum: 1 } } }]).toArray()');
console.log(eventCounts);

console.log("=== MessageLogs ===");
const msgCounts = query('message_logs', 'aggregate([{ $group: { _id: \\"$status\\", count: { $sum: 1 } } }]).toArray()');
console.log(msgCounts);

console.log("=== API Keys ===");
const keys = query('api_keys', 'find({}).toArray()');
console.log(keys.map(k => ({ id: k._id, client: k.clientId, status: k.isActive ? 'active' : 'inactive' })));

console.log("=== Clients / Templates ===");
const clients = query('clients', 'find({}).toArray()');
const clientTemplates = query('client_templates', 'find({}).toArray()');
const accounts = query('whatsapp_accounts', 'find({}).toArray()');

clients.forEach(c => {
  console.log('Client:', c.businessName, c._id);
  const tpls = clientTemplates.filter(t => t.clientId === c._id);
  console.log('  Templates:', tpls.length);
  const acc = accounts.filter(a => a.clientId === c._id);
  console.log('  WhatsApp Accounts:', acc.map(a => a.status).join(', '));
});

console.log("=== SafeMode ===");
const smCount = query('whatsapp_accounts', 'countDocuments({ safeMode: true })');
console.log('Accounts with SafeMode = true:', smCount);

`;

const sshCmd = 'ssh -o StrictHostKeyChecking=no -i C:\\\\Users\\\\shaik\\\\.ssh\\\\tabdeal_vps_ed25519 -o ConnectTimeout=10 root@148.113.26.196 "node -e \\"' + jsCode.replace(/\n/g, '').replace(/"/g, '\\\\\\"') + '\\""';
const res = execSync(sshCmd);
console.log(res.toString());
