import * as React from "react";
import { DatePicker, DayOfWeek } from "@fluentui/react";
import MainLayout from "../../layout/MainLayout";
import { HolidaysContext } from "../../context/HolidaysContext";
import { AuthContext } from "../../context/AuthContext";
import {
  INormalizedHoliday,
  THolidaySource,
} from "../../interfaces/IHoliday";
import { IHolidayDraft } from "../../interfaces/IHolidayContext";
import {
  formatDate,
  formatDateISO,
  getDayOfWeek,
  parseISODate,
} from "../../utils/dateUtils";
import "./holiday-calendar.css";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const SOURCE_LABELS: Record<THolidaySource, string> = {
  Public: "Public holiday",
  Restricted: "Restricted holiday",
  Company: "Company holiday",
};

const SOURCE_HINTS: Record<THolidaySource, string> = {
  Public: "Declared public holiday - office closed for everyone.",
  Restricted: "Optional holiday. Confirm with your manager before applying.",
  Company: "Company-wide day off declared by HR.",
};

const KNOWN_TYPE_OPTIONS: THolidaySource[] = ["Public", "Restricted", "Company"];

/** Monday-first offset for the 1st of the given month (0 = Monday). */
const getLeadingBlanks = (year: number, month: number): number => {
  const jsDay = new Date(year, month, 1).getDay(); // 0 = Sunday
  return (jsDay + 6) % 7;
};

const daysInMonth = (year: number, month: number): number =>
  new Date(year, month + 1, 0).getDate();

const formatCountdown = (holiday: INormalizedHoliday): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round(
    (holiday.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diff === 0) {
    return "Today";
  }

  if (diff === 1) {
    return "Tomorrow";
  }

  if (diff < 0) {
    const past = Math.abs(diff);
    return past === 1 ? "Yesterday" : `${past} days ago`;
  }

  return `in ${diff} days`;
};

// ── Holiday Form ─────────────────────────────────────────────

const EMPTY_DRAFT: IHolidayDraft = {
  Title: "",
  Date: "",
  Description: "",
  HolidayType: "Public",
};

interface IHolidayFormErrors {
  Title?: string;
  Date?: string;
}

interface IHolidayFormProps {
  /** Present when editing, absent when creating. */
  initial?: INormalizedHoliday;
  /** Dates already used by another holiday - blocks duplicates. */
  takenDates: Map<string, string>;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (draft: IHolidayDraft) => Promise<void>;
}

