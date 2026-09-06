export type LocalDate = `${number}-${number}-${number}`;

export type HabitSchedule = {
  type: "daily";
};

export type HabitVersion = {
  id: string;
  title: string;
  notes: string;
  schedule: HabitSchedule;
  startDate: LocalDate;
  endDate?: LocalDate;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
};

export type Completion = {
  habitVersionId: string;
  localDate: LocalDate;
  completedAt: string;
};

export type Setting = {
  key: string;
  value: string;
};

export type OrderSnapshot = {
  effectiveDate: LocalDate;
  habitIds: string[];
};
