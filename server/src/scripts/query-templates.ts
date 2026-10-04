import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { NotificationTemplate } from '../models/NotificationTemplate';
import ClientTemplate from '../models/ClientTemplate';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function queryTemplates() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blastup');
  
  const temps = await NotificationTemplate.find();
  console.log(`NotificationTemplates count: ${temps.length}`);
  if (temps.length > 0) {
    console.log('Sample NotificationTemplate:', temps[0]);
  }
  
  const cts = await ClientTemplate.find();
  console.log(`ClientTemplates count: ${cts.length}`);
  if (cts.length > 0) {
    console.log('Sample ClientTemplate:', cts[0]);
  }

  await mongoose.disconnect();
}
queryTemplates();
