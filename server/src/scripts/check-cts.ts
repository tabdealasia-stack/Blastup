import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import ClientTemplate from '../models/ClientTemplate';
import { Client } from '../models/Client';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

async function checkClientTemplates() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wa_platform');
  const div = await Client.findOne({ slug: 'divine-tours' });
  const cts = await ClientTemplate.find({ clientId: div?._id }).lean();
  console.log('ClientTemplates for Divine Tours:');
  cts.forEach(ct => {
    console.log(`- templateId: ${ct.templateId}, customMsg: ${!!ct.customMessage}, customVars: ${ct.customVariables}`);
  });
  
  // See if any NotificationTemplates exist
  const { NotificationTemplate } = require('../models/NotificationTemplate');
  const nts = await NotificationTemplate.find();
  console.log(`Global NotificationTemplates count: ${nts.length}`);
  if (nts.length > 0) {
    console.log(nts.map((n:any) => n.event));
  }
  
  await mongoose.disconnect();
}
checkClientTemplates();
