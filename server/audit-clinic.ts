import mongoose from 'mongoose';
import { ClientCategory } from './src/models/ClientCategory';
import { TemplatePack } from './src/models/TemplatePack';
import { NotificationTemplate } from './src/models/NotificationTemplate';
import ClientTemplate from './src/models/ClientTemplate';
import dotenv from 'dotenv';
dotenv.config();

async function runAudit() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wa_platform');
  console.log('Connected to DB');

  try {
    const category = await ClientCategory.findOne({ slug: 'clinic-healthcare' });
    if (!category) {
      console.log('Clinic category not found!');
      return;
    }
    console.log(`Clinic Category ID: ${category._id}`);

    const pack = await TemplatePack.findOne({ categoryId: category._id });
    if (!pack) {
      console.log('Clinic TemplatePack not found!');
      return;
    }
    console.log(`Clinic Pack ID: ${pack._id}`);

    const templates = await NotificationTemplate.find({ templatePackId: pack._id });
    console.log(`Existing template count: ${templates.length}`);

    templates.forEach(t => {
      console.log(`- [${t.active ? 'ACTIVE' : 'INACTIVE'}] ${t.event} | ${t.name} | ${t.variables.join(', ')}`);
      console.log(`  Message: ${t.message}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

runAudit();
