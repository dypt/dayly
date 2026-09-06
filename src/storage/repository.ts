import {
  deleteCompletion,
  listCompletionsForDate,
  listHabits,
  listOrderSnapshots,
  putCompletion,
  putHabit,
  putOrderSnapshot,
  type DaylyDatabase
} from "./database.js";
import type { Completion, HabitVersion, LocalDate } from "./types.js";

export type TodayHabit = HabitVersion & {
  completed: boolean;
  completedAt?: string;
};

function isScheduledOn(habit: HabitVersion, localDate: LocalDate): boolean {
  return habit.schedule.type === "daily"
    && localDate >= habit.startDate
    && (!habit.endDate || localDate <= habit.endDate)
    && !habit.archivedAt;
}

function todayOrder(snapshots: Awaited<ReturnType<typeof listOrderSnapshots>>, localDate: LocalDate) {
  return snapshots
    .filter((snapshot) => snapshot.effectiveDate <= localDate)
    .sort((left, right) => right.effectiveDate.localeCompare(left.effectiveDate))[0]?.habitIds ?? [];
}

export async function getHabitsForDate(
  database: DaylyDatabase,
  localDate: LocalDate
): Promise<TodayHabit[]> {
  const [habits, completions, snapshots] = await Promise.all([
    listHabits(database),
    listCompletionsForDate(database, localDate),
    listOrderSnapshots(database)
  ]);
  const completionsByHabit = new Map(
    completions.map((completion) => [completion.habitVersionId, completion])
  );
  const order = todayOrder(snapshots, localDate);
  const orderIndex = new Map(order.map((id, index) => [id, index]));

  return habits
    .filter((habit) => isScheduledOn(habit, localDate))
    .sort((left, right) => {
      const leftIndex = orderIndex.get(left.id) ?? Number.MAX_SAFE_INTEGER;
      const rightIndex = orderIndex.get(right.id) ?? Number.MAX_SAFE_INTEGER;
      return leftIndex - rightIndex || left.createdAt.localeCompare(right.createdAt);
    })
    .map((habit) => ({
      ...habit,
      completed: completionsByHabit.has(habit.id),
      completedAt: completionsByHabit.get(habit.id)?.completedAt
    }));
}

export async function createDailyHabit(
  database: DaylyDatabase,
  input: Pick<HabitVersion, "title" | "notes" | "startDate" | "endDate">
): Promise<HabitVersion> {
  const now = new Date().toISOString();
  const habit: HabitVersion = {
    id: crypto.randomUUID(),
    title: input.title,
    notes: input.notes,
    schedule: { type: "daily" },
    startDate: input.startDate,
    endDate: input.endDate,
    createdAt: now,
    updatedAt: now
  };
  const existing = await listHabits(database);
  await putHabit(database, habit);
  await putOrderSnapshot(database, {
    effectiveDate: input.startDate,
    habitIds: [...existing.map((existingHabit) => existingHabit.id), habit.id]
  });
  return habit;
}

export async function setHabitCompleted(
  database: DaylyDatabase,
  habitVersionId: string,
  localDate: LocalDate,
  completed: boolean
): Promise<void> {
  if (completed) {
    const completion: Completion = {
      habitVersionId,
      localDate,
      completedAt: new Date().toISOString()
    };
    await putCompletion(database, completion);
    return;
  }

  await deleteCompletion(database, habitVersionId, localDate);
}
