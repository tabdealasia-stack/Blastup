const mongoose = require("mongoose");
require("dotenv").config({ path: "/opt/tabdeal/Blastup/.env" });
async function count() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const cats = await db.collection("client_categories").countDocuments();
  const packs = await db.collection("template_packs").countDocuments();
  const templates = await db.collection("notification_templates").countDocuments();
  const clientTpls = await db.collection("client_templates").countDocuments();
  console.log(`Categories: ${cats}, Packs: ${packs}, Templates: ${templates}, ClientTemplates: ${clientTpls}`);
  process.exit(0);
}
count();
