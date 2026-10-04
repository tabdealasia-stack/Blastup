import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { ClientCategory } from '../models/ClientCategory';
import { TemplatePack } from '../models/TemplatePack';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function querySlugs() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blastup');
  
  const cats = await ClientCategory.find();
  console.log('Categories:', cats.map(c => c.slug));
  
  const packs = await TemplatePack.find();
  console.log('Packs:', packs.map(p => p.slug));
  
  await mongoose.disconnect();
}
querySlugs();
