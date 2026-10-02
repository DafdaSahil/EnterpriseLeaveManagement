export type THalfDayType = "None" | "FirstHalf" | "SecondHalf";

export interface ILeave {
  Id?: number;
  Title?: string;
  EmployeeEmail: string;
  LeaveType: string;
  StartDate: Date;
  EndDate: Date;
  Reason: string;
  Status: "Pending" | "Approved" | "Rejected";
  AppliedDate?: Date;
  ApprovedDate?: Date;
  ApproverComments?: string;
  HalfDayType?: THalfDayType;
}