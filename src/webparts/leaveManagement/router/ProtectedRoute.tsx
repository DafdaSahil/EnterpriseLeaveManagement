import * as React from "react";

import { Navigate } from "react-router-dom";

interface IProps {
  children: JSX.Element;
}

const ProtectedRoute = ({ children }: IProps): JSX.Element => {
  const user = sessionStorage.getItem("user");

  if (!user) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;
