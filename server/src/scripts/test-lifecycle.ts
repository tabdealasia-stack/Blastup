import mongoose from 'mongoose';
import { env } from '../config/env';
import { getClientDependencyReport } from '../services/tabdeal/client-lifecycle.service';
import { Client } from '../models/Client';

async function run() {
  await mongoose.connect(env.MONGODB_URI);
  try {
    const client = await Client.findOne({ slug: 'tabdeal-phase6-events-test' });
    if (!client) throw new Error('Client not found');
    const report = await getClientDependencyReport(client._id.toString());
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}
run().catch(console.error);
