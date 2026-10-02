// ────────────────────────────────────────────────────────────
// Date Utilities
// ────────────────────────────────────────────────────────────

import { COMPANY_HOLIDAYS } from "./constants";

export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatDateISO = (date: Date | string): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Parses a "yyyy-MM-dd" string (with or without a time part) into a Date at
 * *local* midnight.
 *
 * `new Date("2026-01-26")` treats the string as UTC midnight, which lands on
 * the previous day in any timezone west of Greenwich. That matters here: the
 * ISO string is what calculateBusinessDays matches holidays against, so a
 * one-day drift means a holiday silently stops being excluded from leave.
 */
export const parseISODate = (value: Date | string): Date => {
  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value).trim());

  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  return new Date(value);
};

export const calculateDays = (start: Date | string, end: Date | string): number => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

export const calculateBusinessDays = (
  start: Date | string,
  end: Date | string,
  holidays: string[] = COMPANY_HOLIDAYS.map((holiday) => holiday.date),
): number => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  let count = 0;
  const holidaySet: Set<string> = new Set(holidays);

  const current = new Date(startDate);
  while (current.getTime() <= endDate.getTime()) {
    const dayOfWeek = current.getDay();
    const isoDate = formatDateISO(current);
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(isoDate)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
};

export const getDateRange = (start: Date | string, end: Date | string): string => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (formatDate(startDate) === formatDate(endDate)) {
    return formatDate(startDate);
  }

  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};

export const isFutureDate = (date: Date | string): boolean => {
  const checkDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return checkDate >= today;
};

export const isDateRangeValid = (
  start: Date | string,
  end: Date | string
): boolean => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return startDate <= endDate;
};

export const getMinDate = (): string => {
  const today = new Date();
  return formatDateISO(today);
};

export const addDays = (date: Date | string, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const getDayOfWeek = (date: Date | string): string => {
  const d = new Date(date);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[d.getDay()];
};

/**
 * Calculates the number of leave days as a fractional value.
 * Full days count as 1, half days count as 0.5.
 * Weekends and company holidays are excluded.
 */
export const calculateFractionalDays = (
  start: Date | string,
  end: Date | string,
  halfDayType: string = "None",
  holidays: string[] = COMPANY_HOLIDAYS.map((holiday) => holiday.date),
): number => {
  const businessDays = calculateBusinessDays(start, end, holidays);

  // Only apply half-day logic when it's a single day and a half-day type is selected
  if (businessDays === 1 && halfDayType !== "None") {
    return 0.5;
  }

  return businessDays;
};
