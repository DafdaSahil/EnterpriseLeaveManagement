export interface IEmployee {
  Id?: number;
  Title?: string;
  Name?: string;
  Email: string;
  /**
   * Legacy plaintext credential. It is never selected when reading employees,
   * so this is undefined on anything fetched from SharePoint - it is only
   * populated when a caller deliberately supplies one to addEmployee.
   */
  Password?: string;
  Department?: string;

  Role: "Admin" | "Manager" | "Employee";
  Manager?: string;
  IsActive?: boolean;
  Created?: string;
  EmployeeImage?: string;
}