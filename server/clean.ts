import mongoose from 'mongoose';
import { Client } from './src/models/Client';
import { User } from './src/models/User';
import dotenv from 'dotenv';
dotenv.config();

async function clean() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wa_platform');
  await User.deleteMany({ username: { $in: ['temp_worker_wa_user_1', 'temp_worker_wa_user_2', 'temp_worker_ct_user_1', 'temp_worker_ct_user_2', 'temp_worker_apikey_user_1', 'temp_worker_apikey_user_2', 'temp_worker_op_user_1', 'temp_worker_op_user_2'] } });
  await User.deleteMany({ email: { $in: ['temp.worker.wa1@example.com', 'temp.worker.wa2@example.com', 'temp.worker.ct1@example.com', 'temp.worker.ct2@example.com', 'temp.worker.apikey1@example.com', 'temp.worker.apikey2@example.com', 'temp.worker.op1@example.com', 'temp.worker.op2@example.com'] } });
  await Client.deleteMany({ slug: /^temp-target/ });
  await Client.deleteMany({ slug: /^temp-safe/ });
  await Client.deleteMany({ slug: /^temp-wa-target/ });
  await Client.deleteMany({ slug: /^temp-wa-safe/ });
  await Client.deleteMany({ slug: /^temp-apikey-target/ });
  await Client.deleteMany({ slug: /^temp-apikey-safe/ });
  await Client.deleteMany({ slug: /^temp-op-target/ });
  await Client.deleteMany({ slug: /^temp-op-safe/ });
  const wa = mongoose.connection.collection('whatsapp_instances');
  if (wa) {
    await wa.deleteMany({ instanceId: { $in: ['extra-target-instance'] } });
  }
  const waAcc = mongoose.connection.collection('whatsapp_accounts');
  if (waAcc) {
    // Delete if any orphaned
  }
  console.log('Cleaned up');
  await mongoose.disconnect();
}
clean();
