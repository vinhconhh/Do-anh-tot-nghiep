import { useState, useEffect } from "react";
import api from "../../api/axiosClient";
import { BookOpen, Calendar, Clock, MapPin, User, CheckCircle, XCircle } from "lucide-react";
import styles from "./MemberClasses.module.scss";

export default function MemberClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchClasses = async () => {
    try {
      const res = await api.get("/classes");
      setClasses(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleEnroll = async (classId) => {
    try {
      await api.post(`/classes/${classId}/enroll`);
      alert("Đã gửi yêu cầu đăng ký!");
      fetchClasses();
    } catch (e) {
      alert("Lỗi: " + (e.response?.data?.detail || e.message));
    }
  };

  const handleCancel = async (classId) => {
    if (!window.confirm("Bạn có chắc muốn hủy đăng ký lớp này?")) return;
    try {
      await api.delete(`/classes/${classId}/enroll`);
      alert("Đã hủy đăng ký!");
      fetchClasses();
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
              <BookOpen size={26} color="#f6c23e" /> Đăng Ký Lớp Học
            </h1>
            <p className={styles.subtitle}>Danh sách các lớp học hiện tại</p>
          </div>
        </div>

        <div className={styles.tableWrap} style={{ marginTop: 20 }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Lớp</th>
                <th>Giảng viên</th>
                <th>Phòng</th>
                <th>Lịch / Thời gian</th>
                <th>Sĩ số</th>
                <th>Tình trạng</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} style={{ textAlign: "center", padding: 20 }}>Đang tải...</td></tr>}
              {!loading && classes.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", padding: 20 }}>Không có lớp học nào</td></tr>}
              {classes.map(c => {
                const isFull = c.CurrentEnrolled >= c.MaxCapacity;
                const startDate = c.RecurringStartDate || (c.StartTime ? c.StartTime.slice(0, 10) : "—");
                const endDate = c.RecurringEndDate || (c.EndTime ? c.EndTime.slice(0, 10) : "—");
                const timeLabel = c.StartTime ? `${new Date(c.StartTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} – ${new Date(c.EndTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}` : "—";
                const dayMap = { 0: "T2", 1: "T3", 2: "T4", 3: "T5", 4: "T6", 5: "T7", 6: "CN" };
                const daysLabel = c.RecurringDays ? c.RecurringDays.split(",").map(d => dayMap[d] || d).join(", ") : "";

                return (
                  <tr key={c.ClassID}>
                    <td style={{ fontWeight: 700, color: "var(--theme-text-dark)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {c.Name}
                        {c.Intensity === "high" && <span className={styles.pillHigh}>🔴 Cao</span>}
                        {c.Intensity === "medium" && <span className={styles.pillMed}>🟡 TB</span>}
                        {c.Intensity === "low" && <span className={styles.pillLow}>🟢 Thấp</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(c.InstructorName || "?")}&background=4e73df&color=fff&size=32`}
                          alt="" style={{ width: 32, height: 32, borderRadius: "50%" }} />
                        <div>
                          <div style={{ color: "var(--theme-text-dark)", fontWeight: 600, fontSize: "1.6rem" }}>{c.InstructorName || "Chưa phân công"}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.pill} ${styles.pillRoom}`}>{c.StudioRoom || "—"}</span>
                    </td>
                    <td>
                      <div style={{ color: "var(--theme-text-dark)" }}>{startDate} đến {endDate}</div>
                      <div style={{ color: "var(--theme-text)" }}>{timeLabel} {daysLabel && `(${daysLabel})`}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: isFull ? "#e74a3b" : "#1cc88a", fontSize: "1.6rem" }}>
                        {c.CurrentEnrolled}/{c.MaxCapacity}
                      </div>
                    </td>
                    <td>
                      {c.EnrollmentStatus ? (
                         <div style={{ color: c.EnrollmentStatus === 'Pending' ? '#f6c23e' : '#1cc88a', fontWeight: 'bold' }}>
                           {c.EnrollmentStatus === 'Pending' ? 'Đang chờ duyệt' : 'Đã đăng ký'}
                         </div>
                      ) : (
                         isFull ? <div style={{ color: '#e74a3b', fontWeight: 'bold' }}>Đã đầy</div> : <div style={{ color: 'gray' }}>Chưa đăng ký</div>
                      )}
                    </td>
                    <td>
                      {c.EnrollmentStatus ? (
                        <button onClick={() => handleCancel(c.ClassID)} className={styles.btnDanger} style={{ padding: "8px 16px" }}>
                          Hủy ĐK
                        </button>
                      ) : (
                        <button onClick={() => handleEnroll(c.ClassID)} disabled={isFull} className={styles.btnPrimary} style={{ padding: "8px 16px", opacity: isFull ? 0.5 : 1, cursor: isFull ? "not-allowed" : "pointer" }}>
                          Đăng ký
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
