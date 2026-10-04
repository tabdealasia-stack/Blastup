const mongoose = require("mongoose");
require("dotenv").config({ path: "/opt/tabdeal/Blastup/.env" });
async function count() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const templates = await db.collection("client_templates").find({}).toArray();
  console.log("ClientTemplates:", templates);
  const clients = await db.collection("clients").find({}).toArray();
  console.log("Clients:", clients.map(c => ({slug: c.slug, id: c._id})));
  process.exit(0);
}
count();
