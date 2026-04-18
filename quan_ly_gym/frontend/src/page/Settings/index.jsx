import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

export default function Settings() {
  const { user } = useContext(AuthContext) ?? {};
  const name = user?.hoTen || user?.name || "Người dùng";

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ margin: "0 0 8px" }}>Cài đặt</h2>
      <p style={{ margin: 0, opacity: 0.85 }}>
        Xin chào <strong>{name}</strong>. Trang cài đặt đang được hoàn thiện.
      </p>
    </div>
  );
}

