const { execSync } = require('child_process');
const fs = require('fs');
const jsCode = `
const fs = require('fs');
const { execSync } = require('child_process');
const eventId = 'outbox-live-13c-1790583092140';
console.log('Verifying event:', eventId);

const qEvent = 'db.notification_event_logs.find({eventId: "' + eventId + '"}).toArray()';
const cmdEvent = "docker exec tabdeal-mongodb mongosh 'mongodb://tabdeal:ce6c56b6e73676d071020793c0c707e311a27e159db1dfb1f6aa9aa01c1edfaa@127.0.0.1:27017/wa_platform?authSource=admin' --eval '" + qEvent + "'";
console.log('=== EventLog ===');
try { console.log(execSync(cmdEvent).toString()); } catch(e) { console.log(e.toString()) }

const qMsg = 'db.message_logs.find({eventId: "' + eventId + '"}).toArray()';
const cmdMsg = "docker exec tabdeal-mongodb mongosh 'mongodb://tabdeal:ce6c56b6e73676d071020793c0c707e311a27e159db1dfb1f6aa9aa01c1edfaa@127.0.0.1:27017/wa_platform?authSource=admin' --eval '" + qMsg + "'";
console.log('=== MessageLog ===');
try { console.log(execSync(cmdMsg).toString()); } catch(e) { console.log(e.toString()) }
`;
const sshCmd = 'ssh -o StrictHostKeyChecking=no -i C:\\\\Users\\\\shaik\\\\.ssh\\\\tabdeal_vps_ed25519 -o ConnectTimeout=10 root@148.113.26.196 "node -e \\"' + jsCode.replace(/\n/g, '').replace(/"/g, '\\\\\\"') + '\\""';
const res = execSync(sshCmd);
console.log(res.toString());
