import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register as registerApi } from "../../api/authApi";

export default function Register() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [form, setForm] = useState({
    tenDangNhap: "",
    matKhau: "",
    hoTen: "",
    email: "",
  });

  const onChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await registerApi(form);
      setLoading(false);
      nav("/login");
    } catch (e2) {
      setLoading(false);
      setErr(e2?.message || "Đăng ký thất bại");
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: "40px auto", padding: 24 }}>
      <h2 style={{ margin: "0 0 8px" }}>Đăng ký</h2>
      <p style={{ margin: "0 0 16px", opacity: 0.85 }}>
        Tạo tài khoản (màn hình đơn giản để tránh 404).
      </p>

      {err && (
        <div style={{ background: "#e74a3b22", color: "#e74a3b", padding: 10, borderRadius: 8, marginBottom: 12 }}>
          {err}
        </div>
      )}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <input placeholder="Họ tên" value={form.hoTen} onChange={onChange("hoTen")} required />
        <input placeholder="Email" value={form.email} onChange={onChange("email")} />
        <input placeholder="Tên đăng nhập" value={form.tenDangNhap} onChange={onChange("tenDangNhap")} required />
        <input placeholder="Mật khẩu" type="password" value={form.matKhau} onChange={onChange("matKhau")} required />

        <button type="submit" disabled={loading} style={{ padding: 10 }}>
          {loading ? "Đang tạo..." : "Tạo tài khoản"}
        </button>
        <button type="button" onClick={() => nav("/login")} style={{ padding: 10 }}>
          Quay lại đăng nhập
        </button>
      </form>
    </div>
  );
}

