import * as React from "react";
import { IKPICard } from "./employeeTypes";

const EmployeeKpiCard = ({ label, value, icon, color }: IKPICard): JSX.Element => (
  <div className="kpiCard">
    <div className={`kpiIcon ${color}`}>{icon}</div>
    <div className="kpiValue">{value}</div>
    <div className="kpiLabel">{label}</div>
  </div>
);

export default EmployeeKpiCard;
