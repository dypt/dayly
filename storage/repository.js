import { deleteCompletion, listCompletionsForDate, listHabits, listOrderSnapshots, putCompletion, putHabit, putOrderSnapshot } from "./database.js";
function isScheduledOn(habit, localDate) {
    return habit.schedule.type === "daily"
        && localDate >= habit.startDate
        && (!habit.endDate || localDate <= habit.endDate)
        && !habit.archivedAt;
}
function todayOrder(snapshots, localDate) {
    return snapshots
        .filter((snapshot) => snapshot.effectiveDate <= localDate)
        .sort((left, right) => right.effectiveDate.localeCompare(left.effectiveDate))[0]?.habitIds ?? [];
}
export async function getHabitsForDate(database, localDate) {
    const [habits, completions, snapshots] = await Promise.all([
        listHabits(database),
        listCompletionsForDate(database, localDate),
        listOrderSnapshots(database)
    ]);
    const completionsByHabit = new Map(completions.map((completion) => [completion.habitVersionId, completion]));
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
export async function createDailyHabit(database, input) {
    const now = new Date().toISOString();
    const habit = {
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
export async function setHabitCompleted(database, habitVersionId, localDate, completed) {
    if (completed) {
        const completion = {
            habitVersionId,
            localDate,
            completedAt: new Date().toISOString()
        };
        await putCompletion(database, completion);
        return;
    }
    await deleteCompletion(database, habitVersionId, localDate);
}
//# sourceMappingURL=repository.js.map