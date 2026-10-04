const axios = require('axios');
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:3001/api';
const CLIENT_ID = '6aa44c3498b20b15a2dbf520';
const TEMPLATE_ID = '6aa43c17203f0834afc63b52';

let token = '';
let clientTemplateId = '';

async function runTests() {
  console.log('--- STARTING TESTS ---');
  
  // LOGIN
  console.log('Logging in...');
  const loginRes = await axios.post(`${BASE_URL}/auth/login`, { username: 'admin', password: 'TABdeal@872018@' });
  const cookie = loginRes.headers['set-cookie']; axios.defaults.headers.common['Cookie'] = cookie;
  
  console.log('Login successful');

  // TEST B - ASSIGN
  console.log('\\n--- TEST B: ASSIGN TEMPLATE ---');
  try {
    const assignRes = await axios.post(`${BASE_URL}/tabdeal/client-templates`, {
      clientId: CLIENT_ID,
      templateId: TEMPLATE_ID,
      enabled: true,
      customVariables: []
    });
    console.log('Assign status:', assignRes.status);
    clientTemplateId = assignRes.data.data._id;
    console.log('PASS');
  } catch(e) {
    console.log('FAIL:', e.response?.data || e.message);
  }

  // TEST C - DUPLICATE
  console.log('\\n--- TEST C: DUPLICATE ASSIGNMENT ---');
  try {
    await axios.post(`${BASE_URL}/tabdeal/client-templates`, {
      clientId: CLIENT_ID,
      templateId: TEMPLATE_ID,
      enabled: true,
      customVariables: []
    });
    console.log('FAIL: Expected error');
  } catch(e) {
    if(e.response?.status === 400 || e.response?.status === 409) {
      console.log('PASS: Duplicate rejected');
    } else {
      console.log('FAIL:', e.response?.data || e.message);
    }
  }

  // TEST D - CUSTOM MESSAGE
  console.log('\\n--- TEST D: CUSTOM MESSAGE ---');
  try {
    const patchRes = await axios.patch(`${BASE_URL}/tabdeal/client-templates/${clientTemplateId}`, {
      enabled: true,
      customMessage: 'QA TEST CUSTOM MESSAGE'
    });
    if(patchRes.data.data.customMessage === 'QA TEST CUSTOM MESSAGE') {
      console.log('PASS');
    } else {
      console.log('FAIL');
    }
  } catch(e) {
    console.log('FAIL:', e.response?.data || e.message);
  }

  // TEST E - CLEAR CUSTOM MESSAGE
  console.log('\\n--- TEST E: CLEAR CUSTOM MESSAGE ---');
  try {
    const patchRes = await axios.patch(`${BASE_URL}/tabdeal/client-templates/${clientTemplateId}`, {
      enabled: true,
      customMessage: ''
    });
    if(!patchRes.data.data.customMessage) {
      console.log('PASS');
    } else {
      console.log('FAIL');
    }
  } catch(e) {
    console.log('FAIL:', e.response?.data || e.message);
  }

  // TEST F - CUSTOM VARIABLES
  console.log('\\n--- TEST F: CUSTOM VARIABLES ---');
  try {
    const patchRes = await axios.patch(`${BASE_URL}/tabdeal/client-templates/${clientTemplateId}`, {
      enabled: true,
      customVariables: [
        { key: 'customer_name', value: 'QA User' },
        { key: 'business_name', value: 'TABDEAL QA' },
        { key: 'greeting', value: 'Hello QA' }
      ]
    });
    if(patchRes.data.data.customVariables?.length === 3) {
      console.log('PASS');
    } else {
      console.log('FAIL');
    }
  } catch(e) {
    console.log('FAIL:', e.response?.data || e.message);
  }

  // TEST H - CLEAR VARIABLES
  console.log('\\n--- TEST H: CLEAR VARIABLES ---');
  try {
    const patchRes = await axios.patch(`${BASE_URL}/tabdeal/client-templates/${clientTemplateId}`, {
      enabled: true,
      customVariables: []
    });
    if(patchRes.data.data.customVariables?.length === 0) {
      console.log('PASS');
    } else {
      console.log('FAIL');
    }
  } catch(e) {
    console.log('FAIL:', e.response?.data || e.message);
  }

  // TEST I - DISABLE
  console.log('\\n--- TEST I: DISABLE ---');
  try {
    const patchRes = await axios.patch(`${BASE_URL}/tabdeal/client-templates/${clientTemplateId}`, {
      enabled: false
    });
    if(patchRes.data.data.enabled === false) {
      console.log('PASS');
    } else {
      console.log('FAIL');
    }
  } catch(e) {
    console.log('FAIL:', e.response?.data || e.message);
  }

  // TEST J - RE-ENABLE
  console.log('\\n--- TEST J: RE-ENABLE ---');
  try {
    const patchRes = await axios.patch(`${BASE_URL}/tabdeal/client-templates/${clientTemplateId}`, {
      enabled: true
    });
    if(patchRes.data.data.enabled === true) {
      console.log('PASS');
    } else {
      console.log('FAIL');
    }
  } catch(e) {
    console.log('FAIL:', e.response?.data || e.message);
  }

  // AUDIT LOG VERIFICATION
  console.log('\\n--- TEST M: AUDIT LOGGING ---');
  await mongoose.connect('mongodb://127.0.0.1:27017/wa_platform');
  const db = mongoose.connection.db;
  const logs = await db.collection('logs').find({ action: { $in: ['create', 'update'] }, entity: 'ClientTemplate' }).toArray();
  if(logs.length >= 2) {
    console.log('PASS: Audit logs found');
    console.log(logs[logs.length-1]);
  } else {
    console.log('FAIL: Logs missing');
  }

  // PORTAL TEST
  console.log('\\n--- TEST L: CLIENT PORTAL ISOLATION ---');
  const clientLoginRes = await axios.post(`${BASE_URL}/auth/login`, { username: 'restaurant_test_01', password: 'TABdeal@872018@' });
  const clientToken = clientLoginRes.data.token;
  try {
    await axios.post(`${BASE_URL}/tabdeal/client-templates`, {
      clientId: CLIENT_ID,
      templateId: TEMPLATE_ID,
      enabled: true,
      customVariables: []
    }, { headers: { Authorization: `Bearer ${clientToken}` } });
    console.log('FAIL: Client was able to POST');
  } catch(e) {
    if(e.response?.status === 403 || e.response?.status === 401) {
      console.log('PASS: Client rejected');
    } else {
      console.log('FAIL:', e.response?.status);
    }
  }

  process.exit(0);
}

runTests();
