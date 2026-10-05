import { spfi, SPFI } from "@pnp/sp";
import { SPFx } from "@pnp/sp/presets/all";
import { ILeave } from "../interfaces/ILeave";
import { IEmployee } from "../interfaces/IEmployee";
import { IHoliday } from "../interfaces/IHoliday";
import { calculateFractionalDays } from "../utils/dateUtils";

let _sp: SPFI;

export const getSP = (context?: any): SPFI => {
  if (!_sp && context) {
    _sp = spfi().using(SPFx(context));
  }
  return _sp;
};

/**
 * Escapes a value for interpolation into an OData $filter string literal.
 *
 * OData escapes a single quote by doubling it. Without this, a value such as
 * `' or '1'='1` closes the literal early and rewrites the whole filter - which
 * is how loginUser used to be bypassable with no credentials at all.
 */
const escapeOData = (value: string | undefined): string =>
  String(value === undefined || value === null ? "" : value).replace(
    /'/g,
    "''",
  );

/**
 * Columns safe to hand back to the browser.
 *
 * Password is deliberately excluded. The Employees list stores it in
 * plaintext, so a select("*") shipped every employee's password into the page
 * where anyone could read it from DevTools.
 */
const EMPLOYEE_FIELDS =
  "Id, Title, Name, Email, Department, Role, Manager, IsActive, Created, EmployeeImage";

// ────────────────────────────────────────────────────────────
// LEAVE OPERATIONS
// ────────────────────────────────────────────────────────────

export const getLeaves = async (): Promise<ILeave[]> => {
  try {
    const sp = getSP();

    if (sp) {
      console.log("SP instance created successfully.");
    } else {
      console.error("Failed to create SP instance.");
    }

    const leaves = await sp.web.lists
      .getByTitle("Leaves")
      .items.select("*")
      .top(5000)();
    return leaves;
  } catch (error) {
    console.error("Error fetching leaves:", error);
    throw error;
  }
};

export const getLeavesByEmployee = async (email: string): Promise<ILeave[]> => {
  try {
    const sp = getSP();
    const leaves = await sp.web.lists
      .getByTitle("Leaves")
      .items.filter(`EmployeeEmail eq '${escapeOData(email)}'`)
      .select("*")
      .top(5000)();
    return leaves;
  } catch (error) {
    console.error("Error fetching leaves for employee:", error);
    throw error;
  }
};

export const getLeavesByManager = async (managerEmail: string): Promise<ILeave[]> => {
  try {

    const sp = getSP();
    const employees = await sp.web.lists
      .getByTitle("Employees")
      .items.filter(`Manager eq '${escapeOData(managerEmail)}'`)
      .select("Email")
      .top(5000)();

    if (employees.length === 0) {
      return [];
    }

    const employeeEmails = employees.map((e) => e.Email);
    const emailFilter = employeeEmails
      .map((email) => `EmployeeEmail eq '${escapeOData(email)}'`)
      .join(" or ");

    const leaves = await sp.web.lists
      .getByTitle("Leaves")
      .items.filter(emailFilter)
      .select("*")
      .top(5000)();
    
    return leaves;
  } catch (error) {
    console.error("Error fetching leaves by manager:", error);
    throw error;
  }
};

// ────────────────────────────────────────────────────────────
// HOLIDAY OPERATIONS
// ────────────────────────────────────────────────────────────

/**
 * Reads the "Holidays" list. Expected columns:
 *   Title (Single line - holiday name), Date (Date),
 *   Description (optional), HolidayType (optional)
 *
 * Note: "Name" is deliberately absent from the select. It is a reserved
 * property on SharePoint list items, so asking for it makes the whole query
 * fail with a 400 and the app would silently fall back to the built-in
 * calendar forever.
 *
 * Throws if the list does not exist - callers are expected to fall back to
 * the built-in calendar in utils/constants.ts.
 */
