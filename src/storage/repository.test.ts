import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { openDaylyDatabase } from "./database.js";
import { createDailyHabit, getHabitsForDate, setHabitCompleted } from "./repository.js";

const databaseName = `dayly-repository-test-${crypto.randomUUID()}`;
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

test("creates a daily habit and persists completion state", async () => {
  const database = await openDaylyDatabase(indexedDB, databaseName);
  databases.push(database);

  const habit = await createDailyHabit(database, {
    title: "Drink water",
    notes: "Keep a glass nearby.",
    startDate: "2026-09-06"
  });

  let habits = await getHabitsForDate(database, "2026-09-06");
  assert.equal(habits.length, 1);
  assert.equal(habits[0]?.title, "Drink water");
  assert.equal(habits[0]?.completed, false);

  await setHabitCompleted(database, habit.id, "2026-09-06", true);
  habits = await getHabitsForDate(database, "2026-09-06");
  assert.equal(habits[0]?.completed, true);

  await setHabitCompleted(database, habit.id, "2026-09-06", false);
  habits = await getHabitsForDate(database, "2026-09-06");
  assert.equal(habits[0]?.completed, false);
});

test("does not schedule a daily habit before its start date", async () => {
  const database = await openDaylyDatabase(indexedDB, `${databaseName}-future`);
  databases.push(database);

  await createDailyHabit(database, {
    title: "Start later",
    notes: "",
    startDate: "2026-09-07"
  });

  assert.deepEqual(await getHabitsForDate(database, "2026-09-06"), []);
});
