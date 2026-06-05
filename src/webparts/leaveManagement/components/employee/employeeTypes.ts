import { IEmployee } from "../../interfaces/IEmployee";

export interface IEmployeeRow extends IEmployee {
  Id: number;
}

export interface IKPICard {
  label: string;
  value: number;
  icon: JSX.Element;
  color: "blue" | "green" | "purple";
}
