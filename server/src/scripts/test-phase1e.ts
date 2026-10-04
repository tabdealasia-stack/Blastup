import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
// Native fetch in Node 18+
import '../models/Client';
import '../models/NotificationTemplate';
import '../models/ApiKey';
import '../models/MessageLog';
import '../models/NotificationEventLog';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const API_URL = 'http://localhost:3001/api/tabdeal';
let cookieHeader = '';

async function runLogsTests() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wa_platform');
  
  try {
    console.log('\n--- 0. LOGGING IN ---');
    const loginRes = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: process.env.ADMIN_PASSWORD || 'TABdeal@872018@' })
    });
    
    if (loginRes.status !== 200) throw new Error('Login failed');
    
    const cookies = loginRes.headers.get('set-cookie');
    cookieHeader = cookies ? cookies : '';
    console.log('Logged in successfully');

    // MOCK DATA CREATION directly in MongoDB to avoid relying on complex engine triggers
    const client = await mongoose.model('Client').findOne({ slug: 'divine-tours' });
    const template = await mongoose.model('NotificationTemplate').findOne({ event: 'booking.confirmed' });
    const apiKey = await mongoose.model('ApiKey').findOne({ clientId: client?._id });
    
    if (!client) throw new Error('Divine Tours not found');

    const mockMessageLog = await mongoose.model('MessageLog').create({
      clientId: client._id,
      apiKeyId: apiKey?._id || new mongoose.Types.ObjectId(),
      to: '1234567890',
      messageType: 'template',
      templateId: template?._id,
      status: 'delivered',
      providerMessageId: 'mock-wamid-12345',
      messagePreview: 'Mock Message'
    });

    const mockEventLog = await mongoose.model('NotificationEventLog').create({
      clientId: client._id,
      event: 'booking.confirmed',
      eventId: 'mock-event-id-123',
      status: 'sent',
      messageLogId: mockMessageLog._id
    });

    console.log('Created Mock Logs:', { msgId: mockMessageLog._id, evtId: mockEventLog._id });

    console.log('\n--- A. MessageLog GET list ---');
    const msgListRes = await fetch(`${API_URL}/message-logs`, { headers: { 'Cookie': cookieHeader } });
    console.log('Status:', msgListRes.status);
    const msgListData: any = await msgListRes.json();
    console.log('Total Logs:', msgListData.pagination?.total);

    console.log('\n--- B. MessageLog GET detail ---');
    const msgDetailRes = await fetch(`${API_URL}/message-logs/${mockMessageLog._id}`, { headers: { 'Cookie': cookieHeader } });
    console.log('Status:', msgDetailRes.status);
    
    console.log('\n--- C. EventLog GET list ---');
    const evtListRes = await fetch(`${API_URL}/event-logs`, { headers: { 'Cookie': cookieHeader } });
    console.log('Status:', evtListRes.status);

    console.log('\n--- D. EventLog GET detail ---');
    const evtDetailRes = await fetch(`${API_URL}/event-logs/${mockEventLog._id}`, { headers: { 'Cookie': cookieHeader } });
    console.log('Status:', evtDetailRes.status);

    console.log('\n--- E. Client Filtering ---');
    const filteredRes = await fetch(`${API_URL}/message-logs?clientId=${client._id}`, { headers: { 'Cookie': cookieHeader } });
    console.log('Status:', filteredRes.status);

    console.log('\n--- H. Search Filtering ---');
    const searchRes = await fetch(`${API_URL}/message-logs?search=1234567890`, { headers: { 'Cookie': cookieHeader } });
    console.log('Status:', searchRes.status);
    const searchData: any = await searchRes.json();
    console.log('Search match found:', searchData.data.length > 0);

    console.log('\n--- K. Dashboard Metrics ---');
    const dashRes = await fetch(`${API_URL}/dashboard-metrics`, { headers: { 'Cookie': cookieHeader } });
    console.log('Status:', dashRes.status);
    const dashData: any = await dashRes.json();
    console.log('Dashboard Data:', dashData.data);

    console.log('\n--- J. Authorization Boundaries ---');
    const unauthRes = await fetch(`${API_URL}/message-logs`);
    console.log('Unauth GET /message-logs status:', unauthRes.status, '(Expected 401)');

    // L. Cleanup
    console.log('\n--- L. Temporary Test-Data Cleanup ---');
    await mongoose.model('MessageLog').deleteOne({ _id: mockMessageLog._id });
    await mongoose.model('NotificationEventLog').deleteOne({ _id: mockEventLog._id });
    console.log('Cleanup complete');

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

runLogsTests();
