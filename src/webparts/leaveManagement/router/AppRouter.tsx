import * as React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";

import Login from "../components/auth/Login";
import Dashboard from "../components/dashboard/Dashboard";

import { AuthProvider } from "../context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";

import EmployeeList from "../components/employee/EmployeeList";
import ApplyLeave from "../components/leave/ApplyLeave";
import LeaveList from "../components/leave/LeaveList";

const AppRouter = (): JSX.Element => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Login />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employees"
            element={
              <ProtectedRoute>
                <EmployeeList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/apply-leave"
            element={
              <ProtectedRoute>
                <ApplyLeave />
              </ProtectedRoute>
            }
          />

          <Route
            path="/leave-list"
            element={
              <ProtectedRoute>
                <LeaveList />
              </ProtectedRoute>
            }
          />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default AppRouter;
