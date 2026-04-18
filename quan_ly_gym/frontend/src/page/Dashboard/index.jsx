import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, DollarSign, Bot, UserCheck, TrendingUp, Award } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import styles from "./Dashboard.module.scss";
import { useDashboardApi } from "../../api/dashboardApi";

const TIER_COLORS = { Gold: "tier-gold", Platinum: "tier-platinum", Silver: "tier-silver" };
const STATUS_LABELS = { active: "Hoạt động", pending: "Chờ PT", expired: "Hết hạn" };
const STATUS_COLORS = { active: "#1cc88a", pending: "#f6c23e", expired: "#858796" };

export default function Dashboard() {
  const nav = useNavigate();
  const { getStats, getRevenue, getRecentMembers } = useDashboardApi();

  const [stats, setStats] = useState({
    totalMembers: 0,
    revenue: "0đ",
    aiUsed: 0,
    aiTotal: 0,
    trainers: 0,
    pendingRequests: 0,
  });
  const [revenueData, setRevenueData] = useState([]);
  const [recentMembers, setRecentMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function fetchAll() {
      try {
        const [s, rev, members] = await Promise.all([
          getStats(),
          getRevenue(),
          getRecentMembers(),
        ]);
        if (!alive) return;
        setStats(s);
        setRevenueData(rev);
        setRecentMembers(members);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        if (alive) setLoading(false);
      }
    }
    fetchAll();
    return () => { alive = false; };
  }, [getStats, getRevenue, getRecentMembers]);

  const TIER_DATA = [];
  const PT_DATA = [];


  return (
    <div className={styles.page}>
      {/* Page Heading */}
      <div className={styles.pageHeading}>
        <h1 className={styles.title}>Dashboard Tổng quan</h1>
        <div className={styles.headActions}>
          <span className={styles.dateText}></span>
          <button className={styles.btnPrimary}>
            <TrendingUp size={16} /> Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className={styles.statGrid}>
        <div className={`${styles.statCard} ${styles.borderBlue}`}>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Tổng hội viên</div>
            <div className={styles.statValue}>{stats.totalMembers.toLocaleString()}</div>
            <div className={styles.statSub}>&nbsp;</div>
          </div>
          <Users size={32} className={styles.statIcon} />
        </div>
        <div className={`${styles.statCard} ${styles.borderGreen}`}>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Doanh thu tháng</div>
            <div className={styles.statValue}>{stats.revenue}</div>
            <div className={styles.statSub}>&nbsp;</div>
          </div>
          <DollarSign size={32} className={styles.statIcon} />
        </div>
        <div className={`${styles.statCard} ${styles.borderInfo}`}>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Lượt AI đã dùng</div>
            <div className={styles.statValue}>{stats.aiUsed.toLocaleString()}</div>
            <div className={styles.progressWrap}>
              <div className={styles.progressBar} style={{ width: `${stats.aiTotal ? Math.round(stats.aiUsed / stats.aiTotal * 100) : 0}%`, background: "#36b9cc" }} />
            </div>
          </div>
          <Bot size={32} className={styles.statIcon} />
        </div>
        <div className={`${styles.statCard} ${styles.borderWarning}`}>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Huấn luyện viên</div>
            <div className={styles.statValue}>{stats.trainers}</div>
            <div className={styles.statSub}>{stats.pendingRequests} yêu cầu chờ duyệt</div>
          </div>
          <UserCheck size={32} className={styles.statIcon} />
        </div>
      </div>

      {/* Charts Row */}
      <div className={styles.chartGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h6 className={styles.cardTitle}>Doanh thu 6 tháng gần nhất</h6>
          </div>
          <div className={styles.cardBody}>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}M`} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v, n) => n === "revenue" ? [`${v}M đ`, "Doanh thu"] : [v, "Hội viên mới"]} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#4e73df" strokeWidth={2} dot={{ r: 4 }} name="Doanh thu (M đ)" yAxisId="left" />
                  <Line type="monotone" dataKey="newMembers" stroke="#1cc88a" strokeWidth={2} dot={{ r: 4 }} name="Hội viên mới" yAxisId="right" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#858796" }}>{loading ? "Đang tải..." : "Chưa có dữ liệu"}</div>
            )}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h6 className={styles.cardTitle}>Phân bố gói thẻ</h6>
          </div>
          <div className={styles.cardBody}>
            {TIER_DATA.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={TIER_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value">
                      {TIER_DATA.map((t, i) => <Cell key={i} fill={t.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className={styles.legend}>
                  {TIER_DATA.map((t) => (
                    <span key={t.name} className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: t.color }} />
                      {t.name} {t.value}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#858796" }}>Chưa có dữ liệu</div>
            )}
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className={styles.tableGrid}>
        {/* Recent Members */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h6 className={styles.cardTitle}>Hội viên mới nhất</h6>
            <button className={styles.btnSmPrimary} onClick={() => nav("/members")}>
              Xem tất cả
            </button>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Hội viên</th>
                  <th>Gói thẻ</th>
                  <th>PT phụ trách</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentMembers.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: "20px", color: "#858796" }}>{loading ? "Đang tải..." : "Chưa có dữ liệu"}</td></tr>
                )}
                {recentMembers.map((m, i) => (
                  <tr key={i}>
                    <td>
                      <div className={styles.memberCell}>
                        <div className={styles.initials}>{m.initials}</div>
                        <div>
                          <div className={styles.memberName}>{m.name}</div>
                          <div className={styles.memberEmail}>{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={styles.tierBadge}>{m.goal || "—"}</span></td>
                    <td><span className={styles.ptName}>—</span></td>
                    <td>
                      <span className={styles.statusBadge} style={{ background: STATUS_COLORS[m.status] + "22", color: STATUS_COLORS[m.status] }}>
                        {STATUS_LABELS[m.status] || m.status}
                      </span>
                    </td>
                    <td>
                      <button className={styles.btnXs} onClick={() => nav(`/members/${i + 1}`)}>
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Usage */}
        <div className={styles.aiCard}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h6 className={styles.cardTitle}>Tiêu thụ Gemini API tháng này</h6>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.aiRow}>
                <span className={styles.aiLabel}>Tổng lượt gọi</span>
                <span className={styles.aiValue}>{stats.aiUsed.toLocaleString()} / {stats.aiTotal.toLocaleString()}</span>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${stats.aiTotal ? Math.round(stats.aiUsed / stats.aiTotal * 100) : 0}%` }} />
              </div>
              <div className={styles.aiStats}>
                <div className={styles.aiStat}>
                  <div className={styles.aiStatVal} style={{ color: "#1cc88a" }}>0</div>
                  <div className={styles.aiStatLabel}>Hợp lệ</div>
                </div>
                <div className={styles.aiStat}>
                  <div className={styles.aiStatVal} style={{ color: "#e74a3b" }}>0</div>
                  <div className={styles.aiStatLabel}>Lạc đề</div>
                </div>
                <div className={styles.aiStat}>
                  <div className={styles.aiStatVal} style={{ color: "#36b9cc" }}>$0</div>
                  <div className={styles.aiStatLabel}>Chi phí</div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity */}
          <div className={styles.card} style={{ marginTop: 16 }}>
            <div className={styles.cardHeader}>
              <h6 className={styles.cardTitle}>Hoạt động gần đây</h6>
            </div>
            <div className={styles.cardBody}>
              <div style={{ textAlign: "center", padding: "20px 0", color: "#858796" }}>Chưa có hoạt động</div>
            </div>
          </div>
        </div>
      </div>

      {/* PT Performance */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h6 className={styles.cardTitle}>
            <Award size={16} style={{ marginRight: 6 }} />
            Hiệu suất Huấn luyện viên
          </h6>
          <button className={styles.btnSmPrimary}>Xem tất cả</button>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Huấn luyện viên</th>
                <th>Chuyên môn</th>
                <th>Học viên</th>
                <th>Ca tháng này</th>
                <th>Rating</th>
                <th>Hiệu suất</th>
              </tr>
            </thead>
            <tbody>
              {PT_DATA.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: "20px", color: "#858796" }}>Chưa có dữ liệu</td></tr>
              )}
              {PT_DATA.map((pt, i) => (
                <tr key={i}>
                  <td>
                    <div className={styles.memberCell}>
                      <div className={styles.initials}>{pt.initials}</div>
                      <div className={styles.memberName}>{pt.name}</div>
                    </div>
                  </td>
                  <td>
                    {pt.spec.map((s) => (
                      <span key={s} className={styles.specBadge}>{s}</span>
                    ))}
                  </td>
                  <td><strong>{pt.members}</strong></td>
                  <td>{pt.sessions} ca</td>
                  <td>⭐ {pt.rating}</td>
                  <td>
                    <div className={styles.progressTrack} style={{ width: 100 }}>
                      <div className={styles.progressFill} style={{ width: `${Math.round(pt.rating / 5 * 100)}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
