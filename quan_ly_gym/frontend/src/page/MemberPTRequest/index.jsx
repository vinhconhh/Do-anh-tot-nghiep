import { useState, useEffect } from "react";
import api from "../../api/axiosClient";
import { HandshakeIcon, Edit3 } from "lucide-react";
import styles from "./MemberPTRequest.module.scss";

export default function MemberPTRequest() {
  const [requests, setRequests] = useState([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await api.get("/members/pt-requests/my");
      setRequests(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!note.trim()) {
      alert("Vui lòng nhập ghi chú!");
      return;
    }
    try {
      await api.post("/members/pt-requests", { note });
      alert("Đã gửi yêu cầu thành công!");
      setNote("");
      fetchRequests();
    } catch (e) {
      alert("Lỗi: " + (e.response?.data?.detail || e.message));
    }
  };

  return (
    <>
      <div className={styles.tab} />
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>
              <HandshakeIcon size={26} color="#f6c23e" /> Đăng Ký PT (Huấn Luyện Viên Cá Nhân)
            </h1>
            <p className={styles.subtitle}>Gửi yêu cầu thuê PT với mục tiêu tập luyện của bạn</p>
          </div>
        </div>

        <div style={{ background: "var(--theme-card)", padding: 20, borderRadius: 12, marginTop: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: "1.8rem", marginBottom: 15, color: "var(--theme-text-dark)", display: "flex", alignItems: "center", gap: 10 }}>
            <Edit3 size={20} /> Gửi yêu cầu mới
          </h2>
          <form onSubmit={handleSubmit}>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập mục tiêu tập luyện, thời gian rảnh, mong muốn về PT..."
              style={{ width: "100%", padding: 15, borderRadius: 8, border: "1px solid var(--theme-border)", minHeight: 100, fontSize: "1.5rem", marginBottom: 15, background: "var(--theme-bg)", color: "var(--theme-text)" }}
            />
            <button type="submit" style={{ padding: "10px 20px", borderRadius: 8, background: "#f6c23e", color: "#fff", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "1.5rem" }}>
              Gửi yêu cầu
            </button>
          </form>
        </div>

        <div className={styles.tableWrap} style={{ marginTop: 30 }}>
          <h2 style={{ fontSize: "1.8rem", padding: "15px 20px", margin: 0, color: "var(--theme-text-dark)", borderBottom: "1px solid var(--theme-border)" }}>Lịch sử yêu cầu</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Ngày gửi</th>
                <th>Ghi chú</th>
                <th>Trạng thái</th>
                <th>Ngày phản hồi</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={4} style={{ textAlign: "center", padding: 20 }}>Đang tải...</td></tr>}
              {!loading && requests.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", padding: 20 }}>Bạn chưa gửi yêu cầu nào</td></tr>}
              {requests.map(r => (
                <tr key={r.RequestID}>
                  <td>{r.CreatedAt ? new Date(r.CreatedAt).toLocaleString("vi-VN") : "—"}</td>
                  <td style={{ maxWidth: 300, whiteSpace: "normal" }}>{r.Note}</td>
                  <td>
                    {r.Status === "Pending" && <span style={{ color: "#f6c23e", fontWeight: "bold" }}>Đang chờ duyệt</span>}
                    {r.Status === "Approved" && (
                      <span style={{ color: "#1cc88a", fontWeight: "bold" }}>
                        Đã phân bổ PT: {r.AssignedPT || "—"}
                      </span>
                    )}
                    {r.Status === "Rejected" && <span style={{ color: "#e74a3b", fontWeight: "bold" }}>Bị từ chối</span>}
                  </td>
                  <td>{r.ReviewedAt ? new Date(r.ReviewedAt).toLocaleString("vi-VN") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
