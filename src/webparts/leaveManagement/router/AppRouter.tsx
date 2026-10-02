import * as React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";

import Login from "../components/auth/Login";
import Dashboard from "../components/dashboard/Dashboard";

import { AuthProvider } from "../context/AuthContext";
import { HolidaysProvider } from "../context/HolidaysContext";
import ProtectedRoute from "./ProtectedRoute";

import EmployeeList from "../components/employee/EmployeeList";
import ApplyLeave from "../components/leave/ApplyLeave";
import LeaveList from "../components/leave/LeaveList";
import MyLeaveHistory from "../components/leave/MyLeaveHistory";
import HolidayCalendar from "../components/holiday/HolidayCalendar";
import LeavePolicy from "../components/policy/LeavePolicy";
import ProfilePage from "../components/profile/ProfilePage";

interface IAppRouterProps {
  context: any;
}

const AppRouter = ({ context }: IAppRouterProps): JSX.Element => {
  return (
    <AuthProvider context={context}>
      <HolidaysProvider>
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
              <ProtectedRoute allowedRoles={["Admin", "Manager"]}>
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
            path="/my-leave-history"
            element={
              <ProtectedRoute>
                <MyLeaveHistory />
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

          <Route
            path="/holiday-calendar"
            element={
              <ProtectedRoute>
                <HolidayCalendar />
              </ProtectedRoute>
            }
          />

          <Route
            path="/leave-policy"
            element={
              <ProtectedRoute>
                <LeavePolicy />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Routes>
        </HashRouter>
      </HolidaysProvider>
    </AuthProvider>
  );
};

export default AppRouter;
