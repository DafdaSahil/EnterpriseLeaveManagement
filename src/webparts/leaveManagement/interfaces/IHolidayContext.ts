import { INormalizedHoliday, THolidayOrigin } from "../interfaces/IHoliday";

export interface IHolidayContext {
  /** Holidays normalised for display, sorted by date ascending. */
  holidays: INormalizedHoliday[];
  /** Just the ISO dates - pass this into the dateUtils helpers. */
  holidayDates: string[];
  loading: boolean;
  /**
   * "sharepoint" when the Holidays list loaded, "fallback" when the built-in
   * default calendar is being used because the list was missing or empty.
   */
  origin: THolidayOrigin;
  /**
   * True when the Holidays list itself was reachable. This is tracked separately
   * from `origin` because an existing-but-empty list still reports "fallback"
   * while being perfectly safe to write to - which is exactly the state you are
   * in when adding the very first holiday.
   */
  listAvailable: boolean;
  reload: () => Promise<void>;
  createHoliday: (holiday: IHolidayDraft) => Promise<void>;
  updateHoliday: (
    holidayId: number,
    holiday: IHolidayDraft,
  ) => Promise<void>;
  removeHoliday: (holidayId: number) => Promise<void>;
}

/** The editable subset of a holiday - mirrors the list columns the form owns. */
export interface IHolidayDraft {
  Title: string;
  /** ISO date string, e.g. "2026-01-26" */
  Date: string;
  Description: string;
  HolidayType: string;
}