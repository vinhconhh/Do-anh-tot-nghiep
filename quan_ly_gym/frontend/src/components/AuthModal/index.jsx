import { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { Dumbbell, Eye, EyeOff, Mail, Lock, User, Hash, Github, Twitter, Chrome } from "lucide-react";
import { login as loginApi, register as registerApi } from "../../api/authApi";
import styles from "./AuthModal.module.scss";

export default function AuthModal({ isOpen, onClose, initialView = "login" }) {
  const { login } = useContext(AuthContext);
  const nav = useNavigate();
  const [view, setView] = useState(initialView);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

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
        <div className={styles.header}>
          <div className={styles.logoBrand}>
            <div className={styles.logoIconNew}>
              <span className={styles.tpgT}>T</span>
              <span className={styles.tpgP}>P</span>
              <span className={styles.tpgG}>G</span>
            </div>
            <div className={styles.logoDivider}></div>
            <h2 className={styles.title}>THE <span className={styles.textPrimary}>PRO</span> GYM</h2>
          </div>
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
              <div className={styles.inputWrapper}>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Mail className={styles.inputIcon} size={20} />
              </div>
            </div>
            <div className={styles.inputGroup}>
              <div className={styles.inputWrapper}>
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder="Mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={styles.hasToggle}
                />
                <Lock className={styles.inputIcon} size={20} />
                <button type="button" className={styles.pwdToggle} onClick={() => setShowPwd(!showPwd)}>
                  {showPwd ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className={styles.formOptions}>
              <label className={styles.checkbox}>
                <input type="checkbox" defaultChecked />
                <span>Ghi nhớ tôi</span>
              </label>
              <Link to="/forgot-password" className={styles.forgotLink} onClick={onClose}>Quên mật khẩu?</Link>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "Đang xử lý..." : "ĐĂNG NHẬP"}
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
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  placeholder="Họ và tên"
                  value={regForm.hoTen}
                  onChange={onRegChange("hoTen")}
                  required
                />
                <User className={styles.inputIcon} size={20} />
              </div>
            </div>
            <div className={styles.inputGroup}>
              <div className={styles.inputWrapper}>
                <input
                  type="email"
                  placeholder="Email"
                  value={regForm.email}
                  onChange={onRegChange("email")}
                />
                <Mail className={styles.inputIcon} size={20} />
              </div>
            </div>
            <div className={styles.inputGroup}>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  placeholder="Tên đăng nhập"
                  value={regForm.tenDangNhap}
                  onChange={onRegChange("tenDangNhap")}
                  required
                />
                <User className={styles.inputIcon} size={20} />
              </div>
            </div>
            <div className={styles.inputGroup}>
              <div className={styles.inputWrapper}>
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder="Mật khẩu"
                  value={regForm.matKhau}
                  onChange={onRegChange("matKhau")}
                  required
                  className={styles.hasToggle}
                />
                <Lock className={styles.inputIcon} size={20} />
                <button type="button" className={styles.pwdToggle} onClick={() => setShowPwd(!showPwd)}>
                  {showPwd ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div className={styles.inputGroup}>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  placeholder="Mã giới thiệu (Nếu có)"
                  value={regForm.referralCode}
                  onChange={onRegChange("referralCode")}
                  className={styles.uppercaseInput}
                />
                <Hash className={styles.inputIcon} size={20} />
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "Đang xử lý..." : "ĐĂNG KÝ"}
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
