import { useContext } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "../components/Header";
import Footer from "./components/Footer";
import { AuthContext } from "../../context/AuthContext";

function DefaultLayout() {
  const { user } = useContext(AuthContext) ?? {};
  const role = (user?.vaiTro || user?.role || "").toUpperCase();
  const isLightTheme = ["ADMIN", "MANAGER", "PT"].includes(role);

  return (
    <div className={`flex min-h-screen w-full ${isLightTheme ? "theme-light" : ""}`}>
      <Sidebar />
      <div className={`flex-1 flex flex-col min-w-0 ${isLightTheme ? "bg-light-main" : "bg-slate-900"}`}>
        <Header />
        <main className="flex-1 p-0">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default DefaultLayout;
