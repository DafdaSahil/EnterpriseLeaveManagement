export interface IUser {
  Id?: number;
  DisplayName?: string;
  Title?: string;
  Email: string;
  Password?: string;
  Role: "Admin" | "Manager" | "Employee";
  Department?: string;
  Designation?: string;
  IsActive?: boolean;
  LoginType?: "microsoft" | "local";
}
