import { useState, useEffect } from "react";
import api from "../../api/axiosClient";
import { X, CheckCircle, XCircle } from "lucide-react";

export default function AttendanceModal({ classId, classTitle, onClose }) {
  const [members, setMembers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Local state for attendance: { MemberID: "Present" | "Absent" }
  const [attendance, setAttendance] = useState({});

  useEffect(() => {
    api.get(`/classes/${classId}/attendance`)
      .then((res) => {
        setSubmitted(!!res.data.AttendanceSubmitted);
        setMembers(res.data.Members || []);
        
        // Initialize attendance map
        const initial = {};
        (res.data.Members || []).forEach(m => {
          if (m.AttendanceStatus) {
            initial[m.MemberID] = m.AttendanceStatus;
          }
        });
        setAttendance(initial);
      })
      .catch((e) => {
        alert("Không thể tải danh sách lớp học: " + (e.response?.data?.detail || e.message));
        onClose();
      })
      .finally(() => setLoading(false));
  }, [classId, onClose]);

  const toggleStatus = (memberId, status) => {
    if (submitted) return;
    setAttendance(prev => ({
      ...prev,
      [memberId]: prev[memberId] === status ? null : status
    }));
  };

  const handleSave = async () => {
    if (!window.confirm("Sau khi chốt điểm danh, danh sách sẽ KHÔNG THỂ thay đổi. Bạn có chắc chắn?")) return;
    
    setSaving(true);
    try {
      await api.post(`/classes/${classId}/attendance`, { attendance_data: attendance });
      alert("Đã chốt điểm danh thành công!");
      setSubmitted(true);
    } catch (e) {
      alert("Lỗi khi chốt điểm danh: " + (e.response?.data?.detail || e.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
      <div style={{ background: "var(--theme-surface, #1F2937)", border: "1px solid var(--theme-border, #374151)", borderRadius: 16, padding: 28, width: "100%", maxWidth: 600, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 25px 50px rgba(0,0,0,0.5)", color: "var(--theme-text-dark, #fff)" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontWeight: 800, fontSize: "1.5rem", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <CheckCircle size={22} color="#1cc88a" /> Điểm danh: {classTitle}
          </h2>
          <button onClick={onClose} style={{ background: "transparent", color: "var(--theme-text-dark, #fff)", border: "none", cursor: "pointer" }}><X size={24} /></button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 30 }}>Đang tải...</div>
        ) : members.length === 0 ? (
          <div style={{ textAlign: "center", padding: 30 }}>Lớp học này chưa có hội viên nào.</div>
        ) : (
          <>
            {submitted && (
              <div style={{ background: "#e74a3b22", color: "#e74a3b", padding: "12px", borderRadius: "8px", marginBottom: "16px", fontWeight: "600", textAlign: "center" }}>
                🔒 Lớp học này đã chốt điểm danh!
              </div>
            )}
            
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
              <thead>
                <tr style={{ background: "var(--theme-bg, #111827)", borderBottom: "1px solid var(--theme-border, #374151)" }}>
                  <th style={{ padding: "12px", textAlign: "left" }}>Học viên</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>Có mặt</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>Vắng</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.MemberID} style={{ borderBottom: "1px solid var(--theme-border, #374151)" }}>
                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(m.FullName)}&background=4e73df&color=fff&size=30`}
                             alt="" style={{ width: 30, height: 30, borderRadius: "50%" }} />
                        <div>
                          <div style={{ fontWeight: "600", fontSize: "1.1rem" }}>{m.FullName}</div>
                          <div style={{ fontSize: "0.9rem", opacity: 0.7 }}>{m.Email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <button 
                        onClick={() => toggleStatus(m.MemberID, "Present")}
                        disabled={submitted}
                        style={{ 
                          background: attendance[m.MemberID] === "Present" ? "#1cc88a" : "transparent",
                          color: attendance[m.MemberID] === "Present" ? "#fff" : "#1cc88a",
                          border: "2px solid #1cc88a",
                          borderRadius: "50%", width: "32px", height: "32px",
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          cursor: submitted ? "not-allowed" : "pointer", opacity: submitted && attendance[m.MemberID] !== "Present" ? 0.3 : 1
                        }}
                      >
                        <CheckCircle size={18} />
                      </button>
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <button 
                        onClick={() => toggleStatus(m.MemberID, "Absent")}
                        disabled={submitted}
                        style={{ 
                          background: attendance[m.MemberID] === "Absent" ? "#e74a3b" : "transparent",
                          color: attendance[m.MemberID] === "Absent" ? "#fff" : "#e74a3b",
                          border: "2px solid #e74a3b",
                          borderRadius: "50%", width: "32px", height: "32px",
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          cursor: submitted ? "not-allowed" : "pointer", opacity: submitted && attendance[m.MemberID] !== "Absent" ? 0.3 : 1
                        }}
                      >
                        <XCircle size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!submitted && (
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid var(--theme-border)", background: "transparent", color: "var(--theme-text)", cursor: "pointer" }}>
                  Hủy
                </button>
                <button onClick={handleSave} disabled={saving} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "#4e73df", color: "#fff", fontWeight: "600", cursor: "pointer" }}>
                  {saving ? "Đang lưu..." : "Chốt Điểm Danh"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