const HolidayForm = ({
  initial,
  takenDates,
  saving,
  onCancel,
  onSubmit,
}: IHolidayFormProps): JSX.Element => {
  const [draft, setDraft] = React.useState<IHolidayDraft>(() =>
    initial
      ? {
          Title: initial.name,
          Date: initial.isoDate,
          Description: initial.description,
          HolidayType: initial.type,
        }
      : { ...EMPTY_DRAFT },
  );
  const [errors, setErrors] = React.useState<IHolidayFormErrors>({});
  const [submitError, setSubmitError] = React.useState<string>("");

  const isEditing = initial !== undefined;

  const validate = (): IHolidayFormErrors => {
    const found: IHolidayFormErrors = {};

    if (!draft.Title.trim()) {
      found.Title = "Enter a holiday name.";
    } else if (draft.Title.trim().length < 2) {
      found.Title = "Use at least 2 characters.";
    }

    if (!draft.Date) {
      found.Date = "Pick a date.";
    } else if (draft.Date.indexOf("NaN") > -1) {
      found.Date = "That date is not valid.";
    } else {
      // The grid renders one holiday per day, so a duplicate would silently
      // hide one of the two. Catch it here instead.
      const clashName = takenDates.get(draft.Date);

      if (clashName) {
        found.Date = `${formatDate(parseISODate(draft.Date))} is already taken by "${clashName}".`;
      }
    }

    return found;
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setSubmitError("");

    const found = validate();
    setErrors(found);

    if (Object.keys(found).length > 0) {
      return;
    }

    try {
      await onSubmit({
        Title: draft.Title.trim(),
        Date: draft.Date,
        Description: draft.Description.trim(),
        HolidayType: draft.HolidayType,
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Could not save the holiday. Check that the Holidays list exists and that you have permission to edit it.",
      );
    }
  };

  const getFieldError = (field: keyof IHolidayFormErrors): string =>
    errors[field] || "";

  return (
    <form onSubmit={handleSubmit} className="holidayForm">
      {submitError && (
        <div className="holidayFormError" role="alert">
          {submitError}
        </div>
      )}

      <div className="formGroup">
        <label className="label" htmlFor="holidayTitle">
          Holiday name <span className="required">*</span>
        </label>
        <input
          id="holidayTitle"
          type="text"
          className={`input ${getFieldError("Title") ? "error" : ""}`}
          value={draft.Title}
          placeholder="e.g. Republic Day"
          onChange={(event) =>
            setDraft({ ...draft, Title: event.target.value })
          }
        />
        {getFieldError("Title") && (
          <span className="errorMessage">{getFieldError("Title")}</span>
        )}
      </div>

      <div className="formRow">
        <div className="formGroup">
          <label className="label" htmlFor="holidayDate">
            Date <span className="required">*</span>
          </label>
          <DatePicker
            id="holidayDate"
            value={draft.Date ? parseISODate(draft.Date) : undefined}
            onSelectDate={(date?: Date | null): void =>
              setDraft({
                ...draft,
                Date: date ? formatDateISO(date) : "",
              })
            }
            firstDayOfWeek={DayOfWeek.Monday}
            formatDate={(date?: Date): string =>
              date ? formatDateISO(date) : ""
            }
            placeholder="Select date"
            className={`datePickerControl ${
              getFieldError("Date") ? "error" : ""
            }`}
          />
          {getFieldError("Date") && (
            <span className="errorMessage">{getFieldError("Date")}</span>
          )}
        </div>

        <div className="formGroup">
          <label className="label" htmlFor="holidayType">
            Type
          </label>
          <select
            id="holidayType"
            className="input"
            value={draft.HolidayType}
            onChange={(event) =>
              setDraft({ ...draft, HolidayType: event.target.value })
            }
          >
            {KNOWN_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {SOURCE_LABELS[type]}
              </option>
            ))}
          </select>
          <span className="holidayFieldHint">{SOURCE_HINTS.Public}</span>
        </div>
      </div>

      <div className="formGroup">
        <label className="label" htmlFor="holidayDescription">
          Description
        </label>
        <textarea
          id="holidayDescription"
          className="holidayTextarea"
          rows={3}
          value={draft.Description}
          placeholder="Optional note, e.g. office closed all day"
          onChange={(event) =>
            setDraft({ ...draft, Description: event.target.value })
          }
        />
      </div>

      <div className="formButtons">
        <button
          type="button"
          className="btnCancel"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
        <button type="submit" className="btnSubmit" disabled={saving}>
          {saving ? "Saving..." : isEditing ? "Save changes" : "Add holiday"}
        </button>
      </div>
    </form>
  );
};

// ── Delete Confirm ───────────────────────────────────────────

interface IDeleteConfirmProps {
  holiday: INormalizedHoliday;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

const DeleteConfirm = ({
  holiday,
  deleting,
  onCancel,
  onConfirm,
}: IDeleteConfirmProps): JSX.Element => {
  const [error, setError] = React.useState<string>("");

  const handleConfirm = async (): Promise<void> => {
    setError("");

    try {
      await onConfirm();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not delete the holiday. Check your permissions on the Holidays list.",
      );
    }
  };