export const getHolidays = async (): Promise<IHoliday[]> => {
  try {
    const sp = getSP();
    const holidays = await sp.web.lists
      .getByTitle("Holidays")
      .items.select("Id", "Title", "Date", "Description", "HolidayType")
      .orderBy("Date", true)
      .top(500)();
    return holidays as IHoliday[];
  } catch (error) {
    console.error("Error fetching holidays:", error);
    throw error;
  }
};

/**
 * Creates a holiday. Admin-only in the UI - this function does not enforce it,
 * it only talks to the list. Requires item-level permissions on Holidays.
 */
export const addHoliday = async (holiday: IHoliday): Promise<void> => {
  try {
    const sp = getSP();
    await sp.web.lists.getByTitle("Holidays").items.add({
      Title: holiday.Title,
      Date: holiday.Date,
      Description: holiday.Description || "",
      HolidayType: holiday.HolidayType || "Public",
    });
  } catch (error) {
    console.error("Error adding holiday:", error);
    throw error;
  }
};

/**
 * Updates an existing holiday in place. Only the fields the form owns are
 * written, so a column added to the list later is never blanked out.
 */
export const updateHoliday = async (
  holidayId: number,
  holiday: IHoliday,
): Promise<void> => {
  try {
    const sp = getSP();
    await sp.web.lists
      .getByTitle("Holidays")
      .items.getById(holidayId)
      .update({
        Title: holiday.Title,
        Date: holiday.Date,
        Description: holiday.Description || "",
        HolidayType: holiday.HolidayType || "Public",
      });
  } catch (error) {
    console.error("Error updating holiday:", error);
    throw error;
  }
};

export const deleteHoliday = async (holidayId: number): Promise<void> => {
  try {
    const sp = getSP();
    await sp.web.lists.getByTitle("Holidays").items.getById(holidayId).delete();
  } catch (error) {
    console.error("Error deleting holiday:", error);
    throw error;
  }
};

export const getLeavesByStatus = async (status: string): Promise<ILeave[]> => {
  try {
    const sp = getSP();
    const leaves = await sp.web.lists
      .getByTitle("Leaves")
      .items.filter(`Status eq '${escapeOData(status)}'`)
      .select("*")
      .top(5000)();
    return leaves;
  } catch (error) {
    console.error("Error fetching leaves by status:", error);
    throw error;
  }
};

export const addLeave = async (leave: ILeave): Promise<any> => {
  try {
    const sp = getSP();
    const result = await sp.web.lists.getByTitle("Leaves").items.add({
      Title: `${leave.LeaveType} - ${leave.StartDate}`,
      EmployeeEmail: leave.EmployeeEmail,
      LeaveType: leave.LeaveType,
      StartDate: leave.StartDate,
      EndDate: leave.EndDate,
      Reason: leave.Reason,
      Status: "Pending",
      AppliedDate: new Date().toISOString(),
      HalfDayType: leave.HalfDayType || "None",
    });
    return result;
  } catch (error) {
    console.error("Error adding leave:", error);
    throw error;
  }
};

export const updateLeave = async (
  leaveId: number,
  status: string,
  approverComments?: string,
): Promise<void> => {
  try {
    const sp = getSP();
    await sp.web.lists
      .getByTitle("Leaves")
      .items.getById(leaveId)
      .update({
        Status: status,
        ApproverComments: approverComments || "",
        ApprovedDate: status !== "Pending" ? new Date().toISOString() : undefined,
      });
  } catch (error) {
    console.error("Error updating leave:", error);
    throw error;
  }
};

export const deleteLeave = async (leaveId: number): Promise<void> => {
  try {
    const sp = getSP();
    await sp.web.lists.getByTitle("Leaves").items.getById(leaveId).delete();
  } catch (error) {
    console.error("Error deleting leave:", error);
    throw error;
  }
};

// ────────────────────────────────────────────────────────────
// EMPLOYEE OPERATIONS
// ────────────────────────────────────────────────────────────

export const getEmployees = async (): Promise<IEmployee[]> => {
  try {
    const sp = getSP();
    const employees = await sp.web.lists
      .getByTitle("Employees")
      .items.select(EMPLOYEE_FIELDS)
      .top(5000)();
    return employees;
  } catch (error) {
    console.error("Error fetching employees:", error);
    throw error;
  }
};

