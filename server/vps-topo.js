const mongoose = require('mongoose');
require('dotenv').config({ path: '/opt/tabdeal/Blastup/.env' });

async function verify() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const buildInfo = await db.admin().command({ buildinfo: 1 });
  console.log("MongoDB Version:", buildInfo.version);

  try {
    const isMaster = await db.admin().command({ isMaster: 1 });
    console.log("isMaster command output:");
    console.log(JSON.stringify(isMaster, null, 2));
    
    if (isMaster.setName) {
      console.log("Topology: Replica Set (Name:", isMaster.setName, ")");
    } else {
      console.log("Topology: Standalone");
    }
  } catch (e) {
    console.error("isMaster error", e);
  }

  process.exit(0);
}
verify();
