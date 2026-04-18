import { useContext, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Logs,
  LayoutDashboard,
  Users,
  Dumbbell,
  Bot,
  BarChart2,
  ChevronRight,
  ChevronDown,
  UserCircle,
  CalendarCheck,
  ShoppingCart,
  Settings,
  LogOut,
  UserCheck,
  ClipboardList,
} from "lucide-react";
import styles from "./Sidebar.module.scss";
import { AuthContext } from "../../../../context/AuthContext";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [openGroup, setOpenGroup] = useState(null);
  const { user, logout } = useContext(AuthContext) ?? {};
  const navigate = useNavigate();

  const displayName = user?.hoTen || user?.name || "Admin";
  const role = (user?.vaiTro || user?.role || "ADMIN").toUpperCase();
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4e73df&color=fff&size=128`;

  const toggleGroup = (key) =>
    setOpenGroup((prev) => (prev === key ? null : key));

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isAdmin = ["ADMIN", "MANAGER"].includes(role);
  const isMember = role === "MEMBER";
  const isPT = role === "PT";

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles.brand}>
        <span
          className={styles.toggle}
          onClick={() => setCollapsed((v) => !v)}
          aria-label="Toggle sidebar"
        >
          <Logs size={20} />
        </span>
        <span className={styles.brandText}>
          <Dumbbell size={18} style={{ marginRight: 6 }} />
          FitPro Gym
        </span>
      </div>

      <nav className={styles.menu}>
        {/* Dashboard - Admin/Manager */}
        {isAdmin && (
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `${styles.item} ${isActive ? styles.active : ""}`
            }
          >
            <LayoutDashboard className={styles.icon} />
            <span className={styles.label}>Dashboard</span>
          </NavLink>
        )}

        {/* Dashboard - Member */}
        {isMember && (
          <NavLink
            to="/my-dashboard"
            className={({ isActive }) =>
              `${styles.item} ${isActive ? styles.active : ""}`
            }
          >
            <LayoutDashboard className={styles.icon} />
            <span className={styles.label}>Trang chủ</span>
          </NavLink>
        )}

        {/* Quản lý hội viên & PT */}
        {isAdmin && (
          <div className={styles.group}>
            <button
              type="button"
              className={`${styles.item} ${styles.groupHeader} ${
                openGroup === "members" ? styles.expanded : ""
              }`}
              onClick={() => toggleGroup("members")}
            >
              <Users className={styles.icon} />
              <span className={styles.label}>Hội viên & PT</span>
              <span className={styles.chev}>
                {openGroup === "members" ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </span>
            </button>
            <div
              className={`${styles.sub} ${
                openGroup === "members" ? styles.subOpen : ""
              } ${collapsed ? styles.subCollapsed : ""}`}
            >
              <NavLink
                to="/members"
                className={({ isActive }) =>
                  `${styles.subItem} ${isActive ? styles.active : ""}`
                }
              >
                <Users size={16} className={styles.iconSm} />
                <span>Danh sách hội viên</span>
              </NavLink>
              <NavLink
                to="/trainers"
                className={({ isActive }) =>
                  `${styles.subItem} ${isActive ? styles.active : ""}`
                }
              >
                <UserCheck size={16} className={styles.iconSm} />
                <span>Huấn luyện viên</span>
              </NavLink>
              <NavLink
                to="/pt-requests"
                className={({ isActive }) =>
                  `${styles.subItem} ${isActive ? styles.active : ""}`
                }
              >
                <ClipboardList size={16} className={styles.iconSm} />
                <span>Yêu cầu thuê PT</span>
              </NavLink>
            </div>
          </div>
        )}

        {/* Gói tập & Billing */}
        {isAdmin && (
          <NavLink
            to="/billing"
            className={({ isActive }) =>
              `${styles.item} ${isActive ? styles.active : ""}`
            }
          >
            <ShoppingCart className={styles.icon} />
            <span className={styles.label}>Gói tập & Billing</span>
          </NavLink>
        )}

        {/* Bài tập Master */}
        {isAdmin && (
          <NavLink
            to="/exercises"
            className={({ isActive }) =>
              `${styles.item} ${isActive ? styles.active : ""}`
            }
          >
            <Dumbbell className={styles.icon} />
            <span className={styles.label}>Bài tập Master</span>
          </NavLink>
        )}

        {/* AI & Phân tích */}
        {isAdmin && (
          <NavLink
            to="/ai-purchase"
            className={({ isActive }) =>
              `${styles.item} ${isActive ? styles.active : ""}`
            }
          >
            <Bot className={styles.icon} />
            <span className={styles.label}>Mua thêm lượt AI</span>
          </NavLink>
        )}

        {isAdmin && (
          <NavLink
            to="/member-report"
            className={({ isActive }) =>
              `${styles.item} ${isActive ? styles.active : ""}`
            }
          >
            <BarChart2 className={styles.icon} />
            <span className={styles.label}>Báo cáo hội viên</span>
          </NavLink>
        )}

        {/* Member: lịch sử tập */}
        {isMember && (
          <>
            <NavLink
              to="/my-workout-schedule"
              className={({ isActive }) =>
                `${styles.item} ${isActive ? styles.active : ""}`
              }
            >
              <CalendarCheck className={styles.icon} />
              <span className={styles.label}>Lịch tập của tôi</span>
            </NavLink>

            <NavLink
              to="/ai-purchase"
              className={({ isActive }) =>
                `${styles.item} ${isActive ? styles.active : ""}`
              }
            >
              <Bot className={styles.icon} />
              <span className={styles.label}>Mua thêm lượt AI</span>
            </NavLink>
          </>
        )}

        {/* PT */}
        {isPT && (
          <NavLink
            to="/my-schedule"
            className={({ isActive }) =>
              `${styles.item} ${isActive ? styles.active : ""}`
            }
          >
            <CalendarCheck className={styles.icon} />
            <span className={styles.label}>Lịch dạy của tôi</span>
          </NavLink>
        )}

        {/* Admin/Manager: lịch tổng */}
        {isAdmin && (
          <NavLink
            to="/schedules"
            className={({ isActive }) =>
              `${styles.item} ${isActive ? styles.active : ""}`
            }
          >
            <CalendarCheck className={styles.icon} />
            <span className={styles.label}>Lịch tổng</span>
          </NavLink>
        )}
      </nav>

      <div className={styles.line} />

      <div className={styles.user}>
        <img className={styles.avatar} src={avatarUrl} alt={displayName} />
        <div className={styles.userInfo}>
          <div className={styles.name}>{displayName}</div>
          <div className={styles.role}>{role}</div>
        </div>
      </div>

      <div className={styles.bottom}>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `${styles.item} ${isActive ? styles.active : ""}`
          }
        >
          <Settings className={styles.icon} />
          <span className={styles.label}>Cài đặt</span>
        </NavLink>
        <button
          className={`${styles.item} ${styles.asButton}`}
          onClick={handleLogout}
        >
          <LogOut className={styles.icon} />
          <span className={styles.label}>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
