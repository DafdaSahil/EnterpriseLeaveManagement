import * as React from "react";
import {
  IHolidayContext,
  IHolidayDraft,
} from "../interfaces/IHolidayContext";
import {
  IHoliday,
  INormalizedHoliday,
  THolidayOrigin,
  THolidaySource,
} from "../interfaces/IHoliday";
import { COMPANY_HOLIDAYS } from "../utils/constants";
import {
  addHoliday,
  deleteHoliday,
  getHolidays,
  updateHoliday,
} from "../services/SPService";
import { formatDateISO, parseISODate } from "../utils/dateUtils";

export const HolidaysContext = React.createContext<IHolidayContext>({
  holidays: [],
  holidayDates: [],
  loading: true,
  origin: "fallback",
  listAvailable: false,
  reload: async () => {
    // No-op until a provider mounts.
  },
  createHoliday: async () => {
    throw new Error("Holidays provider is not mounted.");
  },
  updateHoliday: async () => {
    throw new Error("Holidays provider is not mounted.");
  },
  removeHoliday: async () => {
    throw new Error("Holidays provider is not mounted.");
  },
});

const KNOWN_SOURCES: THolidaySource[] = ["Public", "Restricted", "Company"];

/**
 * Converts a raw list item (or a built-in constant) into the normalised shape
 * every component consumes. Anything unrecognised falls back to "Public" so a
 * typo in the list can never break the calendar.
 */
const normalize = (
  raw: IHoliday,
  index: number,
): INormalizedHoliday | undefined => {
  // Parsed as local midnight so the ISO string round-trips exactly - otherwise
  // a holiday drifts a day in negative-offset timezones and stops being
  // excluded from the business-day maths.
  const parsed = parseISODate(raw.Date);
  const isoDate = formatDateISO(parsed);

  if (!isoDate || isoDate.indexOf("NaN") > -1) {
    return undefined;
  }

  const rawType = String(raw.HolidayType || "").trim();
  const type = (
    KNOWN_SOURCES.find(
      (known) => known.toLowerCase() === rawType.toLowerCase(),
    ) || "Public"
  ) as THolidaySource;

  const name = raw.Title || "Holiday";

  return {
    id: `${isoDate}-${name}-${index}`,
    // Fallback holidays have no Id, which is how the UI knows they are
    // read-only even when an admin is signed in.
    listId: raw.Id,
    name,
    isoDate,
    date: parsed,
    description: raw.Description || "",
    type,
  };
};

const sortByDate = (
  a: INormalizedHoliday,
  b: INormalizedHoliday,
): number => a.date.getTime() - b.date.getTime();

/** Drops the rows the normaliser rejected (unusable dates). */
const normalizeAll = (raw: IHoliday[]): INormalizedHoliday[] =>
  raw
    .map((holiday, index): INormalizedHoliday | undefined =>
      normalize(holiday, index),
    )
    .filter((holiday): holiday is INormalizedHoliday => holiday !== undefined)
    .sort(sortByDate);

/**
 * The built-in calendar, reshaped into the same shape the list produces so
 * both sources flow through one code path.
 */
const getBuiltinHolidays = (): INormalizedHoliday[] =>
  normalizeAll(
    COMPANY_HOLIDAYS.map((holiday) => ({
      Title: holiday.name,
      Date: holiday.date,
      HolidayType: "Public",
    })),
  );

export const HolidaysProvider = ({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element => {
  const [holidays, setHolidays] = React.useState<INormalizedHoliday[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [origin, setOrigin] = React.useState<THolidayOrigin>("fallback");
  const [listAvailable, setListAvailable] = React.useState<boolean>(false);

  const reload = React.useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      const normalized = normalizeAll(await getHolidays());

      setListAvailable(true);

      // An empty list is treated the same as a missing one for display: without
      // any holidays the business-day maths silently over-counts, so we keep
      // the built-in calendar rather than presenting a blank year. Adding the
      // first holiday flips this to "sharepoint" on the next reload.
      if (normalized.length > 0) {
        setHolidays(normalized);
        setOrigin("sharepoint");
      } else {
        setHolidays(getBuiltinHolidays());
        setOrigin("fallback");
      }
    } catch (error) {
      // The "Holidays" list has not been created yet - carry on with defaults.
      console.warn(
        "Holidays list unavailable, using the built-in calendar:",
        error,
      );
      setListAvailable(false);
      setHolidays(getBuiltinHolidays());
      setOrigin("fallback");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect((): void => {
    reload().catch((error) => {
      console.error("Error loading holidays:", error);
    });
  }, [reload]);

  // Writes always re-read the list afterwards. The list is small, and this
  // keeps the in-memory calendar, the balance maths and the grid in step
  // without hand-rolling optimistic updates that can drift out of sync.
  const createHoliday = React.useCallback(
    async (holiday: IHolidayDraft): Promise<void> => {
      await addHoliday(holiday);
      await reload();
    },
    [reload],
  );

  const updateHolidayById = React.useCallback(
    async (holidayId: number, holiday: IHolidayDraft): Promise<void> => {
      await updateHoliday(holidayId, holiday);
      await reload();
    },
    [reload],
  );

  const removeHoliday = React.useCallback(
    async (holidayId: number): Promise<void> => {
      await deleteHoliday(holidayId);
      await reload();
    },
    [reload],
  );

  const holidayDates = React.useMemo(
    (): string[] => holidays.map((holiday) => holiday.isoDate),
    [holidays],
  );

  const value = React.useMemo(
    (): IHolidayContext => ({
      holidays,
      holidayDates,
      loading,
      origin,
      listAvailable,
      reload,
      createHoliday,
      updateHoliday: updateHolidayById,
      removeHoliday,
    }),
    [
      createHoliday,
      holidayDates,
      holidays,
      listAvailable,
      loading,
      origin,
      reload,
      removeHoliday,
      updateHolidayById,
    ],
  );

  return (
    <HolidaysContext.Provider value={value}>
      {children}
    </HolidaysContext.Provider>
  );
};