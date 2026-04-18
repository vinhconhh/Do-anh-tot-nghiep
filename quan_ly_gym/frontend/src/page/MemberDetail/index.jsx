import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Star } from "lucide-react";
import styles from "./MemberDetail.module.scss";

const DEFAULT = { initials: "--", hoTen: "Hội viên", tuoi: 0, gioiTinh: "--", nhuCauTap: "--", email: "--", sdt: "--", ngaySinh: "--", tier: "Silver", ngayDK: "--", hetHan: "--", pt: "—", aiUsed: 0, aiTotal: 10, sessions: 0, status: "active" };

const TIER_COLORS = { Gold: { bg: "#fff3cd", color: "#856404" }, Platinum: { bg: "#e8e4ff", color: "#5a3fb5" }, Silver: { bg: "#e2e3e5", color: "#383d41" } };
const STATUS_META = { active: { label: "Hoạt động", color: "#1cc88a" }, pending: { label: "Chờ PT", color: "#f6c23e" }, expired: { label: "Hết hạn", color: "#858796" } };

export default function MemberDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const member = DEFAULT;
  const sm = STATUS_META[member.status] || STATUS_META.active;
  const tc = TIER_COLORS[member.tier] || TIER_COLORS.Silver;
  const aiPct = member.aiTotal ? Math.round(member.aiUsed / member.aiTotal * 100) : 100;
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.hoTen)}&background=4e73df&color=fff&size=128`;

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
                  {member.tier}
                </span>
              </div>
            </div>

            <div className={styles.infoList}>
              {[
                { label: "Số điện thoại", val: member.sdt },
                { label: "Tuổi",         val: member.tuoi ? `${member.tuoi}` : "--" },
                { label: "Giới tính",    val: member.gioiTinh || "--" },
                { label: "Nhu cầu tập",  val: member.nhuCauTap || "--" },
                { label: "Ngày sinh",     val: member.ngaySinh },
                { label: "Ngày đăng ký",  val: member.ngayDK },
                { label: "Hết hạn",       val: member.hetHan },
                { label: "PT phụ trách",  val: member.pt },
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
                <div className={styles.miniVal}>{member.aiUsed}{member.aiTotal ? `/${member.aiTotal}` : "/∞"}</div>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} style={{ width: `${aiPct}%`, background: "#4e73df" }} />
                </div>
              </div>
              <div className={`${styles.miniCard} ${styles.green}`}>
                <div className={styles.miniLabel}>Buổi tập hoàn thành</div>
                <div className={styles.miniVal}>{member.sessions}</div>
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
                <div style={{ textAlign: "center", padding: "20px 0", color: "#858796" }}>Chưa có hoạt động</div>
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
