const mongoose = require('mongoose');
const { ClientCategory } = require('./server/src/models/ClientCategory');
const { TemplatePack } = require('./server/src/models/TemplatePack');

mongoose.connect('mongodb://127.0.0.1:27017/tabdeal_blastup_v2').then(async () => {
  const categories = await ClientCategory.find({ active: true }).lean();
  console.log('Categories:', categories.map(c => ({ _id: c._id, name: c.name, defaultTemplatePackId: c.defaultTemplatePackId })));
  process.exit(0);
});
