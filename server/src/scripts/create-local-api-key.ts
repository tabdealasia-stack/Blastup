import 'dotenv/config';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { Client } from '../models/Client';
import { ApiKey } from '../models/ApiKey';
import { User } from '../models/User';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);

  const user = await User.findOne({
    username: 'restaurant_test_01',
    isActive: true,
  });

  if (!user) {
    throw new Error('Active test restaurant user not found');
  }

  const client = await Client.findOne({
    userId: user._id,
    slug: 'test-restaurant-01',
    status: 'active',
  });

  if (!client) {
    throw new Error('Active Test Restaurant client not found');
  }

  const name = 'Test Restaurant API Test 1';

  const rawKey = `wa_${crypto.randomBytes(24).toString('hex')}`;
  const keyHash = hashToken(rawKey);
  const keyPrefix = rawKey.substring(0, 11);

  const apiKey = await ApiKey.create({
    name,
    keyHash,
    keyPrefix,
    clientId: client._id,
    userId: user._id,
    status: 'active',
  });

  console.log('\n========================================');
  console.log('API KEY CREATED SUCCESSFULLY');
  console.log('========================================');
  console.log(`Name: ${name}`);
  console.log(`Client: ${client.businessName}`);
  console.log(`Key ID: ${apiKey._id}`);
  console.log(`Key Prefix: ${keyPrefix}`);
  console.log('\nRAW API KEY — SAVE THIS NOW:');
  console.log(rawKey);
  console.log('\nIMPORTANT: This raw key will NOT be stored in MongoDB.');
  console.log('It will not be shown again.');
  console.log('========================================\n');

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('\nERROR:', error.message);
  await mongoose.disconnect();
  process.exit(1);
});

