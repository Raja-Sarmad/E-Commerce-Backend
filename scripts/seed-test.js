process.env.NODE_ENV = "test";

import { MongoMemoryServer } from "mongodb-memory-server";

async function main() {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri("novamart_seed_test");
  const mode = process.argv.includes("--demo") ? "--demo" : "defaults";
  console.log(`› running seed script (${mode}) against in-memory MongoDB`);
  await import("../src/seed/seed.js");
}

main().catch((err) => {
  console.error("✗ seed test failed:", err.message);
  process.exit(1);
});
