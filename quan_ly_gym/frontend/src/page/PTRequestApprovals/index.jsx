import { useState, useEffect } from "react";
import api from "../../api/axiosClient";
import { ClipboardList, CheckCircle, XCircle } from "lucide-react";
import Modal from "../../components/Modal";
import styles from "./PTRequestApprovals.module.scss";

export default function PTRequestApprovals() {
  const [requests, setRequests] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [approveModal, setApproveModal] = useState(null); // stores the request object to approve
  const [selectedPT, setSelectedPT] = useState("");

  const fetchRequests = async () => {
    try {
      const res = await api.get("/managers/pt-requests");
      setRequests(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainers = async () => {
    try {
      const res = await api.get("/classes/available-instructors");
      setTrainers(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchTrainers();
  }, []);

  const handleApprove = async () => {
    if (!selectedPT) {
      alert("Vui lòng chọn PT!");
      return;
    }
    try {
      await api.post(`/managers/pt-requests/${approveModal.RequestID}/approve`, { pt_id: parseInt(selectedPT) });
      alert("Đã duyệt và phân bổ PT thành công!");
      setApproveModal(null);
      setSelectedPT("");
      fetchRequests();
    } catch (e) {
      alert("Lỗi: " + (e.response?.data?.detail || e.message));
    }
  };

  const handleReject = async (reqId) => {
    if (!window.confirm("Bạn có chắc muốn từ chối yêu cầu này?")) return;
    try {
      await api.post(`/managers/pt-requests/${reqId}/reject`);
      alert("Đã từ chối yêu cầu!");
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
              <ClipboardList size={26} color="#f6c23e" /> Duyệt Đăng Ký PT
            </h1>
            <p className={styles.subtitle}>Danh sách yêu cầu thuê PT từ hội viên</p>
          </div>
        </div>

        <div className={styles.tableWrap} style={{ marginTop: 20 }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Hội viên</th>
                <th>Ghi chú / Mục tiêu</th>
                <th>Ngày gửi</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} style={{ textAlign: "center", padding: 20 }}>Đang tải...</td></tr>}
              {!loading && requests.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", padding: 20 }}>Không có yêu cầu nào</td></tr>}
              {requests.map(r => (
                <tr key={r.RequestID}>
                  <td style={{ fontWeight: 700, color: "var(--theme-text-dark)", fontSize: "1.6rem" }}>
                    {r.MemberName}
                  </td>
                  <td style={{ maxWidth: 300, whiteSpace: "normal" }}>{r.Note}</td>
                  <td>{r.CreatedAt ? new Date(r.CreatedAt).toLocaleString("vi-VN") : "—"}</td>
                  <td>
                    {r.Status === "Pending" && <span style={{ color: "#f6c23e", fontWeight: "bold" }}>Đang chờ duyệt</span>}
                    {r.Status === "Approved" && <span style={{ color: "#1cc88a", fontWeight: "bold" }}>Đã duyệt</span>}
                    {r.Status === "Rejected" && <span style={{ color: "#e74a3b", fontWeight: "bold" }}>Bị từ chối</span>}
                  </td>
                  <td>
                    {r.Status === "Pending" ? (
                      <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={() => setApproveModal(r)} style={{ padding: "8px 16px", borderRadius: 8, background: "#1cc88a", color: "#fff", border: "none", cursor: "pointer", fontWeight: "bold" }}>
                          Duyệt
                        </button>
                        <button onClick={() => handleReject(r.RequestID)} style={{ padding: "8px 16px", borderRadius: 8, background: "#e74a3b", color: "#fff", border: "none", cursor: "pointer", fontWeight: "bold" }}>
                          Từ chối
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: "gray" }}>Đã xử lý</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {approveModal && (
        <Modal
          isOpen={!!approveModal}
          onRequestClose={() => { setApproveModal(null); setSelectedPT(""); }}
          title="Chọn PT phân bổ"
        >
          <div style={{ padding: "20px" }}>
            <p style={{ fontSize: "1.6rem", marginBottom: 15, color: "var(--theme-text-dark)" }}>
              Phân bổ PT cho hội viên: <strong>{approveModal?.MemberName}</strong>
            </p>
            <p style={{ fontSize: "1.4rem", marginBottom: 20, color: "var(--theme-text)", background: "var(--theme-bg)", padding: 10, borderRadius: 8 }}>
              <em>Ghi chú:</em> {approveModal?.Note}
            </p>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: "1.4rem", fontWeight: "bold", marginBottom: 8, color: "var(--theme-text-dark)" }}>Chọn PT</label>
              <select
                value={selectedPT}
                onChange={(e) => setSelectedPT(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid var(--theme-border)", fontSize: "1.5rem", background: "var(--theme-bg)", color: "var(--theme-text)" }}
              >
                <option value="">-- Chọn Huấn luyện viên --</option>
                {trainers.map(pt => (
                  <option key={pt.UserID} value={pt.UserID}>
                    {pt.FullName} (Điểm: {pt.Score}) - {pt.Specialty}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => { setApproveModal(null); setSelectedPT(""); }} style={{ padding: "10px 20px", borderRadius: 8, background: "gray", color: "#fff", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "1.5rem" }}>
                Hủy
              </button>
              <button onClick={handleApprove} style={{ padding: "10px 20px", borderRadius: 8, background: "#1cc88a", color: "#fff", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "1.5rem" }}>
                Xác nhận Phân bổ
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
