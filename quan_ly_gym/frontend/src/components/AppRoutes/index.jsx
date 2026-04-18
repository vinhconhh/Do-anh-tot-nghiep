import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

import Login from "../../page/Login";
import Register from "../../page/Register";
import ForgotPassword from "../../page/ForgotPassword";
import DefaultLayout from "../../Layouts/DefaultLayout";
import Dashboard from "../../page/Dashboard";
import Members from "../../page/Members";
import MemberDetail from "../../page/MemberDetail";
import DashboardMember from "../../page/DashboardMember";
import AiPurchase from "../../page/AiPurchase";
import MemberReport from "../../page/MemberReport";
import Trainers from "../../page/Trainers";
import Billing from "../../page/Billing";
import Exercises from "../../page/Exercises";
import PtRequests from "../../page/PtRequests";
import Settings from "../../page/Settings";
import MySchedule from "../../page/MySchedule";
import MyWorkoutSchedule from "../../page/MyWorkoutSchedule";
import Schedules from "../../page/Schedules";
import NotFound from "../../page/NotFound";

function AppRoutes() {
  const { token, user } = useContext(AuthContext) ?? {};
  const role = (user?.vaiTro || user?.role || "").toUpperCase();

  const RequireAuth = ({ children }) =>
    token ? children : <Navigate to="/login" replace />;

  const RequireRole = ({ roles, children }) => {
    if (!token) return <Navigate to="/login" replace />;
    if (!roles?.length) return children;
    return roles.includes(role) ? children : <Navigate to="/dashboard" replace />;
  };

  return (
    <BrowserRouter>
      <div className="container">
        <Routes>
          <Route
            path="/"
            element={token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="*" element={<NotFound />} />

          <Route
            element={
              <RequireAuth>
                <DefaultLayout />
              </RequireAuth>
            }
          >
            <Route
              path="/dashboard"
              element={
                <RequireRole roles={["ADMIN", "MANAGER"]}>
                  <Dashboard />
                </RequireRole>
              }
            />
            <Route
              path="/members"
              element={
                <RequireRole roles={["ADMIN", "MANAGER"]}>
                  <Members />
                </RequireRole>
              }
            />
            <Route
              path="/members/:id"
              element={
                <RequireRole roles={["ADMIN", "MANAGER"]}>
                  <MemberDetail />
                </RequireRole>
              }
            />
            <Route path="/my-dashboard" element={<DashboardMember />} />
            <Route path="/ai-purchase" element={<AiPurchase />} />
            <Route
              path="/member-report"
              element={
                <RequireRole roles={["ADMIN", "MANAGER"]}>
                  <MemberReport />
                </RequireRole>
              }
            />

            <Route
              path="/trainers"
              element={
                <RequireRole roles={["ADMIN", "MANAGER"]}>
                  <Trainers />
                </RequireRole>
              }
            />
            <Route
              path="/billing"
              element={
                <RequireRole roles={["ADMIN", "MANAGER"]}>
                  <Billing />
                </RequireRole>
              }
            />
            <Route
              path="/exercises"
              element={
                <RequireRole roles={["ADMIN", "MANAGER"]}>
                  <Exercises />
                </RequireRole>
              }
            />
            <Route
              path="/pt-requests"
              element={
                <RequireRole roles={["ADMIN", "MANAGER"]}>
                  <PtRequests />
                </RequireRole>
              }
            />
            <Route path="/settings" element={<Settings />} />
            <Route
              path="/schedules"
              element={
                <RequireRole roles={["ADMIN", "MANAGER"]}>
                  <Schedules />
                </RequireRole>
              }
            />
            <Route
              path="/my-workout-schedule"
              element={
                <RequireRole roles={["MEMBER"]}>
                  <MyWorkoutSchedule />
                </RequireRole>
              }
            />
            <Route
              path="/my-schedule"
              element={
                <RequireRole roles={["PT"]}>
                  <MySchedule />
                </RequireRole>
              }
            />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default AppRoutes;
