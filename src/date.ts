import type { LocalDate } from "./storage/types.js";

export function localDateToday(date = new Date()): LocalDate {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}` as LocalDate;
}
