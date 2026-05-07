import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LogOut, Settings, User } from "lucide-react";
import { AuthContext } from "../../../context/AuthContext";
import Modal from "../../../components/Modal";

export default function Header() {
  const { user, logout } = useContext(AuthContext) ?? {};
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const nav = useNavigate();

  const displayName = user?.hoTen || user?.name || "Admin";
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4e73df&color=fff&size=64`;

  const handleLogout = () => {
    logout();
    nav("/");
  };

  return (
    <>
      <header className="h-[70px] bg-slate-800 shadow-md border-b border-slate-700 flex items-center justify-end px-[24px] sticky top-0 z-[100]">
        {/* Alert bell */}
        <div className="flex items-center gap-[12px]">
          <button
            className="relative bg-transparent border-0 cursor-pointer text-slate-400 flex items-center p-[6px] rounded-lg hover:text-sky-500 hover:bg-slate-900 transition-colors"
            onClick={() => setIsAlertOpen(true)}
          >
            <Bell size={20} />
            <span className="absolute top-[2px] right-[2px] bg-[#e74a3b] text-white text-[10px] font-bold rounded-full w-[16px] h-[16px] flex items-center justify-center">0</span>
          </button>

          <div className="w-[1px] h-[32px] bg-slate-700" />

          {/* User menu */}
          <button
            className="flex items-center gap-[8px] bg-transparent border-0 cursor-pointer text-slate-400 text-[14px] p-[4px] px-[8px] rounded-lg hover:text-sky-500 hover:bg-slate-900 transition-colors"
            onClick={() => setIsUserOpen(true)}
          >
            <span className="font-semibold text-slate-50">{displayName}</span>
            <img className="w-[32px] h-[32px] rounded-full object-cover" src={avatarUrl} alt={displayName} />
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
        <div className="flex flex-col gap-3">
          <div className="text-center py-5 text-slate-400">Không có thông báo mới</div>
        </div>
      </Modal>

      {/* User Modal */}
      <Modal
        isOpen={isUserOpen}
        onRequestClose={() => setIsUserOpen(false)}
        title="Tài khoản"
      >
        <div className="min-w-[340px] flex flex-col gap-1">
          <div className="flex items-center gap-4 p-5 bg-slate-900 rounded-xl mb-4 border border-slate-700 shadow-inner">
            <img className="w-16 h-16 rounded-full object-cover shadow-md" src={avatarUrl} alt={displayName} />
            <div>
              <div className="text-[18px] font-bold text-slate-50">{displayName}</div>
              <div className="text-[14px] text-slate-400 font-medium mt-1">
                {user?.vaiTro || user?.role || "Admin"}
              </div>
            </div>
          </div>
          <div
            className="flex items-center gap-3 py-4 px-5 rounded-xl cursor-pointer text-[15px] font-medium text-slate-50 hover:bg-slate-900 hover:text-sky-500 transition-colors"
            onClick={() => { nav("/settings"); setIsUserOpen(false); }}
          >
            <Settings size={20} /> Cài đặt
          </div>
          <div className="flex items-center gap-3 py-4 px-5 rounded-xl cursor-pointer text-[15px] font-medium text-slate-50 hover:bg-slate-900 hover:text-sky-500 transition-colors" onClick={handleLogout}>
            <LogOut size={20} /> Đăng xuất
          </div>
        </div>
      </Modal>
    </>
  );
}
