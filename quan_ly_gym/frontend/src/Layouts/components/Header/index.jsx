import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LogOut, Settings, User } from "lucide-react";
import { AuthContext } from "../../../context/AuthContext";
import Modal from "../../../components/Modal";
import styles from "./Header.module.scss";

export default function Header() {
  const { user, logout } = useContext(AuthContext) ?? {};
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const nav = useNavigate();

  const displayName = user?.hoTen || user?.name || "Admin";
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4e73df&color=fff&size=64`;

  const handleLogout = () => {
    logout();
    nav("/login");
  };

  return (
    <>
      <header className={styles.header}>
        {/* Alert bell */}
        <div className={styles.actions}>
          <button
            className={styles.iconBtn}
            onClick={() => setIsAlertOpen(true)}
          >
            <Bell size={20} />
            <span className={styles.badge}>0</span>
          </button>

          <div className={styles.divider} />

          {/* User menu */}
          <button
            className={styles.userBtn}
            onClick={() => setIsUserOpen(true)}
          >
            <span className={styles.userName}>{displayName}</span>
            <img className={styles.avatar} src={avatarUrl} alt={displayName} />
            <ChevronDown size={16} />
          </button>
        </div>
      </header>

      {/* Alert Modal */}
      <Modal
        isOpen={isAlertOpen}
        onRequestClose={() => setIsAlertOpen(false)}
        title="Thông báo"
      >
        <div className={styles.alertList}>
          <div style={{ textAlign: "center", padding: "20px 0", color: "#858796" }}>Không có thông báo mới</div>
        </div>
      </Modal>

      {/* User Modal */}
      <Modal
        isOpen={isUserOpen}
        onRequestClose={() => setIsUserOpen(false)}
        title="Tài khoản"
      >
        <div className={styles.userCard}>
          <img className={styles.avatarLg} src={avatarUrl} alt={displayName} />
          <div>
            <div className={styles.userCardName}>{displayName}</div>
            <div className={styles.userCardRole}>
              {user?.vaiTro || user?.role || "Admin"}
            </div>
          </div>
        </div>
        <div
          className={styles.menuItem}
          onClick={() => { nav("/settings"); setIsUserOpen(false); }}
        >
          <Settings size={18} /> Cài đặt
        </div>
        <div className={styles.menuItem} onClick={handleLogout}>
          <LogOut size={18} /> Đăng xuất
        </div>
      </Modal>
    </>
  );
}
