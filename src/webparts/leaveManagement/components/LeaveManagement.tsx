import * as React from "react";
import AppRouter from "../router/AppRouter";
import { ILeaveManagementProps } from "./ILeaveManagementProps";

const LeaveManagement = (props: ILeaveManagementProps): JSX.Element => {
  return <AppRouter context={props.context} />;
};

export default LeaveManagement;