  return (
    <>
      <div className="holidayModalBody">
        {error && (
          <div className="holidayFormError" role="alert">
            {error}
          </div>
        )}

        <p className="holidayConfirmText">
          Delete <strong>{holiday.name}</strong> on{" "}
          <strong>
            {getDayOfWeek(holiday.date)}, {formatDate(holiday.date)}
          </strong>
          ?
        </p>

        <p className="holidayConfirmWarn">
          This removes it for everyone. Leave already taken on that date will
          start counting that day again.
        </p>
      </div>

      <div className="holidayModalFooter">
        <button
          type="button"
          className="holidayBtn"
          onClick={onCancel}
          disabled={deleting}
        >
          Keep it
        </button>
        <button
          type="button"
          className="holidayBtnDanger"
          onClick={() => {
            handleConfirm().catch(() => {
              // Already surfaced through the error state above.
            });
          }}
          disabled={deleting}
        >
          {deleting ? "Deleting..." : "Delete holiday"}
        </button>
      </div>
    </>
  );
};

// ── Mini Month ───────────────────────────────────────────────
interface IMiniMonthProps {
  year: number;
  month: number;
  holidayMap: Map<string, INormalizedHoliday>;
  todayIso: string;
  selectedIso: string;
  onSelect: (holiday: INormalizedHoliday) => void;
}

