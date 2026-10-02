export type THolidaySource = "Public" | "Restricted" | "Company";

/** Raw shape as returned by the SharePoint "Holidays" list. */
export interface IHoliday {
  Id?: number;
  /**
   * SharePoint's built-in required column - we use it for the holiday name.
   * A separate "Name" column cannot be used here: Name is reserved on
   * SharePoint list items and querying it breaks the request.
   */
  Title?: string;
  /** ISO date string, e.g. "2026-01-26" */
  Date: string;
  Description?: string;
  HolidayType?: string;
}

/**
 * A holiday after normalisation. Components consume this shape only, so the
 * rest of the app never has to care whether the value came from SharePoint
 * or from the built-in fallback calendar.
 */
export interface INormalizedHoliday {
  id: string;
  /**
   * The SharePoint item Id, present only for holidays that came from the list.
   * Edit and delete need it - holidays from the built-in fallback calendar
   * cannot be changed from the UI.
   */
  listId?: number;
  name: string;
  /** "yyyy-MM-dd" - the format expected by the dateUtils helpers. */
  isoDate: string;
  date: Date;
  description: string;
  type: THolidaySource;
}

export type THolidayOrigin = "sharepoint" | "fallback";