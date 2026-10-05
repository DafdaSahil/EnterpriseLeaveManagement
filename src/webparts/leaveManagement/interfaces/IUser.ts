export interface IUser {
  Id?: number;
  DisplayName?: string;
  Title?: string;
  Email: string;
  Password?: string;
  Role: "Admin" | "Manager" | "Employee";
  Department?: string;

  IsActive?: boolean;
  LoginType?: "microsoft" | "local";
  /**
   * Server-relative URL of the employee's photo in the
   * "EmployeePhotos" document library, stored in the Employees
   * list's EmployeeImage column.
   */
  EmployeeImage?: string;
}
