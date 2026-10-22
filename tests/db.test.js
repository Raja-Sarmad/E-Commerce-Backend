import assert from "node:assert/strict";
import { test } from "node:test";
import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";

test("startup waits for MongoDB to connect", async (t) => {
  let finishConnection;
  t.mock.method(mongoose, "connect", () => new Promise((resolve) => {
    finishConnection = resolve;
  }));
  let completed = false;
  const startup = connectDB().then(() => { completed = true; });
  await Promise.resolve();
  assert.equal(completed, false);
  finishConnection();
  await startup;
  assert.equal(completed, true);
});

test("failed connection rejects startup without scheduling a background retry", async (t) => {
  const error = new Error("connect ECONNREFUSED 127.0.0.1:27017");
  t.mock.method(mongoose, "connect", async () => { throw error; });
  const timer = t.mock.method(globalThis, "setTimeout", () => {});
  const events = ["connected", "error", "disconnected"];
  const listeners = events.map((event) => mongoose.connection.listenerCount(event));
  await assert.rejects(connectDB(), (actual) => actual === error);
  await assert.rejects(connectDB(), (actual) => actual === error);
  assert.equal(timer.mock.callCount(), 0);
  assert.deepEqual(events.map((event) => mongoose.connection.listenerCount(event)), listeners);
});

test("a temporary Atlas DNS failure retries before startup completes", async (t) => {
  let attempts = 0;
  const connect = t.mock.method(mongoose, "connect", async () => {
    attempts += 1;
    if (attempts === 1) throw Object.assign(new Error("Temporary DNS failure"), { code: "ESERVFAIL" });
  });
  let completed = false;
  const startup = connectDB().then(() => { completed = true; });
  await Promise.resolve();
  assert.equal(completed, false);
  await startup;
  assert.equal(connect.mock.callCount(), 2);
  assert.equal(completed, true);
});

test("persistent DNS failures stop after three attempts", async (t) => {
  const error = Object.assign(new Error("DNS unavailable"), { code: "ESERVFAIL" });
  const connect = t.mock.method(mongoose, "connect", async () => { throw error; });
  await assert.rejects(connectDB(), (actual) => actual === error);
  assert.equal(connect.mock.callCount(), 3);
});
