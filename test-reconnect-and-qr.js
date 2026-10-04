const fs = require('fs');

async function test() {
  try {
    const token = fs.readFileSync('C:\\Users\\shaik\\Blastup\\server\\test-token.txt', 'utf8').trim();
    
    console.log('Sending reconnect...');
    const reconnectRes = await fetch('https://api.tabdealdigital.in/api/tabdeal/clients/6aacbbf4d0ae2b18d310cd2d/whatsapp/reconnect', {
      method: 'POST',
      headers: {
        'Cookie': 'wa_token=' + token,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Reconnect status:', reconnectRes.status);
    const reconnectText = await reconnectRes.text();
    console.log('Reconnect response:', reconnectText);
    
    // wait a few seconds
    await new Promise(r => setTimeout(r, 4000));
    
    console.log('Fetching QR...');
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
      // write it to artifact dir
      const dest = "C:\\Users\\shaik\\.gemini\\antigravity\\brain\\3a3edf68-f782-45bf-a0cc-a81c6fe129e2\\TABDEAL_FINAL_REGRESSION_QR.png";
      fs.writeFileSync(dest, base64Data, 'base64');
      console.log('Saved QR to', dest);
    } else {
      console.log('No QR found in response:', qrData);
    }
  } catch (e) {
    console.error(e);
  }
}
test();
