import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import styles from "./MemberDetail.module.scss";
import { useMembersApi } from "../../api/membersApi";
import { useDashboardApi } from "../../api/dashboardApi";

const TIER_COLORS = { Gold: { bg: "#fff3cd", color: "#856404" }, Platinum: { bg: "#e8e4ff", color: "#5a3fb5" }, Silver: { bg: "#e2e3e5", color: "#383d41" } };
const STATUS_META = { active: { label: "Hoạt động", color: "#1cc88a" }, pending: { label: "Chờ PT", color: "#f6c23e" }, expired: { label: "Hết hạn", color: "#858796" } };

export default function MemberDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const membersApi = useMembersApi();
  const dashboardApi = useDashboardApi();

  const [member, setMember] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [memberData, reportData] = await Promise.all([
          membersApi.getById(id),
          dashboardApi.getMemberReportDetail(id)
        ]);
        setMember(memberData);
        setReport(reportData);
      } catch (err) {
        console.error("Fetch member detail error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, membersApi, dashboardApi]);

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <Loader2 className={styles.spinner} size={40} />
        <p>Đang tải thông tin hội viên...</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className={styles.errorWrap}>
        <h2>Không tìm thấy hội viên</h2>
        <button onClick={() => nav("/members")}>Quay lại danh sách</button>
      </div>
    );
  }

  const sm = STATUS_META[member.isActive ? "active" : "expired"] || STATUS_META.active;
  const tc = TIER_COLORS[member.tier || "Silver"];
  const aiTotal = member.aiQuota || 10;
  const aiUsed = member.aiUsed || 0;
  const aiPct = aiTotal ? Math.round((aiUsed / aiTotal) * 100) : 100;
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.hoTen)}&background=4e73df&color=fff&size=128`;

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
            <h2 className={styles.title}>Thông tin hội viên</h2>
            <p className={styles.subtitle}>Chi tiết tài khoản và quá trình tập luyện.</p>
          </div>
          <button className={styles.btnBack} onClick={() => nav("/members")}>
            <ArrowLeft size={16} /> Quay lại danh sách
          </button>
        </div>

        <div className={styles.mainGrid}>
          {/* Profile Card */}
          <div className={styles.profileCard}>
            <div className={styles.avatarWrap}>
              <img src={avatarUrl} alt={member.hoTen} className={styles.avatar} />
              <div>
                <div className={styles.memberName}>{member.hoTen}</div>
                <div className={styles.memberEmail}>{member.email}</div>
                <span className={styles.tierBadge} style={{ background: tc.bg, color: tc.color }}>
                  {member.tier || "Silver"}
                </span>
              </div>
            </div>

            <div className={styles.infoList}>
              {[
                { label: "Số điện thoại", val: member.sdt || "--" },
                { label: "Tuổi",         val: member.tuoi ? `${member.tuoi}` : "--" },
                { label: "Giới tính",    val: member.gioiTinh || "--" },
                { label: "Nhu cầu tập",  val: member.goal || "--" },
                { label: "Gói tập",      val: member.gymPackageName || "Chưa đăng ký" },
                { label: "Gói AI",       val: member.aiPackageName || "Chưa đăng ký" },
                { label: "Ngày sinh",     val: formatDate(member.ngaySinh) },
                { label: "Ngày đăng ký",  val: formatDate(member.createdAt) },
                { label: "Hết hạn",       val: formatDate(member.hetHan) },
                { label: "PT phụ trách",  val: member.pt || "--" },
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
                <div className={styles.miniLabel}>Lượt AI đã dùng</div>
                <div className={styles.miniVal}>{aiUsed}/{aiTotal}</div>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} style={{ width: `${aiPct}%`, background: "#4e73df" }} />
                </div>
              </div>
              <div className={`${styles.miniCard} ${styles.green}`}>
                <div className={styles.miniLabel}>Buổi tập hoàn thành</div>
                <div className={styles.miniVal}>{report?.sessionChart?.reduce((acc, curr) => acc + curr.done, 0) || 0}</div>
              </div>
              <div className={`${styles.miniCard} ${styles.warning}`}>
                <div className={styles.miniLabel}>Trạng thái gói</div>
                <div className={styles.miniVal} style={{ color: sm.color }}>{sm.label}</div>
              </div>
            </div>

            {/* Activity */}
            <div className={styles.activityCard}>
              <div className={styles.activityHeader}>
                <h6 className={styles.activityTitle}>Lịch sử hoạt động</h6>
              </div>
              <div className={styles.activityList}>
                {report?.activities && report.activities.length > 0 ? (
                  report.activities.map((act, idx) => (
                    <div key={idx} className={styles.activityItem}>
                      <div className={styles.activityDot} />
                      <div className={styles.activityBody}>
                        <div className={styles.activityDate}>{act.date}</div>
                        <div className={styles.activityAction}>{act.action}</div>
                        <div className={styles.activityResult}>{act.result}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "#858796" }}>Chưa có hoạt động</div>
                )}
              </div>
            </div>

            <div className={styles.footerActions}>
              <button className={styles.btnPrimary} onClick={() => nav("/member-report")}>
                <FileText size={16} /> Xem báo cáo chi tiết
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