export const addEmployee = async (employee: IEmployee): Promise<any> => {
  try {
    const sp = getSP();

    const payload: Record<string, unknown> = {
      Title: employee.Name,
      Email: employee.Email,
      Department: employee.Department,
      Role: employee.Role,
      Manager: employee.Manager || "",
      IsActive: true,
    };

    // Only sent when the caller actually supplied one. The admin form has no
    // password field, so this normally stays out of the payload entirely.
    // Writing an empty string instead would let anyone log in as that
    // employee with a blank password, because the filter matches ''.
    if (employee.Password) {
      payload.Password = employee.Password;
    }

    const result = await sp.web.lists
      .getByTitle("Employees")
      .items.add(payload);
    return result;
  } catch (error) {
    console.error("Error adding employee:", error);
    throw error;
  }
};

export const updateEmployee = async (
  employeeId: number,
  employee: IEmployee,
): Promise<void> => {
  try {
    const sp = getSP();

    // Password is intentionally never written. The edit form does not own that
    // field, so including it meant an undefined value relying on JSON.stringify
    // dropping the key - one refactor away from wiping every employee's
    // password when an admin changed someone's department.
    await sp.web.lists
      .getByTitle("Employees")
      .items.getById(employeeId)
      .update({
        Title: employee.Name,
        Email: employee.Email,
        Department: employee.Department,
        Role: employee.Role,
        Manager: employee.Manager || "",
        IsActive: employee.IsActive !== undefined ? employee.IsActive : true,
      });
  } catch (error) {
    console.error("Error updating employee:", error);
    throw error;
  }
};

export const deleteEmployee = async (employeeId: number): Promise<void> => {
  try {
    const sp = getSP();
    await sp.web.lists
      .getByTitle("Employees")
      .items.getById(employeeId)
      .update({
        IsActive: false,
      });
  } catch (error) {
    console.error("Error deleting employee:", error);
    throw error;
  }
};

// ────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────
// LEAVE BALANCE OPERATIONS
// ────────────────────────────────────────────────────────────

export const getLeaveBalance = async (
  email: string,
  holidayDates?: string[],
): Promise<{ [key: string]: { used: number; total: number } }> => {
  try {
    const leaves = await getLeavesByEmployee(email);
    const balance: { [key: string]: { used: number; total: number } } = {
      "Casual Leave": { used: 0, total: 10 },
      "Sick Leave": { used: 0, total: 8 },
      "Earned Leave": { used: 0, total: 20 },
    };

    leaves.forEach((leave: ILeave) => {
      if (leave.Status === "Approved" && balance[leave.LeaveType]) {
        const days = calculateFractionalDays(
          leave.StartDate,
          leave.EndDate,
          leave.HalfDayType || "None",
          holidayDates,
        );
        balance[leave.LeaveType].used += days;
      }
    });

    return balance;
  } catch (error) {
    console.error("Error getting leave balance:", error);
    throw error;
  }
};

