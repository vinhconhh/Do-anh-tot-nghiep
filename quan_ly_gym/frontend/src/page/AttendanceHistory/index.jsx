import { useState, useEffect } from "react";
import api from "../../api/axiosClient";
import { Calendar, Clock } from "lucide-react";
import styles from "./AttendanceHistory.module.scss";

export default function AttendanceHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Try to get role from user info if stored, or just rely on Sidebar title difference.
  const userRole = localStorage.getItem("role") || "";
  const title = userRole === "MEMBER" ? "Ngày đi tập" : "Lịch sử Ngày công";

  const fetchHistory = async () => {
    try {
      const res = await api.get("/checkins/my-history");
      setHistory(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <Calendar size={28} color="#4e73df" />
            {title}
          </h1>
          <p className={styles.subtitle}>Danh sách lịch sử điểm danh của bạn</p>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID Check-in</th>
              <th>Ngày</th>
              <th>Giờ Check-in</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>Đang tải...</td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>Chưa có bản ghi điểm danh nào.</td>
              </tr>
            ) : (
              history.map((record) => {
                const dateObj = new Date(record.CheckInTime);
                return (
                  <tr key={record.CheckInID}>
                    <td>#{record.CheckInID}</td>
                    <td style={{ fontWeight: 600 }}>{dateObj.toLocaleDateString("vi-VN")}</td>
                    <td>
                      <Clock size={16} style={{ display: "inline", marginRight: 6, color: "gray" }} />
                      {dateObj.toLocaleTimeString("vi-VN")}
                    </td>
                    <td>
                      <span className={styles.pillLow}>Thành công</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
