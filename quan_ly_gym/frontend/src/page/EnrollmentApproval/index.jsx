import { useState, useEffect, useContext } from "react";
import api from "../../api/axiosClient";
import { AuthContext } from "../../context/AuthContext";
import { CheckCircle, XCircle, Users, Clock, Loader2 } from "lucide-react";

const cardSt = {
  background: "var(--theme-surface)", borderRadius: 14, border: "1px solid var(--theme-border)",
  padding: "20px 24px", marginBottom: 20,
};
const pillSt = (bg, color) => ({
  display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px",
  borderRadius: 20, fontSize: "1.2rem", fontWeight: 700, background: bg, color,
});

export default function EnrollmentApproval() {
  const { user } = useContext(AuthContext) ?? {};
  const role = (user?.vaiTro || user?.role || "").toUpperCase();
  const isPT = role === "PT";
  const userId = user?.userID || user?.userId || user?.UserID;

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(false);

  // Fetch classes based on role
  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      try {
        let res;
        if (isPT) {
          res = await api.get("/classes/my-teaching");
        } else {
          res = await api.get("/classes/all");
        }
        setClasses(Array.isArray(res.data) ? res.data : []);
      } catch { setClasses([]); }
      finally { setLoading(false); }
    };
    fetchClasses();
  }, [isPT]);

  // Fetch pending for selected class
  const fetchPending = async (classId) => {
    setPendingLoading(true);
    try {
      const res = await api.get(`/classes/${classId}/pending-enrollments`);
      setPending(Array.isArray(res.data) ? res.data : []);
    } catch { setPending([]); }
    finally { setPendingLoading(false); }
  };

  const selectClass = (cls) => {
    setSelectedClass(cls);
    fetchPending(cls.ClassID);
  };

  const handleApprove = async (enrollId) => {
    try {
      await api.post(`/classes/enrollments/${enrollId}/approve`);
      fetchPending(selectedClass.ClassID);
    } catch (e) { alert("Lỗi: " + (e.response?.data?.detail || e.message)); }
  };

  const handleReject = async (enrollId) => {
    if (!window.confirm("Từ chối yêu cầu đăng ký này?")) return;
    try {
      await api.post(`/classes/enrollments/${enrollId}/reject`);
      fetchPending(selectedClass.ClassID);
    } catch (e) { alert("Lỗi: " + (e.response?.data?.detail || e.message)); }
  };

  const dayMap = { 0: "T2", 1: "T3", 2: "T4", 3: "T5", 4: "T6", 5: "T7", 6: "CN" };

  if (loading) {
    return (
      <div style={{ padding: 24, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "var(--theme-text)" }}>
        <Loader2 size={24} style={{ animation: "spin 1s linear infinite", marginRight: 10 }} /> Đang tải...
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", minHeight: "100vh", background: "var(--theme-bg)", color: "var(--theme-text-dark)" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <Users size={24} /> Duyệt đăng ký lớp học
        </h1>
        <p style={{ color: "var(--theme-text)", fontSize: "1.4rem", margin: "4px 0 0" }}>
          {isPT ? "Duyệt yêu cầu đăng ký cho các lớp bạn phụ trách" : "Duyệt yêu cầu đăng ký tất cả lớp học"}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, alignItems: "start" }}>
        {/* Left: Class list */}
        <div style={cardSt}>
          <div style={{ fontWeight: 700, fontSize: "1.4rem", marginBottom: 12, color: "var(--theme-text-dark)" }}>
            📋 Chọn lớp học ({classes.length})
          </div>
          {classes.length === 0 ? (
            <div style={{ color: "var(--theme-text)", textAlign: "center", padding: 20 }}>
              {isPT ? "Bạn chưa phụ trách lớp nào" : "Chưa có lớp học nào"}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: "65vh", overflowY: "auto" }}>
              {classes.map(cls => {
                const isActive = selectedClass?.ClassID === cls.ClassID;
                const days = cls.RecurringDays
                  ? cls.RecurringDays.split(",").map(d => dayMap[d] || d).join(", ")
                  : "";
                return (
                  <button key={cls.ClassID} onClick={() => selectClass(cls)}
                    style={{
                      padding: "12px 14px", borderRadius: 10, cursor: "pointer", textAlign: "left",
                      border: `2px solid ${isActive ? "#4e73df" : "var(--theme-border)"}`,
                      background: isActive ? "#4e73df11" : "var(--theme-bg)",
                      transition: "all 0.2s",
                    }}>
                    <div style={{ fontWeight: 700, color: "var(--theme-text-dark)", fontSize: "1.4rem" }}>{cls.Name}</div>
                    <div style={{ fontSize: "1.2rem", color: "var(--theme-text)", marginTop: 2 }}>
                      🎓 {cls.InstructorName || "Chưa phân công"}
                    </div>
                    {days && <div style={{ fontSize: "1.1rem", color: "#36b9cc", marginTop: 2 }}>📅 {days}</div>}
                    <div style={{ fontSize: "1.1rem", color: "var(--theme-text)", marginTop: 2 }}>
                      👥 {cls.CurrentEnrolled}/{cls.MaxCapacity} học viên
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Pending enrollments */}
        <div style={cardSt}>
          {!selectedClass ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--theme-text)" }}>
              <Clock size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
              <div style={{ fontSize: "1.5rem" }}>Chọn một lớp học bên trái để xem yêu cầu đăng ký</div>
            </div>
          ) : pendingLoading ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--theme-text)" }}>
              <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} /> Đang tải...
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0, color: "var(--theme-text-dark)" }}>
                    ⏳ Yêu cầu chờ duyệt — {selectedClass.Name}
                  </h2>
                  <div style={{ fontSize: "1.2rem", color: "var(--theme-text)", marginTop: 2 }}>
                    HLV: {selectedClass.InstructorName} · Sĩ số: {selectedClass.CurrentEnrolled}/{selectedClass.MaxCapacity}
                  </div>
                </div>
                <span style={pillSt(pending.length > 0 ? "#f6c23e22" : "#1cc88a22", pending.length > 0 ? "#f6c23e" : "#1cc88a")}>
                  {pending.length > 0 ? `${pending.length} chờ duyệt` : "Không có yêu cầu"}
                </span>
              </div>

              {pending.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--theme-text)", fontSize: "1.4rem" }}>
                  ✅ Không có yêu cầu đăng ký nào chờ duyệt cho lớp này.
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--theme-bg)" }}>
                      {["#", "Họ tên", "Email", "Ngày gửi", "Hành động"].map(h => (
                        <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: "1.3rem", color: "var(--theme-text)", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((p, idx) => (
                      <tr key={p.EnrollID} style={{ borderTop: "1px solid var(--theme-border)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--theme-bg)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "12px 14px", color: "var(--theme-text)", fontSize: "1.4rem" }}>{idx + 1}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.FullName)}&background=f6c23e&color=fff&size=30`}
                              alt="" style={{ width: 30, height: 30, borderRadius: "50%" }} />
                            <strong style={{ color: "var(--theme-text-dark)", fontSize: "1.5rem" }}>{p.FullName}</strong>
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px", color: "var(--theme-text)", fontSize: "1.4rem" }}>{p.Email}</td>
                        <td style={{ padding: "12px 14px", color: "var(--theme-text)", fontSize: "1.4rem" }}>{p.EnrolledAt}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => handleApprove(p.EnrollID)}
                              style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 16px", background: "#1cc88a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: "1.3rem", transition: "all 0.2s" }}>
                              <CheckCircle size={15} /> Duyệt
                            </button>
                            <button onClick={() => handleReject(p.EnrollID)}
                              style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 16px", background: "#e74a3b22", color: "#e74a3b", border: "1px solid #e74a3b44", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: "1.3rem", transition: "all 0.2s" }}>
                              <XCircle size={15} /> Từ chối
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
