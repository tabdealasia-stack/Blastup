const { execSync } = require('child_process');
const cmd = `
echo === SYSTEM ===
uname -a
node -v
npm -v
pm2 -v
echo === MONGODB ===
systemctl status mongod --no-pager | head -n 3
echo === REDIS ===
systemctl status redis-server --no-pager | head -n 3
echo === NGINX ===
systemctl status nginx --no-pager | head -n 3
echo === PM2 STATE ===
pm2 list
pm2 describe wa-server | grep -E "status|name|restarts|uptime|restarted"
pm2 describe wa-client | grep -E "status|name|restarts|uptime|restarted"
echo === PORTS ===
ss -tulpn | grep -E ":3000|:3001|:27017|:6379"
echo === UFW STATUS ===
ufw status
echo === WHATSAPP SESSION ===
ls -la /opt/tabdeal/Blastup/sessions/
echo === DISK ===
df -h
echo === MEMORY ===
free -m
echo === GIT STATE ===
cd /opt/tabdeal/Blastup && git status && git branch --show-current && git rev-parse HEAD && git log -3 --oneline
`;
try {
  const formattedCmd = cmd.replace(/\n/g, '; ').replace(/"/g, '\\"');
  const result = execSync('ssh -o StrictHostKeyChecking=no -i C:\\\\Users\\\\shaik\\\\.ssh\\\\tabdeal_vps_ed25519 -o ConnectTimeout=10 root@148.113.26.196 "' + formattedCmd + '"', { encoding: 'utf8' });
  console.log(result);
} catch (e) {
  console.log("Error", e.message);
  if (e.stdout) console.log(e.stdout.toString());
  if (e.stderr) console.log(e.stderr.toString());
}
