import type { LocalDate } from "./storage/types.js";

export function localDateToday(date = new Date()): LocalDate {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}` as LocalDate;
}

export function dateFromLocalDate(localDate: LocalDate): Date {
  const [year, month, day] = localDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDayName(localDate: LocalDate): string {
  return new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(dateFromLocalDate(localDate));
}

export function formatCompletionTime(completedAt: string, scheduledDate: LocalDate): string {
  const completionDate = new Date(completedAt);
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(completionDate);

  if (localDateToday(completionDate) === scheduledDate) {
    return `Completed at ${time}`;
  }

  const date = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(completionDate);
  return `Completed ${date} at ${time}`;
}
