import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "../components/Header";
import Footer from "./components/Footer";

function DefaultLayout() {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900">
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
