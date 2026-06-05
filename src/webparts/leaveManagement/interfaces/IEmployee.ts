export interface IEmployee {
  Id?: number;
  Title?: string;
  Name?: string;
  Email: string;
  Password: string;
  Department?: string;
  Role: "Admin" | "Manager" | "Employee";
  Manager?: string;
  IsActive?: boolean;
  Created?: string;
}