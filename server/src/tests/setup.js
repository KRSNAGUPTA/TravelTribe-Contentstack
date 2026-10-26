import { beforeAll, afterAll } from "vitest";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongod;

beforeAll(async () => {
  // Replica set required for transactions
  mongod = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" },
  });
  await mongoose.connect(mongod.getUri(), { dbName: "traveltribe-test" });
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});