const MiniMonth = ({
  year,
  month,
  holidayMap,
  todayIso,
  selectedIso,
  onSelect,
}: IMiniMonthProps): JSX.Element => {
  const blanks = getLeadingBlanks(year, month);
  const total = daysInMonth(year, month);
  const cells: (number | null)[] = [
    ...Array(blanks).fill(null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];

  // Pad the final week so every month renders as complete rows.
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  const monthHolidayCount = Array.from(holidayMap.keys()).filter((iso) =>
    iso.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`),
  ).length;

  return (
    <div className="holidayMonth">
      <div className="holidayMonthHeader">
        <h3 className="holidayMonthName">{MONTH_NAMES[month]}</h3>

        {monthHolidayCount > 0 && (
          <span className="holidayMonthCount">
            {monthHolidayCount} {monthHolidayCount === 1 ? "holiday" : "holidays"}
          </span>
        )}
      </div>

      <div className="holidayWeekHead" aria-hidden="true">
        {WEEKDAYS.map((day) => (
          <span key={day} className="holidayWeekLabel">
            {day}
          </span>
        ))}
      </div>

      <div className="holidayDays">
        {weeks.map((week, weekIndex) => (
          <div className="holidayWeek" key={`w-${weekIndex}`}>
            {week.map((day, dayIndex) => {
              if (day === null) {
                return (
                  <span
                    key={`b-${dayIndex}`}
                    className="holidayDay empty"
                  />
                );
              }

              const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(
                day,
              ).padStart(2, "0")}`;
              const holiday = holidayMap.get(iso);
              const isWeekend = [0, 6].indexOf(
                new Date(year, month, day).getDay(),
              ) > -1;

              const classNames = [
                "holidayDay",
                isWeekend && !holiday ? "weekend" : "",
                holiday ? `hasHoliday ${holiday.type.toLowerCase()}` : "",
                iso === todayIso ? "isToday" : "",
                holiday && holiday.isoDate === selectedIso ? "isSelected" : "",
              ]
                .filter(Boolean)
                .join(" ");

              if (!holiday) {
                return (
                  <span key={iso} className={classNames}>
                    {day}
                  </span>
                );
              }

              return (
                <button
                  key={iso}
                  type="button"
                  className={classNames}
                  onClick={() => onSelect(holiday)}
                  title={`${holiday.name} - ${formatDate(holiday.date)}`}
                  aria-label={`${holiday.name}, ${formatDate(holiday.date)}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Large Month View ─────────────────────────────────────────
interface ILargeMonthViewProps {
  year: number;
  month: number;
  holidayMap: Map<string, INormalizedHoliday>;
  todayIso: string;
  selectedIso: string;
  onSelect: (holiday: INormalizedHoliday) => void;
}

const LargeMonthView = ({
  year,
  month,
  holidayMap,
  todayIso,
  selectedIso,
  onSelect,
}: ILargeMonthViewProps): JSX.Element => {
  const blanks = getLeadingBlanks(year, month);
  const total = daysInMonth(year, month);
  const cells: (number | null)[] = [
    ...Array(blanks).fill(null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  const monthHolidays = Array.from(holidayMap.values())
    .filter((h) => {
      const d = h.date;
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="holidayLargeMonth">
      <div className="holidayLargeMonthHeader">
        <h3 className="holidayLargeMonthName">
          {MONTH_NAMES[month]} {year}
        </h3>
        <span className="holidayLargeMonthCount">
          {monthHolidays.length} {monthHolidays.length === 1 ? "holiday" : "holidays"}
        </span>
      </div>

      <div className="holidayLargeWeekHead" aria-hidden="true">
        {WEEKDAYS.map((day) => (
          <span key={day} className="holidayLargeWeekLabel">
            {day}
          </span>
        ))}
      </div>

      <div className="holidayLargeDays">
        {weeks.map((week, weekIndex) => (
          <div className="holidayLargeWeek" key={`w-${weekIndex}`}>
            {week.map((day, dayIndex) => {
              if (day === null) {
                return (
                  <span
                    key={`b-${dayIndex}`}
                    className="holidayLargeDay empty"
                  />
                );
              }

              const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(
                day,
              ).padStart(2, "0")}`;
              const holiday = holidayMap.get(iso);
              const isWeekend = [0, 6].indexOf(
                new Date(year, month, day).getDay(),
              ) > -1;

              const classNames = [
                "holidayLargeDay",
                isWeekend && !holiday ? "weekend" : "",
                holiday ? `hasHoliday ${holiday.type.toLowerCase()}` : "",
                iso === todayIso ? "isToday" : "",
                holiday && holiday.isoDate === selectedIso ? "isSelected" : "",
              ]
                .filter(Boolean)
                .join(" ");

              if (!holiday) {
                return (
                  <span key={iso} className={classNames}>
                    {day}
                  </span>
                );
              }

              return (
                <button
                  key={iso}
                  type="button"
                  className={classNames}
                  onClick={() => onSelect(holiday)}
                  title={`${holiday.name} - ${formatDate(holiday.date)}`}
                  aria-label={`${holiday.name}, ${formatDate(holiday.date)}`}
                >
                  <span className="holidayLargeDayNumber">{day}</span>
                  <span className="holidayLargeDayName">{holiday.name}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {monthHolidays.length > 0 && (
        <div className="holidayLargeMonthList">
          <h4 className="holidayLargeMonthListTitle">
            Holidays in {MONTH_NAMES[month]}
          </h4>
          {monthHolidays.map((holiday) => (
            <button
              key={holiday.id}
              type="button"
              className={`holidayLargeMonthListItem ${holiday.type.toLowerCase()} ${
                holiday.isoDate === selectedIso ? "isSelected" : ""
              }`}
              onClick={() => onSelect(holiday)}
            >
              <div className="holidayLargeMonthListItemDate">
                <span className="holidayLargeMonthListItemDay">
                  {holiday.date.getDate()}
                </span>
                <span className="holidayLargeMonthListItemMonth">
                  {MONTH_NAMES[holiday.date.getMonth()].slice(0, 3)}
                </span>
              </div>
              <div className="holidayLargeMonthListItemInfo">
                <span className="holidayLargeMonthListItemName">
                  {holiday.name}
                </span>
                <span className="holidayLargeMonthListItemMeta">
                  {getDayOfWeek(holiday.date)}, {formatDate(holiday.date)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Page ─────────────────────────────────────────────────────
const HolidayCalendar = (): JSX.Element => {
  const {
    holidays,
    loading,
    origin,
    listAvailable,
    reload,
    createHoliday,
    updateHoliday,
    removeHoliday,
  } = React.useContext(HolidaysContext);
  const { user } = React.useContext(AuthContext);

  const isAdmin = user?.Role === "Admin";

  const [selectedYear, setSelectedYear] = React.useState<number>(
    new Date().getFullYear(),
  );
  const [selectedIso, setSelectedIso] = React.useState<string>("");

  // View mode: "year" shows all 12 months, "month" shows one large month
  const [viewMode, setViewMode] = React.useState<"year" | "month">("year");
  const [selectedMonth, setSelectedMonth] = React.useState<number>(
    new Date().getMonth(),
  );

  // Modal state: "create" opens a blank form, an INormalizedHoliday opens that
  // one for editing, and deleting is a two-step confirmation.
  const [formMode, setFormMode] = React.useState<
    "closed" | "create" | "edit"
  >("closed");
  const [editingHoliday, setEditingHoliday] =
    React.useState<INormalizedHoliday | undefined>(undefined);
  const [pendingDelete, setPendingDelete] =
    React.useState<INormalizedHoliday | undefined>(undefined);
  const [saving, setSaving] = React.useState<boolean>(false);
  const [deleting, setDeleting] = React.useState<boolean>(false);

  const closeModals = (): void => {
    setFormMode("closed");
    setEditingHoliday(undefined);
    setPendingDelete(undefined);
  };

  const holidayMap = React.useMemo((): Map<string, INormalizedHoliday> => {
    const map = new Map<string, INormalizedHoliday>();
    holidays.forEach((holiday) => map.set(holiday.isoDate, holiday));
    return map;
  }, [holidays]);

  /** ISO date -> holiday name, used for duplicate detection in the form. */
  const takenDates = React.useMemo((): Map<string, string> => {
    const map = new Map<string, string>();
    holidays.forEach((holiday) => map.set(holiday.isoDate, holiday.name));
    return map;
  }, [holidays]);

  /**
   * The same map minus the holiday being edited, otherwise saving without
   * changing the date would collide with itself.
   */
  const availableDates = React.useMemo((): Map<string, string> => {
    if (!editingHoliday) {
      return takenDates;
    }

    const map = new Map<string, string>(takenDates);
    map.delete(editingHoliday.isoDate);
    return map;
  }, [editingHoliday, takenDates]);

  const years = React.useMemo((): number[] => {
    const set = new Set<number>(holidays.map((h) => h.date.getFullYear()));
    set.add(new Date().getFullYear());
    // Always offer the adjacent years so the calendar is never a dead end.
    const current = new Date().getFullYear();
    set.add(current - 1);
    set.add(current + 1);
    return Array.from(set)
      .filter((year) => !isNaN(year))
      .sort((a, b) => a - b);
  }, [holidays]);

  const yearHolidays = React.useMemo(
    (): INormalizedHoliday[] =>
      holidays.filter((holiday) => holiday.date.getFullYear() === selectedYear),
    [holidays, selectedYear],
  );

  const upcoming = React.useMemo((): INormalizedHoliday[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return holidays
      .filter((holiday) => holiday.date.getTime() >= today.getTime())
      .slice(0, 6);
  }, [holidays]);

  const selectedHoliday = selectedIso ? holidayMap.get(selectedIso) : undefined;

  React.useEffect((): void => {
    // Keep the highlighted day inside the visible year.
    if (selectedIso && !selectedIso.startsWith(String(selectedYear))) {
      setSelectedIso("");
    }
  }, [selectedIso, selectedYear]);

  const todayIso = formatDateISO(new Date());

  const stats = React.useMemo((): Record<THolidaySource, number> => {
    return yearHolidays.reduce(
      (accumulator, holiday) => {
        accumulator[holiday.type] += 1;
        return accumulator;
      },
      { Public: 0, Restricted: 0, Company: 0 } as Record<THolidaySource, number>,
    );
  }, [yearHolidays]);

  const currentMonth = new Date().getMonth();

  const openCreate = (): void => {
    setEditingHoliday(undefined);
    setFormMode("create");
  };

  const openEdit = (holiday: INormalizedHoliday): void => {
    setEditingHoliday(holiday);
    setFormMode("edit");
  };

  const handleFormSubmit = async (draft: IHolidayDraft): Promise<void> => {
    setSaving(true);

    try {
      if (formMode === "edit") {
        if (editingHoliday?.listId === undefined) {
          // Falling through to create here would silently add a duplicate
          // instead of editing the record the admin picked.
          throw new Error(
            "That holiday cannot be edited because it is not stored in the Holidays list.",
          );
        }

        await updateHoliday(editingHoliday.listId, draft);
      } else {
        await createHoliday(draft);
      }

      // Follow the record into the grid so the admin sees the result land.
      if (draft.Date) {
        setSelectedIso(draft.Date);
        setSelectedYear(Number(draft.Date.slice(0, 4)));
      }

      closeModals();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    if (pendingDelete?.listId === undefined) {
      return;
    }

    setDeleting(true);

    try {
      await removeHoliday(pendingDelete.listId);

      if (selectedIso === pendingDelete.isoDate) {
        setSelectedIso("");
      }

      setPendingDelete(undefined);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <MainLayout>
      <div className="holidayPage">
        {/* Page Header */}
        <div className="holidayHeader">
          <div>
            <h1 className="holidayTitle">Holiday Calendar</h1>
            <p className="holidaySubtitle">
              Company holidays for {selectedYear}. Holidays are excluded
              automatically when leave days are calculated.
            </p>
          </div>

          <div className="holidayActions">
            <div className="holidayViewToggle">
              <button
                className={`holidayViewBtn ${viewMode === "year" ? "active" : ""}`}
                type="button"
                onClick={() => setViewMode("year")}
                aria-label="Year view"
                title="Year view"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>Year</span>
              </button>
              <button
                className={`holidayViewBtn ${viewMode === "month" ? "active" : ""}`}
                type="button"
                onClick={() => setViewMode("month")}
                aria-label="Month view"
                title="Month view"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <line x1="8" y1="14" x2="8" y2="14" />
                  <line x1="12" y1="14" x2="12" y2="14" />
                  <line x1="16" y1="14" x2="16" y2="14" />
                  <line x1="8" y1="18" x2="8" y2="18" />
                  <line x1="12" y1="18" x2="12" y2="18" />
                </svg>
                <span>Month</span>
              </button>
            </div>

            <select
              className="holidayYearSelect"
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
              aria-label="Select year"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            {viewMode === "month" && (
              <div className="holidayMonthNav">
                <button
                  className="holidayMonthNavBtn"
                  type="button"
                  onClick={() => {
                    if (selectedMonth === 0) {
                      setSelectedMonth(11);
                      setSelectedYear((prev) => prev - 1);
                    } else {
                      setSelectedMonth((prev) => prev - 1);
                    }
                  }}
                  aria-label="Previous month"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <span className="holidayMonthNavLabel">
                  {MONTH_NAMES[selectedMonth]} {selectedYear}
                </span>
                <button
                  className="holidayMonthNavBtn"
                  type="button"
                  onClick={() => {
                    if (selectedMonth === 11) {
                      setSelectedMonth(0);
                      setSelectedYear((prev) => prev + 1);
                    } else {
                      setSelectedMonth((prev) => prev + 1);
                    }
                  }}
                  aria-label="Next month"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            )}

            <button
              className="holidayBtn"
              type="button"
              onClick={() => {
                reload().catch((error) => {
                  console.error("Error reloading holidays:", error);
                });
              }}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>

            <button
              className="holidayBtn"
              type="button"
              onClick={() => {
                setSelectedYear(new Date().getFullYear());
                setSelectedMonth(new Date().getMonth());
                setSelectedIso("");
              }}
            >
              Today
            </button>

            {isAdmin && (
              <button
                className="holidayBtn primary"
                type="button"
                onClick={openCreate}
                disabled={!listAvailable || loading}
                title={
                  listAvailable
                    ? "Add a holiday to the Holidays list"
                    : 'The "Holidays" list could not be reached'
                }
              >
                Add Holiday
              </button>
            )}
          </div>
        </div>

        {/* Fallback notice */}
        {origin === "fallback" && !loading && (
          <div className="holidayNotice" role="status">
            <div className="holidayNoticeBody">
              <strong>
                {listAvailable
                  ? "The Holidays list is empty, so the default calendar is showing."
                  : "Using the built-in default calendar."}
              </strong>
              <span>
                {!listAvailable && isAdmin
                  ? ' No "Holidays" list was found in this site. Create a list titled "Holidays" with columns Title (Single line), Date (Date, include time OFF), Description (Multiple lines) and HolidayType (Single line), then refresh - it will be picked up automatically.'
                  : listAvailable && isAdmin
                    ? ' Use "Add Holiday" to publish the dates. The list is live, so your changes apply immediately and leave day counts recalculate across the app.'
                    : ' The holiday list has not been published yet, so this is the default calendar. Please check with HR for confirmed dates.'}
              </span>
            </div>
          </div>
        )}

        {/* Year summary */}
        <div className="holidaySummary">
          <div className="holidaySummaryCard">
            <div className="holidaySummaryValue">{yearHolidays.length}</div>
            <div className="holidaySummaryLabel">
              Holidays in {selectedYear}
            </div>
          </div>

          {(Object.keys(stats) as THolidaySource[]).map((type) => (
            <div className="holidaySummaryCard" key={type}>
              <div
                className={`holidaySummaryDot ${type.toLowerCase()}`}
                aria-hidden="true"
              />
              <div className="holidaySummaryValue">{stats[type]}</div>
              <div className="holidaySummaryLabel">{type}</div>
            </div>
          ))}
        </div>

        <div className="holidayLayout">
          {/* Year grid */}
          {viewMode === "year" && (
            <div className="holidayGrid">
              {MONTH_NAMES.map((name, index) => (
                <div
                  key={name}
                  className={
                    index === currentMonth && selectedYear === new Date().getFullYear()
                      ? "holidayMonth current"
                      : "holidayMonthWrap"
                  }
                >
                  <MiniMonth
                    year={selectedYear}
                    month={index}
                    holidayMap={holidayMap}
                    todayIso={todayIso}
                    selectedIso={selectedIso}
                    onSelect={(holiday) => setSelectedIso(holiday.isoDate)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Month view */}
          {viewMode === "month" && (
            <LargeMonthView
              year={selectedYear}
              month={selectedMonth}
              holidayMap={holidayMap}
              todayIso={todayIso}
              selectedIso={selectedIso}
              onSelect={(holiday) => setSelectedIso(holiday.isoDate)}
            />
          )}

          {/* Sidebar */}
          <aside className="holidaySide">
            {selectedHoliday && (
              <div className="holidaySelectedCard">
                <div className="holidaySelectedType">
                  {SOURCE_LABELS[selectedHoliday.type]}
                </div>
                <h3 className="holidaySelectedName">
                  {selectedHoliday.name}
                </h3>
                <div className="holidaySelectedDate">
                  {getDayOfWeek(selectedHoliday.date)},{" "}
                  {formatDate(selectedHoliday.date)}
                </div>
                {selectedHoliday.description && (
                  <p className="holidaySelectedDescription">
                    {selectedHoliday.description}
                  </p>
                )}
                <div className="holidaySelectedHint">
                  {SOURCE_HINTS[selectedHoliday.type]}
                </div>

                <div className="holidaySelectedActions">
                  {isAdmin && selectedHoliday.listId !== undefined && (
                    <>
                      <button
                        className="holidayBtn"
                        type="button"
                        onClick={() => openEdit(selectedHoliday)}
                      >
                        Edit
                      </button>
                      <button
                        className="holidayBtnDanger"
                        type="button"
                        onClick={() => setPendingDelete(selectedHoliday)}
                      >
                        Delete
                      </button>
                    </>
                  )}

                  <button
                    className="holidaySelectedClose"
                    type="button"
                    onClick={() => setSelectedIso("")}
                  >
                    Clear selection
                  </button>
                </div>
              </div>
            )}

            <div className="holidaySideCard">
              <h3 className="holidaySideTitle">Upcoming holidays</h3>

              {upcoming.length === 0 ? (
                <p className="holidaySideEmpty">
                  No upcoming holidays have been published.
                </p>
              ) : (
                <div className="holidayUpcoming">
                  {upcoming.map((holiday) => (
                    <button
                      key={holiday.id}
                      type="button"
                      className={`holidayUpcomingRow ${
                        holiday.isoDate === selectedIso ? "isSelected" : ""
                      }`}
                      onClick={() => {
                        setSelectedIso(holiday.isoDate);
                        setSelectedYear(holiday.date.getFullYear());
                      }}
                    >
                      <div
                        className={`holidayUpcomingDate ${holiday.type.toLowerCase()}`}
                      >
                        <span className="holidayUpcomingDay">
                          {holiday.date.getDate()}
                        </span>
                        <span className="holidayUpcomingMonth">
                          {MONTH_NAMES[holiday.date.getMonth()].slice(0, 3)}
                        </span>
                      </div>

                      <div className="holidayUpcomingInfo">
                        <span className="holidayUpcomingName">
                          {holiday.name}
                        </span>
                        <span className="holidayUpcomingMeta">
                          {formatCountdown(holiday)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="holidaySideCard">
              <h3 className="holidaySideTitle">About these holidays</h3>
              <p className="holidaySideText">
                Weekends and the holidays below are never deducted from your
                leave balance. A leave request spanning a holiday will show the
                adjusted day count before you submit it.
              </p>
              <div className="holidayLegend">
                {(Object.keys(SOURCE_LABELS) as THolidaySource[]).map((type) => (
                  <div className="holidayLegendRow" key={type}>
                    <span
                      className={`holidayLegendDot ${type.toLowerCase()}`}
                      aria-hidden="true"
                    />
                    <span>{SOURCE_LABELS[type]}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* Create / Edit modal */}
        {formMode !== "closed" && (
          <div
            className="holidayModalOverlay"
            onClick={closeModals}
            role="presentation"
          >
            <div
              className="holidayModal"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="holiday-form-title"
            >
              <div className="holidayModalHeader">
                <div>
                  <h2 id="holiday-form-title" className="holidayModalTitle">
                    {formMode === "edit" ? "Edit holiday" : "Add holiday"}
                  </h2>
                  <p className="holidayModalSubtitle">
                    Published holidays are excluded automatically when leave
                    days are calculated.
                  </p>
                </div>

                <button
                  className="holidayModalClose"
                  type="button"
                  onClick={closeModals}
                  aria-label="Close"
                  disabled={saving}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="holidayModalBody">
                <HolidayForm
                  key={formMode === "edit" && editingHoliday ? editingHoliday.id : "create"}
                  initial={editingHoliday}
                  takenDates={availableDates}
                  saving={saving}
                  onCancel={closeModals}
                  onSubmit={handleFormSubmit}
                />
              </div>
            </div>
          </div>
        )}

        {/* Delete confirmation */}
        {pendingDelete && (
          <div
            className="holidayModalOverlay"
            onClick={() => setPendingDelete(undefined)}
            role="presentation"
          >
            <div
              className="holidayModal narrow"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="holiday-delete-title"
            >
              <div className="holidayModalHeader">
                <div>
                  <h2 id="holiday-delete-title" className="holidayModalTitle">
                    Delete holiday
                  </h2>
                  <p className="holidayModalSubtitle">This cannot be undone.</p>
                </div>
              </div>

              <DeleteConfirm
                holiday={pendingDelete}
                deleting={deleting}
                onCancel={() => setPendingDelete(undefined)}
                onConfirm={handleDeleteConfirm}
              />
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default HolidayCalendar;