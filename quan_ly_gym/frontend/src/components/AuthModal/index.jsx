import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { Dumbbell, Eye, EyeOff, X } from "lucide-react";
import { login as loginApi, register as registerApi } from "../../api/authApi";
import styles from "./AuthModal.module.scss";

export default function AuthModal({ isOpen, onClose, initialView = "login" }) {
  const { login } = useContext(AuthContext);
  const nav = useNavigate();
  const [view, setView] = useState(initialView);

  // Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  // Register State
  const [regForm, setRegForm] = useState({
    hoTen: "",
    email: "",
    tenDangNhap: "",
    matKhau: "",
    referralCode: "",
  });

  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setView(initialView);
    setErr(null);
  }, [initialView, isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const data = await loginApi(email, password);
      login(data);
      onClose();
      // Redirect based on role from backend
      const role = data.user?.vaiTro?.toUpperCase();
      const target = role === "MEMBER" ? "/my-dashboard" : "/dashboard";
      nav(target);
    } catch (error) {
      setErr(error?.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await registerApi(regForm);
      setView("login");
      setEmail(regForm.tenDangNhap);
      setPassword(regForm.matKhau);
      setErr("Đăng ký thành công! Vui lòng đăng nhập.");
    } catch (error) {
      setErr(error?.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  const onRegChange = (k) => (e) => setRegForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={24} />
        </button>

        <div className={styles.header}>
          <div className={styles.logoIcon}>
            <Dumbbell size={28} color="#fff" />
          </div>
          <h2 className={styles.title}>The Pro Gym</h2>
          <p className={styles.subtitle}>
            {view === "login" ? "Chào mừng trở lại!" : "Tạo tài khoản mới"}
          </p>
        </div>

        {err && (
          <div className={err.includes("thành công") ? styles.successMsg : styles.errorMsg}>
            {err}
          </div>
        )}

        {view === "login" ? (
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.inputGroup}>
              <label>Email</label>
              <input
                type="text"
                placeholder="Nhập tên email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Mật khẩu</label>
              <div className={styles.pwdWrapper}>
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}>
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className={styles.formOptions}>
              <label className={styles.checkbox}>
                <input type="checkbox" defaultChecked />
                <span>Ghi nhớ tôi</span>
              </label>
              <a href="#forgot" className={styles.forgotLink}>Quên mật khẩu?</a>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "Đang xử lý..." : "Đăng Nhập"}
            </button>

            <div className={styles.switchView}>
              Chưa có tài khoản?{" "}
              <button type="button" onClick={() => { setView("register"); setErr(null); }}>
                Đăng ký ngay
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className={styles.form}>
            <div className={styles.inputGroup}>
              <label>Họ và tên</label>
              <input
                type="text"
                placeholder="Nguyễn Văn A"
                value={regForm.hoTen}
                onChange={onRegChange("hoTen")}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Email</label>
              <input
                type="email"
                placeholder="example@theprogym.vn"
                value={regForm.email}
                onChange={onRegChange("email")}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Tên đăng nhập</label>
              <input
                type="text"
                placeholder="Tên đăng nhập"
                value={regForm.tenDangNhap}
                onChange={onRegChange("tenDangNhap")}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Mật khẩu</label>
              <div className={styles.pwdWrapper}>
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder="••••••••"
                  value={regForm.matKhau}
                  onChange={onRegChange("matKhau")}
                  required
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}>
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label>Mã giới thiệu (Nếu có)</label>
              <input
                type="text"
                placeholder="VD: 8A4F1B3E"
                value={regForm.referralCode}
                onChange={onRegChange("referralCode")}
                className="uppercase"
              />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "Đang xử lý..." : "Đăng Ký"}
            </button>

            <div className={styles.switchView}>
              Đã có tài khoản?{" "}
              <button type="button" onClick={() => { setView("login"); setErr(null); }}>
                Đăng nhập
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
