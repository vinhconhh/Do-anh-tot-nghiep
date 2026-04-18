import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "../components/Header";
import Footer from "./components/Footer";
import styles from "./DefaultLayout.module.scss";

function DefaultLayout() {
  return (
    <div className={styles.wrapper}>
      <Sidebar />
      <div className={styles.contentWrapper}>
        <Header />
        <main className={styles.main}>
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default DefaultLayout;
