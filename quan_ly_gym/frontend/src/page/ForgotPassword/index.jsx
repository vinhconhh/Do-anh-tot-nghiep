import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const nav = useNavigate();
  return (
    <div style={{ maxWidth: 520, margin: "40px auto", padding: 24 }}>
      <h2 style={{ margin: "0 0 8px" }}>Quên mật khẩu</h2>
      <p style={{ margin: "0 0 16px", opacity: 0.85 }}>
        Chức năng này đang được phát triển.
      </p>
      <button onClick={() => nav("/")} style={{ padding: 10 }}>
        Về trang chủ
      </button>
    </div>
  );
}

