import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import jwt from 'jsonwebtoken';
// using global fetch
import { User } from '../models/User';
import { ClientCategory } from '../models/ClientCategory';
import { TemplatePack } from '../models/TemplatePack';
import { NotificationTemplate } from '../models/NotificationTemplate';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const API_URL = 'http://localhost:3001/api/tabdeal/templates';
let token = '';

async function runHttpTests() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wa_platform');
  
  try {
    // 1. Login to get cookie
    console.log('\n--- 0. LOGGING IN ---');
    const loginRes = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: process.env.ADMIN_PASSWORD || 'TABdeal@872018@' })
    });
    
    if (loginRes.status !== 200) {
      const resp = await loginRes.text();
      throw new Error(`Login failed: ${loginRes.status} ${resp}`);
    }
    
    const cookies = loginRes.headers.get('set-cookie');
    const cookieHeader = cookies ? cookies : '';
    console.log('Got cookie:', cookieHeader ? 'Yes' : 'No');

    const cat = await ClientCategory.findOne({ slug: 'travel-rent-a-car' });
    const pack = await TemplatePack.findOne({ slug: 'travel-standard' });

    console.log('\n--- B. GET list ---');
    const getListRes = await fetch(API_URL, { headers: { 'Cookie': cookieHeader } });
    console.log('GET / status:', getListRes.status);

    console.log('\n--- A. POST create ---');
    const postRes = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Cookie': cookieHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'HTTP E2E Test',
        event: 'test.http.phase1d',
        categoryId: cat?._id.toString(),
        templatePackId: pack?._id.toString(),
        message: 'Hello {{customerName}}, HTTP E2E Test',
        variables: ['customerName'],
        active: true
      })
    });
    console.log('POST / status:', postRes.status);
    const postData: any = await postRes.json();
    const templateId = postData.data?._id;
    if (!templateId) throw new Error('Template not created: ' + JSON.stringify(postData));
    console.log('Created Template ID:', templateId);

    console.log('\n--- C. GET detail ---');
    const getDetailRes = await fetch(`${API_URL}/${templateId}`, { headers: { 'Cookie': cookieHeader } });
    console.log('GET /:id status:', getDetailRes.status);

    console.log('\n--- D. PATCH message ---');
    const patchMsgRes = await fetch(`${API_URL}/${templateId}`, {
      method: 'PATCH',
      headers: { 'Cookie': cookieHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Updated HTTP message' })
    });
    console.log('PATCH /:id message status:', patchMsgRes.status);

    console.log('\n--- E. PATCH status inactive ---');
    const patchInactiveRes = await fetch(`${API_URL}/${templateId}/status`, {
      method: 'PATCH',
      headers: { 'Cookie': cookieHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'inactive' })
    });
    console.log('PATCH /:id/status inactive status:', patchInactiveRes.status);

    console.log('\n--- F. PATCH status active ---');
    const patchActiveRes = await fetch(`${API_URL}/${templateId}/status`, {
      method: 'PATCH',
      headers: { 'Cookie': cookieHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' })
    });
    console.log('PATCH /:id/status active status:', patchActiveRes.status);

    console.log('\n--- 3. RELATIONSHIP VALIDATION ---');
    const badPostRes = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Cookie': cookieHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Invalid Rel',
        event: 'invalid.rel',
        categoryId: new mongoose.Types.ObjectId().toString(), // fake category
        templatePackId: pack?._id.toString(),
        message: 'msg'
      })
    });
    console.log('POST / with invalid relationship status:', badPostRes.status, '(Expected 400)');

    console.log('\n--- 4. EVENT VALIDATION ---');
    const badEventRes = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Cookie': cookieHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Invalid Event',
        event: 'booking confirmed!', // invalid chars
        categoryId: cat?._id.toString(),
        templatePackId: pack?._id.toString(),
        message: 'msg'
      })
    });
    console.log('POST / with invalid event status:', badEventRes.status, '(Expected 400)');

    console.log('\n--- 5. ACTIVE EVENT UNIQUENESS ---');
    const dupRes = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Cookie': cookieHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dup Event',
        event: 'test.http.phase1d', // Duplicate of our created one
        categoryId: cat?._id.toString(),
        templatePackId: pack?._id.toString(),
        message: 'msg',
        active: true
      })
    });
    console.log('POST / with duplicate active event status:', dupRes.status, '(Expected 409 Conflict)');

    console.log('\n--- 11. AUTHORIZATION TEST ---');
    const noAuthRes = await fetch(API_URL);
    console.log('GET / without token status:', noAuthRes.status, '(Expected 401)');
    
    const userToken = jwt.sign({ id: 'dummy', role: 'user' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    const userAuthRes = await fetch(API_URL, { headers: { 'Authorization': `Bearer ${userToken}` } });
    console.log('GET / with user token status:', userAuthRes.status, '(Expected 403)');

    console.log('\n--- G. DELETE (SAFE CLEANUP) ---');
    const delRes = await fetch(`${API_URL}/${templateId}`, {
      method: 'DELETE',
      headers: { 'Cookie': cookieHeader }
    });
    console.log('DELETE /:id status:', delRes.status);
    
    const doubleDelRes = await fetch(`${API_URL}/${templateId}`, {
      method: 'DELETE',
      headers: { 'Cookie': cookieHeader }
    });
    console.log('DELETE /:id (again) status:', doubleDelRes.status, '(Expected 404)');

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}
runHttpTests();
