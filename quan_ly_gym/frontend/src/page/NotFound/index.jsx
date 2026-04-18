import { useNavigate } from "react-router-dom";
import { Home, Dumbbell } from "lucide-react";
import styles from "./NotFound.module.scss";

export default function NotFound() {
  const nav = useNavigate();
  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <div className={styles.icon}><Dumbbell size={48} color="#4e73df" /></div>
        <h1 className={styles.code}>404</h1>
        <h2 className={styles.title}>Trang không tìm thấy</h2>
        <p className={styles.sub}>Trang bạn đang tìm không tồn tại hoặc đã bị di chuyển.</p>
        <button className={styles.btn} onClick={() => nav("/dashboard")}>
          <Home size={16} /> Về trang chủ
        </button>
      </div>
    </div>
  );
}
