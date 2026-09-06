export const DATABASE_NAME = "dayly";
export const DATABASE_VERSION = 1;
export const STORE_NAMES = {
    habits: "habitVersions",
    completions: "completions",
    settings: "settings",
    orderSnapshots: "orderSnapshots"
};
function requestResult(request) {
    return new Promise((resolve, reject) => {
        request.addEventListener("success", () => resolve(request.result));
        request.addEventListener("error", () => reject(request.error));
    });
}
function transactionComplete(transaction) {
    return new Promise((resolve, reject) => {
        transaction.addEventListener("complete", () => resolve());
        transaction.addEventListener("abort", () => reject(transaction.error));
        transaction.addEventListener("error", () => reject(transaction.error));
    });
}
export function openDaylyDatabase(factory = globalThis.indexedDB, name = DATABASE_NAME) {
    return new Promise((resolve, reject) => {
        const request = factory.open(name, DATABASE_VERSION);
        request.addEventListener("upgradeneeded", (event) => {
            const database = request.result;
            const oldVersion = event.oldVersion;
            if (request.transaction && oldVersion < 1) {
                const habits = database.createObjectStore(STORE_NAMES.habits, { keyPath: "id" });
                habits.createIndex("by-start-date", "startDate");
                const completions = database.createObjectStore(STORE_NAMES.completions, {
                    keyPath: ["habitVersionId", "localDate"]
                });
                completions.createIndex("by-date", "localDate");
                database.createObjectStore(STORE_NAMES.settings, { keyPath: "key" });
                database.createObjectStore(STORE_NAMES.orderSnapshots, { keyPath: "effectiveDate" });
            }
        });
        request.addEventListener("success", () => resolve(request.result));
        request.addEventListener("error", () => reject(request.error));
        request.addEventListener("blocked", () => reject(new Error("The Dayly database upgrade is blocked.")));
    });
}
export async function listHabits(database) {
    const transaction = database.transaction(STORE_NAMES.habits, "readonly");
    const habits = await requestResult(transaction.objectStore(STORE_NAMES.habits).getAll());
    await transactionComplete(transaction);
    return habits;
}
export async function listCompletionsForDate(database, localDate) {
    const transaction = database.transaction(STORE_NAMES.completions, "readonly");
    const index = transaction.objectStore(STORE_NAMES.completions).index("by-date");
    const completions = await requestResult(index.getAll(IDBKeyRange.only(localDate)));
    await transactionComplete(transaction);
    return completions;
}
export async function listOrderSnapshots(database) {
    const transaction = database.transaction(STORE_NAMES.orderSnapshots, "readonly");
    const snapshots = await requestResult(transaction.objectStore(STORE_NAMES.orderSnapshots).getAll());
    await transactionComplete(transaction);
    return snapshots;
}
export async function putHabit(database, habit) {
    const transaction = database.transaction(STORE_NAMES.habits, "readwrite");
    transaction.objectStore(STORE_NAMES.habits).put(habit);
    await transactionComplete(transaction);
}
export async function putCompletion(database, completion) {
    const transaction = database.transaction(STORE_NAMES.completions, "readwrite");
    transaction.objectStore(STORE_NAMES.completions).put(completion);
    await transactionComplete(transaction);
}
export async function deleteCompletion(database, habitVersionId, localDate) {
    const transaction = database.transaction(STORE_NAMES.completions, "readwrite");
    transaction.objectStore(STORE_NAMES.completions).delete([habitVersionId, localDate]);
    await transactionComplete(transaction);
}
export async function putOrderSnapshot(database, snapshot) {
    const transaction = database.transaction(STORE_NAMES.orderSnapshots, "readwrite");
    transaction.objectStore(STORE_NAMES.orderSnapshots).put(snapshot);
    await transactionComplete(transaction);
}
export async function putSetting(database, setting) {
    const transaction = database.transaction(STORE_NAMES.settings, "readwrite");
    transaction.objectStore(STORE_NAMES.settings).put(setting);
    await transactionComplete(transaction);
}
//# sourceMappingURL=database.js.map