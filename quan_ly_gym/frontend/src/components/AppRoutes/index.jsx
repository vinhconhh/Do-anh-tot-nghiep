import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import LandingPage from "../../page/LandingPage";
import DefaultLayout from "../../Layouts/DefaultLayout";
import Dashboard from "../../page/Dashboard";
import Members from "../../page/Members";
import MemberDetail from "../../page/MemberDetail";
import DashboardMember from "../../page/DashboardMember";
import AiPurchase from "../../page/AiPurchase";
import MemberReport from "../../page/MemberReport";
import Trainers from "../../page/Trainers";
import TrainerDetail from "../../page/TrainerDetail";
import PackageManagement from "../../page/PackageManagement";
import AiPackageManagement from "../../page/AiPackageManagement";
import PromotionManagement from "../../page/PromotionManagement";
import Exercises from "../../page/Exercises";
import PtRequests from "../../page/PtRequests";
import Settings from "../../page/Settings";
import MySchedule from "../../page/MySchedule";
import MyWorkoutSchedule from "../../page/MyWorkoutSchedule";
import Schedules from "../../page/Schedules";
import AiChat from "../../page/AiChat";
import NotFound from "../../page/NotFound";
import EquipmentManagement from "../../page/EquipmentManagement";
import GymExerciseManagement from "../../page/GymExerciseManagement";
import GymClassManagement from "../../page/GymClassManagement";
import EnrollmentApproval from "../../page/EnrollmentApproval";
import BuyGymPackage from "../../page/BuyGymPackage";
import MealPlanManagement from "../../page/MealPlanManagement";
import AccountManagement from "../../page/AccountManagement";

function AppRoutes() {
  const { token, user } = useContext(AuthContext) ?? {};
  const role = (user?.vaiTro || user?.role || "").toUpperCase();

  useEffect(() => {
  }, [role, token]);

  const RequireAuth = ({ children }) =>
    token ? children : <Navigate to="/" replace />;

  const RequireRole = ({ roles, children, allowNoPackage = false }) => {
    if (!token) return <Navigate to="/" replace />;

    if (role === "MEMBER" && !user?.packageId && !allowNoPackage) {
      return <Navigate to="/buy-gym-package" replace />;
    }

    if (!roles?.length) return children;
    return roles.includes(role) ? children : <Navigate to={getDefaultRoute()} replace />;
  };

  const getDefaultRoute = () => {
    if (role === "ADMIN") return "/account-management";
    if (role === "MANAGER") return "/dashboard";
    if (role === "MEMBER") return "/my-dashboard";
    if (role === "PT") return "/my-schedule";
    return "/";
  };

  return (
    <BrowserRouter>
      <div className="flex min-h-screen w-full">
        <Routes>
          {}
          <Route
            path="/"
            element={<LandingPage />}
          />
          <Route path="/forgot-password" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/buy-gym-package" element={<RequireAuth><RequireRole roles={["MEMBER"]} allowNoPackage={true}><BuyGymPackage /></RequireRole></RequireAuth>} />

          <Route
            element={
              <RequireAuth>
                <DefaultLayout />
              </RequireAuth>
            }
          >
            {}
            <Route
              path="/account-management"
              element={
                <RequireRole roles={["ADMIN"]}>
                  <AccountManagement />
                </RequireRole>
              }
            />
            <Route
              path="/package-management"
              element={
                <RequireRole roles={["ADMIN"]}>
                  <PackageManagement />
                </RequireRole>
              }
            />
            <Route
              path="/ai-package-management"
              element={
                <RequireRole roles={["ADMIN"]}>
                  <AiPackageManagement />
                </RequireRole>
              }
            />
            <Route
              path="/promotion-management"
              element={
                <RequireRole roles={["ADMIN"]}>
                  <PromotionManagement />
                </RequireRole>
              }
            />

            {}
            <Route
              path="/dashboard"
              element={
                <RequireRole roles={["MANAGER"]}>
                  <Dashboard />
                </RequireRole>
              }
            />
            <Route
              path="/members"
              element={
                <RequireRole roles={["MANAGER"]}>
                  <Members />
                </RequireRole>
              }
            />
            <Route
              path="/members/:id"
              element={
                <RequireRole roles={["MANAGER"]}>
                  <MemberDetail />
                </RequireRole>
              }
            />
            <Route
              path="/trainers"
              element={
                <RequireRole roles={["MANAGER"]}>
                  <Trainers />
                </RequireRole>
              }
            />
            <Route
              path="/trainers/:id"
              element={
                <RequireRole roles={["MANAGER"]}>
                  <TrainerDetail />
                </RequireRole>
              }
            />
            <Route
              path="/equipment-management"
              element={<RequireRole roles={["MANAGER"]}><EquipmentManagement /></RequireRole>}
            />
            <Route
              path="/gym-exercise-management"
              element={<RequireRole roles={["MANAGER"]}><GymExerciseManagement /></RequireRole>}
            />
            <Route
              path="/gym-class-management"
              element={<RequireRole roles={["MANAGER"]}><GymClassManagement /></RequireRole>}
            />
            <Route
              path="/meal-plan-management"
              element={<RequireRole roles={["MANAGER"]}><MealPlanManagement /></RequireRole>}
            />
            <Route
              path="/enrollment-approval"
              element={<RequireRole roles={["MANAGER", "PT"]}><EnrollmentApproval /></RequireRole>}
            />
            <Route
              path="/exercises"
              element={
                <RequireRole roles={["MANAGER"]}>
                  <Exercises />
                </RequireRole>
              }
            />
            <Route
              path="/member-report"
              element={
                <RequireRole roles={["MANAGER"]}>
                  <MemberReport />
                </RequireRole>
              }
            />
            <Route
              path="/schedules"
              element={
                <RequireRole roles={["MANAGER"]}>
                  <Schedules />
                </RequireRole>
              }
            />

            {}
            <Route path="/my-dashboard" element={<RequireRole roles={["MEMBER"]}><DashboardMember /></RequireRole>} />
            <Route path="/ai-purchase" element={<RequireRole roles={["MEMBER"]}><AiPurchase /></RequireRole>} />
            <Route path="/my-workout-schedule" element={<RequireRole roles={["MEMBER"]}><MyWorkoutSchedule /></RequireRole>} />

            {}
            <Route
              path="/pt-requests"
              element={
                <RequireRole roles={["MANAGER", "MEMBER", "PT"]}>
                  <PtRequests />
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

            {}
            <Route path="/settings" element={<Settings />} />
            {}
            <Route
              path="/ai-chat"
              element={
                <RequireRole roles={["MEMBER"]}>
                  <AiChat />
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
