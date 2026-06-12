import { useContext, useState, useEffect } from "react";
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
  Activity,
  HandshakeIcon,
  MessageSquare,
  Wrench,
  Building2,
  BookOpen,
  UserPlus,
  UtensilsCrossed,
  Shield,
} from "lucide-react";
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
    navigate("/");
  };

  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER";
  const isMember = role === "MEMBER";
  const isPT = role === "PT";

  const [hasApprovedPT, setHasApprovedPT] = useState(false);
  useEffect(() => {
    if (!isMember) return;
    import("../../../../api/axiosClient").then(({ default: api }) => {
      api.get("/pt-requests/my-requests")
        .then(res => {
          const reqs = Array.isArray(res.data) ? res.data : [];
          setHasApprovedPT(reqs.some(r => r.status === "approved"));
        })
        .catch(() => {});
    });
  }, [isMember]);

  return (
    <aside
      className={`bg-gym-surface text-gym-text-secondary flex flex-col p-[10px] transition-[width] duration-300 overflow-x-hidden overflow-y-auto sticky top-0 min-h-screen max-h-screen z-50 border-r border-gym-border ${collapsed ? "w-[72px]" : "w-[240px]"
        }`}
    >
      <div className="flex items-center gap-[10px] p-[12px] pb-[16px] text-white font-extrabold text-[15px] border-b border-white/10 mb-2 font-display tracking-wide">
        <button
          className="bg-transparent border-0 text-white flex items-center p-[6px] rounded-lg cursor-pointer shrink-0 hover:bg-white/10 transition-colors"
          onClick={() => setCollapsed((v) => !v)}
          aria-label="Toggle sidebar"
        >
          <Logs size={20} />
        </button>
        <span 
          onClick={() => navigate('/')}
          className={`flex items-center whitespace-nowrap font-display text-[24px] tracking-[2px] uppercase select-none cursor-pointer hover:opacity-80 transition-opacity ${collapsed ? 'hidden' : ''}`}
        >
          THE <span className="text-gym-primary mx-[4px]">PRO</span> GYM
        </span>
      </div>

      <nav className="flex flex-col gap-[2px] p-[4px]">

        {}
        {isAdmin && (
          <NavLink
            to="/account-management"
            className={({ isActive }) =>
              `flex items-center gap-[12px] h-[44px] px-[10px] rounded-lg text-[14px] font-medium transition-all duration-150 hover:bg-white/10 hover:text-white hover:translate-x-0.5 ${isActive ? "text-white bg-white/15" : "text-white/60"
              }`
            }
          >
            <Shield className="w-[18px] h-[18px] shrink-0" />
            <span className={`whitespace-nowrap overflow-hidden text-ellipsis ${collapsed ? 'hidden' : ''}`}>Quản lý tài khoản</span>
          </NavLink>
        )}



        {}
        {isManager && (
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-[12px] h-[44px] px-[10px] rounded-lg text-[14px] font-medium transition-all duration-150 hover:bg-white/10 hover:text-white hover:translate-x-0.5 ${isActive ? "text-white bg-white/15" : "text-white/60"
              }`
            }
          >
            <LayoutDashboard className="w-[18px] h-[18px] shrink-0" />
            <span className={`whitespace-nowrap overflow-hidden text-ellipsis ${collapsed ? 'hidden' : ''}`}>Dashboard</span>
          </NavLink>
        )}

        {}
        {isManager && (
          <div className="flex flex-col">
            <button
              type="button"
              className={`flex items-center gap-[12px] h-[44px] px-[10px] rounded-lg text-[14px] font-medium transition-all duration-150 w-full text-left hover:bg-white/10 hover:text-white hover:translate-x-0.5 ${openGroup === "members" ? "text-white bg-white/5" : "text-white/60"
                }`}
              onClick={() => toggleGroup("members")}
            >
              <Users className="w-[18px] h-[18px] shrink-0" />
              <span className={`whitespace-nowrap overflow-hidden text-ellipsis ${collapsed ? 'hidden' : ''}`}>Hội viên & PT</span>
              <span className={`ml-auto inline-flex ${collapsed ? 'hidden' : ''}`}>
                {openGroup === "members" ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </span>
            </button>
            <div
              className={`overflow-hidden transition-[max-height] duration-250 ease-in-out ${openGroup === "members" ? "max-h-[300px]" : "max-h-0"
                } ${collapsed ? "hidden" : ""}`}
            >
              <NavLink
                to="/members"
                className={({ isActive }) =>
                  `flex items-center gap-[10px] h-[38px] pl-[38px] pr-[12px] rounded-lg text-[14px] transition-colors duration-150 hover:text-gym-primary ${isActive ? "text-white" : "text-white/60"
                  }`
                }
              >
                <Users className="w-[16px] h-[16px] shrink-0" />
                <span>Danh sách hội viên</span>
              </NavLink>
              <NavLink
                to="/trainers"
                className={({ isActive }) =>
                  `flex items-center gap-[10px] h-[38px] pl-[38px] pr-[12px] rounded-lg text-[14px] transition-colors duration-150 hover:text-gym-primary ${isActive ? "text-white" : "text-white/60"
                  }`
                }
              >
                <UserCheck className="w-[16px] h-[16px] shrink-0" />
                <span>Huấn luyện viên</span>
              </NavLink>
              <NavLink
                to="/pt-requests"
                className={({ isActive }) =>
                  `flex items-center gap-[10px] h-[38px] pl-[38px] pr-[12px] rounded-lg text-[14px] transition-colors duration-150 hover:text-gym-primary ${isActive ? "text-white" : "text-white/60"
                  }`
                }
              >
                <ClipboardList className="w-[16px] h-[16px] shrink-0" />
                <span>Yêu cầu thuê PT</span>
              </NavLink>
            </div>
          </div>
        )}

        {}
        {isManager && (
          <div className="flex flex-col">
            <button
              type="button"
              className={`flex items-center gap-[12px] h-[44px] px-[10px] rounded-lg text-[14px] font-medium transition-all duration-150 w-full text-left hover:bg-white/10 hover:text-white hover:translate-x-0.5 ${openGroup === "facility" ? "text-white bg-white/5" : "text-white/60"
                }`}
              onClick={() => toggleGroup("facility")}
            >
              <Building2 className="w-[18px] h-[18px] shrink-0" />
              <span className={`whitespace-nowrap overflow-hidden text-ellipsis ${collapsed ? 'hidden' : ''}`}>Cơ sở vật chất</span>
              <span className={`ml-auto inline-flex ${collapsed ? 'hidden' : ''}`}>
                {openGroup === "facility" ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </span>
            </button>
            <div
              className={`overflow-hidden transition-[max-height] duration-250 ease-in-out ${openGroup === "facility" ? "max-h-[300px]" : "max-h-0"
                } ${collapsed ? "hidden" : ""}`}
            >
              <NavLink
                to="/equipment-management"
                className={({ isActive }) =>
                  `flex items-center gap-[10px] h-[38px] pl-[38px] pr-[12px] rounded-lg text-[14px] transition-colors duration-150 hover:text-gym-primary ${isActive ? "text-white" : "text-white/60"
                  }`
                }
              >
                <Wrench className="w-[16px] h-[16px] shrink-0" />
                <span>Máy tập & Thiết bị</span>
              </NavLink>
              <NavLink
                to="/gym-exercise-management"
                className={({ isActive }) =>
                  `flex items-center gap-[10px] h-[38px] pl-[38px] pr-[12px] rounded-lg text-[14px] transition-colors duration-150 hover:text-gym-primary ${isActive ? "text-white" : "text-white/60"
                  }`
                }
              >
                <BookOpen className="w-[16px] h-[16px] shrink-0" />
                <span>Danh mục Bài tập</span>
              </NavLink>
              <NavLink
                to="/gym-class-management"
                className={({ isActive }) =>
                  `flex items-center gap-[10px] h-[38px] pl-[38px] pr-[12px] rounded-lg text-[14px] transition-colors duration-150 hover:text-gym-primary ${isActive ? "text-white" : "text-white/60"
                  }`
                }
              >
                <CalendarCheck className="w-[16px] h-[16px] shrink-0" />
                <span>Lịch Lớp học</span>
              </NavLink>
              <NavLink
                to="/enrollment-approval"
                className={({ isActive }) =>
                  `flex items-center gap-[10px] h-[38px] pl-[38px] pr-[12px] rounded-lg text-[14px] transition-colors duration-150 hover:text-gym-primary ${isActive ? "text-white" : "text-white/60"
                  }`
                }
              >
                <UserPlus className="w-[16px] h-[16px] shrink-0" />
                <span>Duyệt ĐK lớp học</span>
              </NavLink>
              <NavLink
                to="/meal-plan-management"
                className={({ isActive }) =>
                  `flex items-center gap-[10px] h-[38px] pl-[38px] pr-[12px] rounded-lg text-[14px] transition-colors duration-150 hover:text-gym-primary ${isActive ? "text-white" : "text-white/60"
                  }`
                }
              >
                <UtensilsCrossed className="w-[16px] h-[16px] shrink-0" />
                <span>Thực đơn hội viên</span>
              </NavLink>
            </div>
          </div>
        )}

        {}
        {isManager && (
          <NavLink
            to="/member-report"
            className={({ isActive }) =>
              `flex items-center gap-[12px] h-[44px] px-[10px] rounded-lg text-[14px] font-medium transition-all duration-150 hover:bg-white/10 hover:text-white hover:translate-x-0.5 ${isActive ? "text-white bg-white/15" : "text-white/60"
              }`
            }
          >
            <BarChart2 className="w-[18px] h-[18px] shrink-0" />
            <span className={`whitespace-nowrap overflow-hidden text-ellipsis ${collapsed ? 'hidden' : ''}`}>Báo cáo hội viên</span>
          </NavLink>
        )}

        {}
        {isMember && (
          <>
            <NavLink
              to="/my-dashboard"
              className={({ isActive }) =>
                `flex items-center gap-[12px] h-[44px] px-[10px] rounded-lg text-[14px] font-medium transition-all duration-150 hover:bg-white/10 hover:text-white hover:translate-x-0.5 ${isActive ? "text-white bg-white/15" : "text-white/60"
                }`
              }
            >
              <Activity className="w-[18px] h-[18px] shrink-0" />
              <span className={`whitespace-nowrap overflow-hidden text-ellipsis ${collapsed ? 'hidden' : ''}`}>Bài tập hàng ngày</span>
            </NavLink>

            <NavLink
              to="/my-workout-schedule"
              className={({ isActive }) =>
                `flex items-center gap-[12px] h-[44px] px-[10px] rounded-lg text-[14px] font-medium transition-all duration-150 hover:bg-white/10 hover:text-white hover:translate-x-0.5 ${isActive ? "text-white bg-white/15" : "text-white/60"
                }`
              }
            >
              <CalendarCheck className="w-[18px] h-[18px] shrink-0" />
              <span className={`whitespace-nowrap overflow-hidden text-ellipsis ${collapsed ? 'hidden' : ''}`}>Lịch tập của tôi</span>
            </NavLink>

            <NavLink
              to="/pt-requests"
              className={({ isActive }) =>
                `flex items-center gap-[12px] h-[44px] px-[10px] rounded-lg text-[14px] font-medium transition-all duration-150 hover:bg-white/10 hover:text-white hover:translate-x-0.5 ${isActive ? "text-white bg-white/15" : "text-white/60"
                }`
              }
            >
              <HandshakeIcon className="w-[18px] h-[18px] shrink-0" />
              <span className={`whitespace-nowrap overflow-hidden text-ellipsis ${collapsed ? 'hidden' : ''}`}>{hasApprovedPT ? "PT & Lớp học" : "Thuê PT"}</span>
            </NavLink>
          </>
        )}

        {}
        {isPT && (
          <>
            <NavLink
              to="/my-schedule"
              className={({ isActive }) =>
                `flex items-center gap-[12px] h-[44px] px-[10px] rounded-lg text-[14px] font-medium transition-all duration-150 hover:bg-white/10 hover:text-white hover:translate-x-0.5 ${isActive ? "text-white bg-white/15" : "text-white/60"
                }`
              }
            >
              <CalendarCheck className="w-[18px] h-[18px] shrink-0" />
              <span className={`whitespace-nowrap overflow-hidden text-ellipsis ${collapsed ? 'hidden' : ''}`}>Lịch dạy của tôi</span>
            </NavLink>


            <NavLink
              to="/pt-requests"
              className={({ isActive }) =>
                `flex items-center gap-[12px] h-[44px] px-[10px] rounded-lg text-[14px] font-medium transition-all duration-150 hover:bg-white/10 hover:text-white hover:translate-x-0.5 ${isActive ? "text-white bg-white/15" : "text-white/60"
                }`
              }
            >
              <ClipboardList className="w-[18px] h-[18px] shrink-0" />
              <span className={`whitespace-nowrap overflow-hidden text-ellipsis ${collapsed ? 'hidden' : ''}`}>Yêu cầu thuê PT</span>
            </NavLink>

            <NavLink
              to="/my-clients"
              className={({ isActive }) =>
                `flex items-center gap-[12px] h-[44px] px-[10px] rounded-lg text-[14px] font-medium transition-all duration-150 hover:bg-white/10 hover:text-white hover:translate-x-0.5 ${isActive ? "text-white bg-white/15" : "text-white/60"
                }`
              }
            >
              <Users className="w-[18px] h-[18px] shrink-0" />
              <span className={`whitespace-nowrap overflow-hidden text-ellipsis ${collapsed ? 'hidden' : ''}`}>Khách hàng của tôi</span>
            </NavLink>

            <NavLink
              to="/pt-assignments"
              className={({ isActive }) =>
                `flex items-center gap-[12px] h-[44px] px-[10px] rounded-lg text-[14px] font-medium transition-all duration-150 hover:bg-white/10 hover:text-white hover:translate-x-0.5 ${isActive ? "text-white bg-white/15" : "text-white/60"
                }`
              }
            >
              <Dumbbell className="w-[18px] h-[18px] shrink-0" />
              <span className={`whitespace-nowrap overflow-hidden text-ellipsis ${collapsed ? 'hidden' : ''}`}>Phân bài tập</span>
            </NavLink>

            <NavLink
              to="/training-progress"
              className={({ isActive }) =>
                `flex items-center gap-[12px] h-[44px] px-[10px] rounded-lg text-[14px] font-medium transition-all duration-150 hover:bg-white/10 hover:text-white hover:translate-x-0.5 ${isActive ? "text-white bg-white/15" : "text-white/60"
                }`
              }
            >
              <BarChart2 className="w-[18px] h-[18px] shrink-0" />
              <span className={`whitespace-nowrap overflow-hidden text-ellipsis ${collapsed ? 'hidden' : ''}`}>Tiến độ học viên</span>
            </NavLink>

            <NavLink
              to="/enrollment-approval"
              className={({ isActive }) =>
                `flex items-center gap-[12px] h-[44px] px-[10px] rounded-lg text-[14px] font-medium transition-all duration-150 hover:bg-white/10 hover:text-white hover:translate-x-0.5 ${isActive ? "text-white bg-white/15" : "text-white/60"
                }`
              }
            >
              <UserPlus className="w-[18px] h-[18px] shrink-0" />
              <span className={`whitespace-nowrap overflow-hidden text-ellipsis ${collapsed ? 'hidden' : ''}`}>Duyệt ĐK lớp học</span>
            </NavLink>
          </>
        )}

        {}
        {isManager && (
          <NavLink
            to="/schedules"
            className={({ isActive }) =>
              `flex items-center gap-[12px] h-[44px] px-[10px] rounded-lg text-[14px] font-medium transition-all duration-150 hover:bg-white/10 hover:text-white hover:translate-x-0.5 ${isActive ? "text-white bg-white/15" : "text-white/60"
              }`
            }
          >
            <CalendarCheck className="w-[18px] h-[18px] shrink-0" />
            <span className={`whitespace-nowrap overflow-hidden text-ellipsis ${collapsed ? 'hidden' : ''}`}>Lịch tổng</span>
          </NavLink>
        )}

        {}
        {isMember && (
          <NavLink
            to="/ai-chat"
            className={({ isActive }) =>
              `flex items-center gap-[12px] h-[44px] px-[10px] rounded-lg text-[14px] font-medium transition-all duration-150 hover:bg-white/10 hover:text-white hover:translate-x-0.5 ${isActive ? "text-white bg-white/15" : "text-white/60"
              }`
            }
          >
            <MessageSquare className="w-[18px] h-[18px] shrink-0" />
            <span className={`whitespace-nowrap overflow-hidden text-ellipsis ${collapsed ? 'hidden' : ''}`}>Hỏi đáp AI</span>
          </NavLink>
        )}
      </nav>

      <div className="h-px bg-white/15 my-[10px] mx-[8px]" />

      <div className={`flex items-center gap-[10px] p-[10px] m-1 rounded-lg bg-white/10 ${collapsed ? 'justify-center' : ''}`}>
        <img className="w-[38px] h-[38px] rounded-full object-cover shrink-0" src={avatarUrl} alt={displayName} />
        <div className={`min-w-0 flex-1 ${collapsed ? 'hidden' : ''}`}>
          <div className="text-white font-bold text-[14px] leading-tight truncate">{displayName}</div>
          <div className="text-[11px] text-white/75 truncate">{role}</div>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-[2px] p-[4px]">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-[12px] h-[44px] px-[10px] rounded-lg text-[14px] font-medium transition-all duration-150 hover:bg-white/10 hover:text-white hover:translate-x-0.5 ${isActive ? "text-white bg-white/15" : "text-white/60"
            }`
          }
        >
          <Settings className="w-[18px] h-[18px] shrink-0" />
          <span className={`whitespace-nowrap overflow-hidden text-ellipsis ${collapsed ? 'hidden' : ''}`}>Cài đặt</span>
        </NavLink>
        <button
          className={`flex items-center gap-[12px] h-[44px] px-[10px] rounded-lg text-[14px] font-medium transition-all duration-150 bg-transparent border-0 text-white/60 w-full text-left cursor-pointer hover:bg-white/10 hover:text-white hover:translate-x-0.5`}
          onClick={handleLogout}
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          <span className={`whitespace-nowrap overflow-hidden text-ellipsis ${collapsed ? 'hidden' : ''}`}>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}