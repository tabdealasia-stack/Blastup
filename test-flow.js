const jwt = require('jsonwebtoken');
const fs = require('fs');

const secret = '9b7af173bb13b9eaf15699b48595e6e2e339cdd6ab29a93131f37e9da367b53655099e848d8069cc28d19bbb73b4b7270bdf12946a8a5ed1729fae6a67113af0';
const token = jwt.sign({ id: '6aacb5fa069dffca7ac76126' }, secret, { expiresIn: '1h' });

async function run() {
  console.log('Token generated.');
  
  const reconnectRes = await fetch('https://api.tabdealdigital.in/api/tabdeal/clients/6aacbbf4d0ae2b18d310cd2d/whatsapp/reconnect', {
    method: 'POST',
    headers: {
      'Cookie': 'wa_token=' + token,
      'Content-Type': 'application/json'
    }
  });
  console.log('Reconnect status:', reconnectRes.status);
  
  await new Promise(r => setTimeout(r, 4000));
  
  const qrRes = await fetch('https://api.tabdealdigital.in/api/tabdeal/clients/6aacbbf4d0ae2b18d310cd2d/whatsapp/qr?_t=' + Date.now(), {
    method: 'GET',
    headers: {
      'Cookie': 'wa_token=' + token
    }
  });
  console.log('QR status:', qrRes.status);
  
  const qrData = await qrRes.json();
  if (qrData.data && qrData.data.qr) {
    const base64Data = qrData.data.qr.replace(/^data:image\/png;base64,/, "");
    const dest = "C:\\Users\\shaik\\.gemini\\antigravity\\brain\\3a3edf68-f782-45bf-a0cc-a81c6fe129e2\\TABDEAL_FINAL_REGRESSION_QR.png";
    fs.writeFileSync(dest, base64Data, 'base64');
    console.log('Saved QR to', dest);
  } else {
    console.log('Failed to get QR:', qrData);
  }
}
run();
