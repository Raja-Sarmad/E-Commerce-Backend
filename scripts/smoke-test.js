/**
 * Smoke test — boots the app against an in-memory MongoDB,
 * exercises the seed script path and a few API routes.
 * Not part of production; run with: node scripts/smoke-test.js
 */
process.env.NODE_ENV = "test";

import { MongoMemoryServer } from "mongodb-memory-server";

async function main() {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri("novamart_test");

  console.log("› starting app against in-memory MongoDB");
  const app = (await import("../src/app.js")).default;
  const config = (await import("../src/config/index.js")).default;
  const { connectDB, disconnectDB } = await import("../src/config/db.js");

  await connectDB();

  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  console.log(`› app listening on :${port}`);

  const base = `http://127.0.0.1:${port}${config.apiPrefix}`;

  let cookieHeader = "";

  const get = async (path) => {
    const res = await fetch(base + path, {
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    });
    return { status: res.status, body: await res.json() };
  };

  const post = async (path, body) => {
    const res = await fetch(base + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(cookieHeader ? { cookie: cookieHeader } : {}) },
      body: JSON.stringify(body),
    });
    const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    if (setCookies.length) {
      cookieHeader = setCookies
        .map((c) => c.split(";")[0])
        .join("; ");
    }
    return { status: res.status, body: await res.json(), headers: res.headers };
  };

  // health
  let r = await get("/health");
  console.log(`[health] ${r.status}`, r.body.message);

  // public products
  r = await get("/products");
  console.log(`[products:list] ${r.status}`);

  // register
  r = await post("/auth/register", { name: "Test User", email: "test@example.com", password: "Test@12345" });
  console.log(`[auth:register] ${r.status}`, r.body.success ? "OK" : r.body.message);

  // login
  r = await post("/auth/login", { email: "test@example.com", password: "Test@12345" });
  console.log(`[auth:login] ${r.status}`, r.body.success ? "OK" : r.body.message, `cookies:${cookieHeader.length > 0}`);

  // me
  r = await get("/users/me");
  console.log(`[users:me] ${r.status}`, r.body.data ? r.body.data.email : "FAIL");

  // create product (should fail without auth)
  r = await post("/products/admin", { name: "X", price: 10 });
  console.log(`[products:admin-unauth] ${r.status} (expected 401)`);

  server.close();
  await disconnectDB();
  await mongod.stop();
  console.log("✓ smoke test complete");
  process.exit(0);
}

main().catch((err) => {
  console.error("✗ smoke test failed:", err.message);
  process.exit(1);
});
