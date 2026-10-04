import mongoose from 'mongoose';
import { env } from '../config/env';
import { createClient } from '../controllers/tabdeal/client.controller';
import { ClientCategory } from '../models/ClientCategory';

async function runTest() {
  await mongoose.connect(env.MONGODB_URI);
  
  const category = await ClientCategory.findOne({ slug: 'events-ticketing' });
  if (!category) throw new Error('Category not found');

  const req = {
    body: {
      businessName: 'TABDEAL Phase6 Events Test',
      categoryId: category._id.toString(),
      timezone: 'Asia/Kolkata',
      defaultCountryCode: '91'
    }
  } as any;

  const res = {
    status: function(s: any) { this.statusCode = s; return this; },
    json: function(d: any) { console.log('RESPONSE:', JSON.stringify(d, null, 2)); return this; }
  } as any;

  const next = (err: any) => { console.error('NEXT ERROR:', err); };

  await createClient(req, res, next);
  await mongoose.disconnect();
}

runTest().catch(console.error);
