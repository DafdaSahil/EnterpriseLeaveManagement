import * as React from "react";
import AppRouter from "../router/AppRouter";
import { ILeaveManagementProps } from "./ILeaveManagementProps";

const LeaveManagement = (props: ILeaveManagementProps): JSX.Element => {
  // Store context in window for Microsoft login to access
  React.useEffect(() => {
    (window as any).__leaveManagementContext = props.context;
  }, [props.context]);

  return <AppRouter context={props.context} />;
};

export default LeaveManagement;
