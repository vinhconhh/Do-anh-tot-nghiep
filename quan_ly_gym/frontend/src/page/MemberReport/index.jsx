import { useState, useMemo, useCallback, useEffect, useContext } from "react";
import { Bot, CheckCircle, TrendingUp, Target, Download, Search, Loader2, Flame } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import styles from "./MemberReport.module.scss";
import { AuthContext } from "../../context/AuthContext";
import { authedRequestJson } from "../../api/client";

export default function MemberReport() {
  const { token, logout } = useContext(AuthContext) ?? {};
  const [members, setMembers] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  const aj = useCallback(
    async (path) => {
      try {
        return await authedRequestJson(path, token);
      } catch (e) {
        if (e?.status === 401) logout?.();
        throw e;
      }
    },
    [token, logout]
  );

  // Fetch member list
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await aj("/api/dashboard/member-report/list");
        setMembers(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [aj]);

  // Fetch detail when member selected
  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    (async () => {
      setDetailLoading(true);
      try {
        const data = await aj(`/api/dashboard/member-report/${selectedId}`);
        setDetail(data);
      } catch (e) { console.error(e); }
      finally { setDetailLoading(false); }
    })();
  }, [selectedId, aj]);

  const member = members.find((m) => m.id === selectedId) || null;
  const activities = detail?.activities || [];
  const weightChart = detail?.weightChart || [];
  const sessionChart = detail?.sessionChart || [];

  const filteredActivities = useMemo(() =>
    activities.filter((a) => !q || a.action.toLowerCase().includes(q.toLowerCase()) || a.result.toLowerCase().includes(q.toLowerCase())),
    [activities, q]
  );

  const aiPct = member?.aiTotal ? Math.round(member.aiUsed / member.aiTotal * 100) : 0;

  if (loading) {
    return (
      <>
        <div className={styles.tab} />
        <div className={styles.page}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: 60, color: "#858796" }}>
            <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} /> Đang tải danh sách hội viên...
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={styles.tab} />
      <div className={styles.page}>
        {/* Heading */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            <TrendingUp size={20} /> Báo cáo theo hội viên
          </h2>
          <select
            className={styles.memberSelect}
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">— Chọn hội viên —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
            ))}
          </select>
        </div>

        {!member ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#858796" }}>
            {members.length === 0 ? "Chưa có hội viên nào trong hệ thống" : "Chọn một hội viên để xem báo cáo chi tiết"}
          </div>
        ) : detailLoading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: 60, color: "#858796" }}>
            <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} /> Đang tải báo cáo...
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className={styles.statGrid}>
              {[
                { label: "Lượt AI đã dùng", val: `${member.aiUsed}${member.aiTotal ? "/" + member.aiTotal : "/∞"}`, bar: aiPct, border: "#4e73df", icon: <Bot size={28} color="#d1d3e2" /> },
                { label: "Buổi tập hoàn thành", val: member.sessions, border: "#1cc88a", icon: <CheckCircle size={28} color="#d1d3e2" /> },
                { label: "Tỉ lệ hoàn thành", val: `${member.completion}%`, bar: member.completion, border: "#f6c23e", icon: <TrendingUp size={28} color="#d1d3e2" /> },
                { label: "Chuỗi check-in", val: `${member.streak} ngày`, bar: Math.min(member.streak * 3, 100), border: "#e74a3b", icon: <Flame size={28} color="#d1d3e2" /> },
              ].map((s) => (
                <div key={s.label} className={styles.statCard} style={{ borderLeftColor: s.border }}>
                  <div className={styles.statInfo}>
                    <div className={styles.statLabel}>{s.label}</div>
                    <div className={styles.statVal}>{s.val}</div>
                    {s.bar !== undefined && (
                      <div className={styles.progressTrack}>
                        <div className={styles.progressFill} style={{ width: `${s.bar}%`, background: s.border }} />
                      </div>
                    )}
                  </div>
                  {s.icon}
                </div>
              ))}
            </div>

            {/* Member Info Summary */}
            <div className={styles.memberSummary}>
              <div><strong>Mục tiêu:</strong> {member.goal || "Chưa cập nhật"}</div>
              <div><strong>Cân nặng:</strong> {member.weight ? `${member.weight} kg` : "—"}</div>
              <div><strong>Chiều cao:</strong> {member.height ? `${member.height} cm` : "—"}</div>
              <div><strong>BMI:</strong> {member.bmi ? member.bmi.toFixed(1) : "—"}</div>
              <div><strong>Điểm tích lũy:</strong> {member.totalPoints || 0}</div>
            </div>

            {/* Charts */}
            <div className={styles.chartGrid}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h6 className={styles.cardTitle}>📉 Tiến độ cân nặng</h6>
                </div>
                <div className={styles.cardBody}>
                  {weightChart.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={weightChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v) => [`${v} kg`, "Cân nặng"]} />
                        <Line type="monotone" dataKey="weight" stroke="#1cc88a" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "#858796" }}>Chưa có dữ liệu cân nặng (BodyMetrics)</div>
                  )}
                </div>
              </div>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h6 className={styles.cardTitle}>📊 Buổi tập hoàn thành theo tuần</h6>
                </div>
                <div className={styles.cardBody}>
                  {sessionChart.some(s => s.done > 0) ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={sessionChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v) => [v, "Buổi tập"]} />
                        <Bar dataKey="done" fill="#4e73df" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "#858796" }}>Chưa có dữ liệu buổi tập (LogWorkouts)</div>
                  )}
                </div>
              </div>
            </div>

            {/* Activity Table */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h6 className={styles.cardTitle}>Báo cáo hoạt động gần nhất</h6>
                <div className={styles.cardActions}>
                  <div className={styles.searchBox}>
                    <Search size={14} className={styles.searchIcon} />
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm hoạt động…" />
                    {q && <button className={styles.clearBtn} onClick={() => setQ("")}>×</button>}
                  </div>
                </div>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Ngày</th>
                      <th>Hoạt động</th>
                      <th>PT</th>
                      <th>Lượt AI</th>
                      <th>Kết quả</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActivities.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: "center", padding: "20px", color: "#858796" }}>Không có dữ liệu hoạt động</td></tr>
                    )}
                    {filteredActivities.map((a, i) => (
                      <tr key={i}>
                        <td>{a.date}</td>
                        <td>{a.action}</td>
                        <td>{a.pt}</td>
                        <td>{a.ai > 0 ? <span className={styles.aiTag}>-{a.ai} lượt</span> : "—"}</td>
                        <td>{a.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
