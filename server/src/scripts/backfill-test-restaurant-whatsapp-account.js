db.whatsapp_accounts.updateOne(
  { clientId: ObjectId("6aa44c3498b20b15a2dbf520") },
  {
    $set: {
      instanceId: "6aa44c3398b20b15a2dbf51e",
      phoneNumber: "918698884383",
      displayName: "Minhaz Shaikh",
      status: "connected",
      sessionPath: "C:\\Users\\shaik\\Blastup\\server\\sessions\\6aa44c3398b20b15a2dbf51e",
      safeMode: true,
      connectedAt: ISODate("2026-09-14T10:09:55.130Z"),
      lastSeenAt: new Date()
    },
    $setOnInsert: {
      clientId: ObjectId("6aa44c3498b20b15a2dbf520")
    }
  },
  { upsert: true }
)