export const loginUser = async (
  email: string,
  password: string,
): Promise<IEmployee | undefined> => {
  try {
    const sp = getSP();

    // Both values are escaped. Before this, the password field was
    // interpolated raw: entering ' or '1'='1 produced a filter that matched
    // every employee and returned the first row, handing over an Admin session
    // to anyone who reached the login page.
    const users = await sp.web.lists
      .getByTitle("Employees")
      .items.filter(
        `Email eq '${escapeOData(email)}' and Password eq '${escapeOData(password)}'`,
      )
      .select(EMPLOYEE_FIELDS)
      .top(1)();

    if (users.length > 0) {
      return users[0] as IEmployee;
    }

    return undefined;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

export const getEmployeeByEmail = async (
  email: string,
  context?: any,
): Promise<IEmployee | undefined> => {
  try {
    const sp = getSP(context);

    const employees = await sp.web.lists
      .getByTitle("Employees")
      .items.filter(`Email eq '${escapeOData(email)}'`)
      .select(EMPLOYEE_FIELDS)
      .top(1)();

    if (employees.length > 0) {
      return employees[0] as IEmployee;
    }

    return undefined;
  } catch (error) {
    console.error("Error fetching employee by email:", error);
    throw error;
  }
};

/**
 * Updates an employee's own profile. Only the fields an employee is allowed
 * to edit are written - Role, Manager, Email and IsActive are admin-owned and
 * are never touched here.
 */
export const updateOwnProfile = async (
  employeeId: number,
  data: { Name?: string; Department?: string },
): Promise<void> => {
  try {
    const sp = getSP();
    await sp.web.lists
      .getByTitle("Employees")
      .items.getById(employeeId)
      .update({
        Title: data.Name,
        Department: data.Department,
      });
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
};

// ────────────────────────────────────────────────────────────
// PROFILE PHOTO OPERATIONS
// ────────────────────────────────────────────────────────────

const EMPLOYEE_PHOTOS_LIBRARY = "EmployeePhotos";

const PHOTO_MIME_TYPES: { [mime: string]: string } = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Uploads a new profile photo for an employee into the
 * "EmployeePhotos" document library and stores the file's
 * server-relative URL in the Employees list's EmployeeImage
 * column. Re-uploading overwrites the previous photo because
 * the file name is derived from the employee id.
 *
 * Returns the server-relative URL of the uploaded photo.
 */
export const uploadEmployeePhoto = async (
  employeeId: number,
  file: File,
): Promise<string> => {
  const extension = PHOTO_MIME_TYPES[file.type];

  if (!extension) {
    throw new Error("Only JPG, PNG or WebP images are supported.");
  }

  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    throw new Error("Photo must be smaller than 5 MB.");
  }

  const sp = getSP();

  // Resolve the web's server-relative URL so the library path
  // works on any site, not just /sites/LMS.
  const web = await sp.web.select("ServerRelativeUrl")();
  const folderUrl = `${web.ServerRelativeUrl}/${EMPLOYEE_PHOTOS_LIBRARY}`;
  const fileName = `photo_${employeeId}.${extension}`;

  const uploaded = await sp.web
    .getFolderByServerRelativePath(folderUrl)
    .files.addUsingPath(fileName, file, { Overwrite: true });

  // The file name is stable (re-uploads overwrite it), so the
  // URL never changes and browsers would keep serving the
  // previously cached image. A version parameter on every upload
  // gives the photo a fresh URL and busts the cache.
  const photoUrl = `${uploaded.ServerRelativeUrl}?v=${Date.now()}`;

  await sp.web.lists
    .getByTitle("Employees")
    .items.getById(employeeId)
    .update({ EmployeeImage: photoUrl });

  return photoUrl;
};

/**
 * Clears the photo reference on the employee record. The file in
 * the library is left in place so other copies keep working.
 */
export const removeEmployeePhoto = async (employeeId: number): Promise<void> => {
  const sp = getSP();
  await sp.web.lists
    .getByTitle("Employees")
    .items.getById(employeeId)
    .update({ EmployeeImage: "" });
};

/**
 * Changes an employee's password after verifying the current one.
 * Returns true on success, false when the current password does not match.
 */
export const changePassword = async (
  employeeId: number,
  currentPassword: string,
  newPassword: string,
): Promise<boolean> => {
  try {
    const sp = getSP();

    // Verify the current password before allowing the change.
    const matches = await sp.web.lists
      .getByTitle("Employees")
      .items.filter(
        `Id eq ${employeeId} and Password eq '${escapeOData(currentPassword)}'`,
      )
      .select("Id")
      .top(1)();

    if (matches.length === 0) {
      return false;
    }

    await sp.web.lists
      .getByTitle("Employees")
      .items.getById(employeeId)
      .update({
        Password: newPassword,
      });

    return true;
  } catch (error) {
    console.error("Error changing password:", error);
    throw error;
  }
};
