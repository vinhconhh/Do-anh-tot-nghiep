import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";

import LandingPage from "../../page/LandingPage";
import ForgotPassword from "../../page/ForgotPassword";
import DefaultLayout from "../../Layouts/DefaultLayout";
import Dashboard from "../../page/Dashboard";
import Members from "../../page/Members";
import MemberDetail from "../../page/MemberDetail";
import DashboardMember from "../../page/DashboardMember";
import AiPurchase from "../../page/AiPurchase";
import MemberReport from "../../page/MemberReport";
import Trainers from "../../page/Trainers";
import PackageManagement from "../../page/PackageManagement";
import AiPackageManagement from "../../page/AiPackageManagement";
import PromotionManagement from "../../page/PromotionManagement";
import Exercises from "../../page/Exercises";
import PtRequests from "../../page/PtRequests";
import MyClients from "../../page/MyClients";
import Settings from "../../page/Settings";
import MySchedule from "../../page/MySchedule";
import MyWorkoutSchedule from "../../page/MyWorkoutSchedule";
import Schedules from "../../page/Schedules";
import AiChat from "../../page/AiChat";
import NotFound from "../../page/NotFound";
import EquipmentManagement from "../../page/EquipmentManagement";
import GymExerciseManagement from "../../page/GymExerciseManagement";
import GymClassManagement from "../../page/GymClassManagement";

function AppRoutes() {
  const { token, user } = useContext(AuthContext) ?? {};
  const role = (user?.vaiTro || user?.role || "").toUpperCase();

  useEffect(() => {
    // Tailwind manages colors via classes and CSS Variables now
  }, [role, token]);

  const RequireAuth = ({ children }) =>
    token ? children : <Navigate to="/" replace />;

  const RequireRole = ({ roles, children }) => {
    if (!token) return <Navigate to="/" replace />;
    if (!roles?.length) return children;
    return roles.includes(role) ? children : <Navigate to="/dashboard" replace />;
  };

  return (
    <BrowserRouter>
      <div className="flex min-h-screen w-full">
        <Routes>
          {/*
           * TRANG CHỦ (Landing Page)
           * - Luôn hiển thị Landing Page ở trang chủ (/)
           */}
          <Route
            path="/"
            element={<LandingPage />}
          />
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
              path="/package-management"
              element={
                <RequireRole roles={["ADMIN", "MANAGER"]}>
                  <PackageManagement />
                </RequireRole>
              }
            />
            <Route
              path="/ai-package-management"
              element={
                <RequireRole roles={["ADMIN", "MANAGER"]}>
                  <AiPackageManagement />
                </RequireRole>
              }
            />
            <Route
              path="/promotion-management"
              element={
                <RequireRole roles={["ADMIN", "MANAGER"]}>
                  <PromotionManagement />
                </RequireRole>
              }
            />
            <Route
              path="/equipment-management"
              element={<RequireRole roles={["ADMIN", "MANAGER"]}><EquipmentManagement /></RequireRole>}
            />
            <Route
              path="/gym-exercise-management"
              element={<RequireRole roles={["ADMIN", "MANAGER"]}><GymExerciseManagement /></RequireRole>}
            />
            <Route
              path="/gym-class-management"
              element={<RequireRole roles={["ADMIN", "MANAGER"]}><GymClassManagement /></RequireRole>}
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
                <RequireRole roles={["ADMIN", "MANAGER", "MEMBER", "PT"]}>
                  <PtRequests />
                </RequireRole>
              }
            />
            <Route
              path="/my-clients"
              element={
                <RequireRole roles={["PT"]}>
                  <MyClients />
                </RequireRole>
              }
            />
            <Route path="/settings" element={<Settings />} />
            <Route path="/ai-chat" element={<AiChat />} />
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
