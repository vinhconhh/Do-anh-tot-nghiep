import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { Dumbbell, Eye, EyeOff } from "lucide-react";
import styles from "./Login.module.scss";
import { login as loginApi } from "../../api/authApi";

export default function Login() {
  const { login } = useContext(AuthContext);
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const data = await loginApi(email, password);
      login(data);
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

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Dumbbell size={32} color="#fff" />
          </div>
          <h2 className={styles.logoTitle}>FitPro Gym</h2>
          <p className={styles.logoSub}>Hệ thống quản lý phòng gym thông minh</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin}>
          {err && <div className={styles.error}>{err}</div>}

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Email / Tên đăng nhập</label>
            <input
              className={styles.input}
              type="text"
              placeholder="example@fitpro.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Mật khẩu</label>
            <div className={styles.pwdWrap}>
              <input
                className={styles.input}
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPwd((v) => !v)}
              >
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className={styles.row}>
            <label className={styles.checkLabel}>
              <input type="checkbox" defaultChecked /> Ghi nhớ đăng nhập
            </label>
            <a href="/forgot-password" className={styles.forgot}>
              Quên mật khẩu?
            </a>
          </div>

          <button className={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <div className={styles.footer}>
          Chưa có tài khoản?{" "}
          <a href="/register" className={styles.link}>
            Đăng ký ngay
          </a>
        </div>
      </div>
    </div>
  );
}
