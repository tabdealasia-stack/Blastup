const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const cats = await db.collection('client_categories').find({}).toArray();
  console.log('Categories:', cats.length);
  cats.forEach(c => console.log(c.slug));
  process.exit(0);
}
run();
