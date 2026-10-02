import * as React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { hasRouteAccess } from "../utils/roleRedirect";

interface IProps {
  children: JSX.Element;
  allowedRoles?: ("Admin" | "Manager" | "Employee")[];
}

const ProtectedRoute = ({ children, allowedRoles }: IProps): JSX.Element => {
  const userStr = sessionStorage.getItem("user");
  const location = useLocation();

  if (!userStr) {
    return <Navigate to="/" replace />;
  }

  const user = JSON.parse(userStr);

  // If specific roles are required, check if user has permission
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.Role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Also check route-based access
  if (!hasRouteAccess(user, location.pathname)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
