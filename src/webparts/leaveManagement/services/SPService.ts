import { spfi, SPFI } from "@pnp/sp";
import { SPFx } from "@pnp/sp/presets/all";
import { ILeave } from "../interfaces/ILeave";
import { IEmployee } from "../interfaces/IEmployee";
import { calculateBusinessDays } from "../utils/dateUtils";

let _sp: SPFI;

export const getSP = (context?: any): SPFI => {
  if (!_sp && context) {
    _sp = spfi().using(SPFx(context));
  }
  return _sp;
};

// ────────────────────────────────────────────────────────────
// LEAVE OPERATIONS
// ────────────────────────────────────────────────────────────

export const getLeaves = async (filter?: string): Promise<ILeave[]> => {
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
      .items.filter(`EmployeeEmail eq '${email}'`)
      .select("*")
      .top(5000)();
    return leaves;
  } catch (error) {
    console.error("Error fetching leaves for employee:", error);
    throw error;
  }
};

export const getLeavesByStatus = async (status: string): Promise<ILeave[]> => {
  try {
    const sp = getSP();
    const leaves = await sp.web.lists
      .getByTitle("Leaves")
      .items.filter(`Status eq '${status}'`)
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
      .items.select("*")
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
    const result = await sp.web.lists.getByTitle("Employees").items.add({
      Title: employee.Name,
      Password: employee.Password,
      Email: employee.Email,
      Department: employee.Department,
      Role: employee.Role,
      Manager: employee.Manager || "",
      IsActive: true,
    });
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
    await sp.web.lists
      .getByTitle("Employees")
      .items.getById(employeeId)
      .update({
        Title: employee.Name,
        Password: employee.Password,
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
        const days = calculateBusinessDays(leave.StartDate, leave.EndDate);
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

    const users = await sp.web.lists
      .getByTitle("Employees")
      .items.filter(`Email eq '${email}' and Password eq '${password}'`)
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
