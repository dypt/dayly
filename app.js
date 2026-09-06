import { formatCompletionTime, formatDayName, localDateToday } from "./date.js";
import { openDaylyDatabase } from "./storage/database.js";
import { createDailyHabit, getHabitsForDate, setHabitCompleted } from "./storage/repository.js";
const APP_VERSION = "v0.1.3-0-gddd4fa4";
const today = localDateToday();
const menuButton = document.querySelector("[data-menu-button]");
const menu = document.querySelector("[data-menu]");
const menuVersion = document.querySelector("[data-menu-version]");
const dayName = document.querySelector("[data-day-name]");
const updateNotice = document.querySelector("[data-update-notice]");
const dayView = document.querySelector("[data-day-view]");
const habitList = document.querySelector("[data-habit-list]");
const emptyState = document.querySelector("[data-empty-state]");
const status = document.querySelector("[data-status]");
const statusCount = document.querySelector("[data-status-count]");
const habitFormPage = document.querySelector("[data-habit-form-page]");
const habitForm = document.querySelector("[data-habit-form]");
const formError = document.querySelector("[data-form-error]");
const storageError = document.querySelector("[data-storage-error]");
if (!menuButton || !menu || !menuVersion || !dayName || !updateNotice || !dayView || !habitList || !emptyState
    || !status || !statusCount || !habitFormPage || !habitForm || !formError || !storageError) {
    throw new Error("The application shell is missing required elements.");
}
const button = menuButton;
const menuPanel = menu;
const updatePanel = updateNotice;
const dayPanel = dayView;
const listPanel = habitList;
const emptyPanel = emptyState;
const statusPanel = status;
const statusCountPanel = statusCount;
const formPanel = habitFormPage;
const form = habitForm;
const errorPanel = formError;
const storageErrorPanel = storageError;
let database;
menuVersion.textContent = APP_VERSION;
dayName.textContent = formatDayName(today);
function showUpdateNotice() {
    updatePanel.hidden = false;
}
function setMenuOpen(isOpen) {
    menuPanel.hidden = !isOpen;
    button.setAttribute("aria-expanded", String(isOpen));
}
function setFormOpen(isOpen) {
    dayPanel.hidden = isOpen;
    formPanel.hidden = !isOpen;
    if (!isOpen) {
        errorPanel.hidden = true;
        errorPanel.textContent = "";
    }
}
function getInput(name) {
    return form.elements.namedItem(name);
}
function getTextArea(name) {
    return form.elements.namedItem(name);
}
function showStorageError() {
    dayPanel.hidden = true;
    formPanel.hidden = true;
    storageErrorPanel.hidden = false;
}
function showFormError(message) {
    errorPanel.textContent = message;
    errorPanel.hidden = false;
}
function habitRow(habit) {
    const row = document.createElement("label");
    row.className = `habit-row${habit.completed ? " is-completed" : ""}`;
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = habit.completed;
    checkbox.setAttribute("aria-label", `Complete ${habit.title}`);
    checkbox.addEventListener("change", async () => {
        if (!database) {
            return;
        }
        checkbox.disabled = true;
        try {
            await setHabitCompleted(database, habit.id, today, checkbox.checked);
            await renderToday();
        }
        catch {
            checkbox.checked = habit.completed;
            showStorageError();
        }
    });
    const content = document.createElement("div");
    const title = document.createElement("p");
    title.className = "habit-title";
    title.textContent = habit.title;
    content.append(title);
    if (habit.notes) {
        const notes = document.createElement("p");
        notes.className = "habit-notes";
        notes.textContent = habit.notes;
        content.append(notes);
    }
    if (habit.completed && habit.completedAt) {
        const completion = document.createElement("p");
        completion.className = "habit-completion";
        completion.textContent = formatCompletionTime(habit.completedAt, today);
        content.append(completion);
    }
    row.append(checkbox, content);
    return row;
}
async function renderToday() {
    if (!database) {
        return;
    }
    const habits = await getHabitsForDate(database, today);
    listPanel.replaceChildren(...habits.map(habitRow));
    const completed = habits.filter((habit) => habit.completed).length;
    statusCountPanel.textContent = `${completed}/${habits.length}`;
    statusPanel.setAttribute("aria-label", `${completed} of ${habits.length} habits completed`);
    emptyPanel.hidden = habits.length > 0;
    listPanel.hidden = habits.length === 0;
}
function openNewHabitForm() {
    form.reset();
    getInput("startDate").value = today;
    getInput("endDate").value = "";
    errorPanel.hidden = true;
    errorPanel.textContent = "";
    setMenuOpen(false);
    setFormOpen(true);
    getInput("title").focus();
}
button.addEventListener("click", () => {
    setMenuOpen(menuPanel.hidden);
});
document.addEventListener("click", (event) => {
    if (!menuPanel.hidden && !menuPanel.contains(event.target) && event.target !== button) {
        setMenuOpen(false);
    }
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        setMenuOpen(false);
    }
});
document.querySelectorAll("[data-add-habit]").forEach((addButton) => {
    addButton.addEventListener("click", openNewHabitForm);
});
document.querySelector("[data-discard-habit]")?.addEventListener("click", () => {
    setFormOpen(false);
});
form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!database) {
        showStorageError();
        return;
    }
    const startDate = getInput("startDate").value;
    const endDate = getInput("endDate").value || undefined;
    if (endDate && endDate < startDate) {
        showFormError("The end date must be on or after the start date.");
        return;
    }
    const saveButton = form.querySelector("[type=submit]");
    if (saveButton) {
        saveButton.disabled = true;
    }
    try {
        await createDailyHabit(database, {
            title: getInput("title").value.trim(),
            notes: getTextArea("notes").value.trim(),
            startDate: startDate,
            endDate: endDate
        });
        setFormOpen(false);
        await renderToday();
    }
    catch {
        showFormError("The habit could not be saved. Please try again.");
    }
    finally {
        if (saveButton) {
            saveButton.disabled = false;
        }
    }
});
async function start() {
    try {
        database = await openDaylyDatabase();
        await renderToday();
    }
    catch {
        showStorageError();
    }
}
void start();
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        void navigator.serviceWorker.register("./sw.js", { scope: "./" }).then((registration) => {
            if (registration.waiting) {
                showUpdateNotice();
            }
            registration.addEventListener("updatefound", () => {
                const installing = registration.installing;
                installing?.addEventListener("statechange", () => {
                    if (installing.state === "installed" && navigator.serviceWorker.controller) {
                        showUpdateNotice();
                    }
                });
            });
            void registration.update();
        });
    });
}
//# sourceMappingURL=app.js.map