import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { DATABASE_VERSION, openDaylyDatabase, STORE_NAMES } from "./database.js";

const databaseName = `dayly-test-${crypto.randomUUID()}`;
const databases: IDBDatabase[] = [];

afterEach(async () => {
  for (const database of databases.splice(0)) {
    database.close();
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(database.name);
      request.addEventListener("success", () => resolve());
      request.addEventListener("error", () => reject(request.error));
    });
  }
});

test("creates the version one Dayly schema", async () => {
  const database = await openDaylyDatabase(indexedDB, databaseName);
  databases.push(database);

  assert.equal(database.version, DATABASE_VERSION);
  assert.deepEqual(Array.from(database.objectStoreNames).sort(), [
    STORE_NAMES.completions,
    STORE_NAMES.habits,
    STORE_NAMES.orderSnapshots,
    STORE_NAMES.settings
  ].sort());
  assert.deepEqual(Array.from(database.transaction(STORE_NAMES.completions).objectStore(STORE_NAMES.completions).indexNames), ["by-date"]);
});

test("reopens the existing schema without recreating it", async () => {
  const first = await openDaylyDatabase(indexedDB, databaseName);
  databases.push(first);
  first.close();
  databases.pop();

  const second = await openDaylyDatabase(indexedDB, databaseName);
  databases.push(second);
  assert.equal(second.version, DATABASE_VERSION);
});
