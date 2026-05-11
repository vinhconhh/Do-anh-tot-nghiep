import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Loader2 } from "lucide-react";
import styles from "./TrainerDetail.module.scss";
import { useTrainersApi } from "../../api/trainersApi";
import { useDashboardApi } from "../../api/dashboardApi";

const STATUS_META = { active: { label: "Hoạt động", color: "#1cc88a" }, suspended: { label: "Tạm khóa", color: "#f6c23e" }, inactive: { label: "Đã nghỉ", color: "#858796" } };

export default function TrainerDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const trainersApi = useTrainersApi();
  const dashboardApi = useDashboardApi();

  const [trainer, setTrainer] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [trainerData, reportData] = await Promise.all([
          trainersApi.getById(id),
          dashboardApi.getTrainerReportDetail(id)
        ]);
        setTrainer(trainerData);
        setReport(reportData);
      } catch (err) {
        console.error("Fetch trainer detail error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, trainersApi, dashboardApi]);

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <Loader2 className={styles.spinner} size={40} />
        <p>Đang tải thông tin huấn luyện viên...</p>
      </div>
    );
  }

  if (!trainer) {
    return (
      <div className={styles.errorWrap}>
        <h2>Không tìm thấy huấn luyện viên</h2>
        <button onClick={() => nav("/trainers")}>Quay lại danh sách</button>
      </div>
    );
  }

  const sm = STATUS_META[trainer.isActive ? "active" : (trainer.status || "active")] || STATUS_META.active;
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(trainer.hoTen)}&background=4e73df&color=fff&size=128`;

  const formatDate = (dateStr) => {
    if (!dateStr) return "--";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("vi-VN");
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <div className={styles.tab} />
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Thông tin huấn luyện viên</h2>
            <p className={styles.subtitle}>Thiết lập tài khoản, chuyên môn và hiệu suất ca dạy.</p>
          </div>
          <button className={styles.btnBack} onClick={() => nav("/trainers")}>
            <ArrowLeft size={16} /> Quay lại danh sách
          </button>
        </div>

        <div className={styles.mainGrid}>
          {/* Profile Card */}
          <div className={styles.profileCard}>
            <div className={styles.avatarWrap}>
              <img src={avatarUrl} alt={trainer.hoTen} className={styles.avatar} />
              <div>
                <div className={styles.memberName}>{trainer.hoTen}</div>
                <div className={styles.memberEmail}>{trainer.email}</div>
                <span className={styles.tierBadge} style={{ background: "#e2e3e5", color: "#383d41" }}>
                  {trainer.certifications || "Junior PT"}
                </span>
              </div>
            </div>

            <div className={styles.infoList}>
              {[
                { label: "Số điện thoại", val: trainer.sdt || "--" },
                { label: "Tuổi",         val: trainer.tuoi ? `${trainer.tuoi}` : "--" },
                { label: "Giới tính",    val: trainer.gioiTinh || "--" },
                { label: "Kinh nghiệm",  val: trainer.experienceYears ? `${trainer.experienceYears} năm` : "--" },
                { label: "Chuyên môn",   val: trainer.specialty || "--" },
                { label: "Ngày sinh",     val: formatDate(trainer.ngaySinh) },
                { label: "Ngày tham gia", val: formatDate(trainer.createdAt) },
              ].map((info) => (
                <div key={info.label} className={styles.infoRow}>
                  <span className={styles.infoLabel}>{info.label}</span>
                  <span className={styles.infoVal}>{info.val}</span>
                </div>
              ))}
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Trạng thái</span>
                <span className={styles.statusBadge} style={{ background: sm.color + "22", color: sm.color }}>
                  {sm.label}
                </span>
              </div>
            </div>
          </div>

          {/* Stats & Activity */}
          <div className={styles.rightCol}>
            {/* Mini stats */}
            <div className={styles.miniStats}>
              <div className={`${styles.miniCard} ${styles.blue}`}>
                <div className={styles.miniLabel}>Tỷ lệ phản hồi</div>
                <div className={styles.miniVal}>{trainer.responseRate || 100}%</div>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} style={{ width: `${trainer.responseRate || 100}%`, background: "#4e73df" }} />
                </div>
              </div>
              <div className={`${styles.miniCard} ${styles.green}`}>
                <div className={styles.miniLabel}>Buổi dạy hoàn thành</div>
                <div className={styles.miniVal}>{report?.sessionChart?.reduce((acc, curr) => acc + curr.done, 0) || 0}</div>
              </div>
              <div className={`${styles.miniCard} ${styles.warning}`}>
                <div className={styles.miniLabel}>Điểm hiệu suất</div>
                <div className={styles.miniVal} style={{ color: "#f6c23e" }}>{trainer.totalScore || 100}</div>
              </div>
            </div>

            {/* Activity */}
            <div className={styles.activityCard}>
              <div className={styles.activityHeader}>
                <h6 className={styles.activityTitle}>Lịch sử hoạt động gần đây</h6>
              </div>
              <div className={styles.activityList}>
                {report?.activities && report.activities.length > 0 ? (
                  report.activities.map((act, idx) => (
                    <div key={idx} className={styles.activityItem}>
                      <div className={styles.activityDot} />
                      <div className={styles.activityBody}>
                        <div className={styles.activityDate}>{act.date}</div>
                        <div className={styles.activityAction}>{act.action}</div>
                        <div className={styles.activityResult}>Kết quả: {act.result}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "#858796" }}>Chưa có hoạt động</div>
                )}
              </div>
            </div>

            <div className={styles.footerActions}>
              <button className={styles.btnPrimary} onClick={() => nav(`/trainers?edit=${trainer.UserID}`)}>
                <Pencil size={16} /> Chỉnh sửa thông tin
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
