import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../models/User';
import { Session } from '../models/Session';
import { hashToken } from '../utils/crypto';
import crypto from 'crypto';

async function runTest() {
  await mongoose.connect(env.MONGODB_URI);
  try {
    const superadmin = await User.findOne({ role: 'superadmin' });
    const regularUser = await User.findOne({ role: { $ne: 'superadmin' } });

    if (!superadmin || !regularUser) {
      console.log('Missing test users');
      return;
    }

    // Generate token for non-superadmin
    const userToken = jwt.sign({ sub: regularUser._id }, env.JWT_SECRET, { expiresIn: '1h' });
    const userTokenHash = hashToken(userToken);
    const userSession = new Session({
      userId: regularUser._id,
      tokenHash: userTokenHash,
      ip: '127.0.0.1',
      userAgent: 'test',
      expiresAt: new Date(Date.now() + 3600000)
    });
    await userSession.save();

    console.log('\n--- Testing non-superadmin ---');
    try {
      const res = await fetch('http://localhost:3001/api/tabdeal/clients/6aaa605d8063a7973bc40300/dependencies', {
        headers: { Cookie: `wa_token=${userToken}` }
      });
      console.log(`Status: ${res.status}`);
      const body = await res.text();
      console.log(`Body: ${body}`);
    } catch (e) {
      console.log(e);
    }

    // Generate token for superadmin
    const adminToken = jwt.sign({ sub: superadmin._id }, env.JWT_SECRET, { expiresIn: '1h' });
    const adminTokenHash = hashToken(adminToken);
    const adminSession = new Session({
      userId: superadmin._id,
      tokenHash: adminTokenHash,
      ip: '127.0.0.1',
      userAgent: 'test',
      expiresAt: new Date(Date.now() + 3600000)
    });
    await adminSession.save();

    console.log('\n--- Testing superadmin ---');
    try {
      const res = await fetch('http://localhost:3001/api/tabdeal/clients/6aaa605d8063a7973bc40300/dependencies', {
        headers: { Cookie: `wa_token=${adminToken}` }
      });
      console.log(`Status: ${res.status}`);
      const body = await res.text();
      console.log(`Body: ${body}`);
    } catch (e) {
      console.log(e);
    }

    // Cleanup
    await Session.deleteOne({ _id: userSession._id });
    await Session.deleteOne({ _id: adminSession._id });

  } finally {
    await mongoose.disconnect();
  }
}
runTest().catch(console.error);
