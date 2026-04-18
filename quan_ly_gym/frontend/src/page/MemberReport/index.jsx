import { useState, useMemo } from "react";
import { Bot, CheckCircle, TrendingUp, Target, Download, Search } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import styles from "./MemberReport.module.scss";

const MEMBERS = [];

const WEIGHT_CHART = [];

const SESSION_CHART = [];

export default function MemberReport() {
  const [selectedId, setSelectedId] = useState("");
  const [q, setQ] = useState("");

  const member = MEMBERS.find((m) => m.id === selectedId) || null;
  const activities = [];

  const filteredActivities = useMemo(() =>
    activities.filter((a) => !q || a.action.toLowerCase().includes(q.toLowerCase()) || a.result.toLowerCase().includes(q.toLowerCase())),
    [activities, q]
  );

  const aiPct = member?.aiTotal ? Math.round(member.aiUsed / member.aiTotal * 100) : 0;

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
            {MEMBERS.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        {!member ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#858796" }}>Chưa có dữ liệu hội viên</div>
        ) : (
          <>
            {/* Stat cards */}
            <div className={styles.statGrid}>
              {[
                { label: "Lượt AI đã dùng",     val: `${member.aiUsed}${member.aiTotal ? "/" + member.aiTotal : "/∞"}`, bar: aiPct, border: "#4e73df",  icon: <Bot size={28} color="#d1d3e2" /> },
                { label: "Buổi tập hoàn thành", val: member.sessions,                                                    border: "#1cc88a", icon: <CheckCircle size={28} color="#d1d3e2" /> },
                { label: "Tỉ lệ hoàn thành",    val: `${member.completion}%`,                                            bar: member.completion, border: "#f6c23e", icon: <TrendingUp size={28} color="#d1d3e2" /> },
                { label: "Tiến độ mục tiêu",    val: `${member.goal}%`,                                                  bar: member.goal, border: "#e74a3b", icon: <Target size={28} color="#d1d3e2" /> },
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

            {/* Charts */}
            <div className={styles.chartGrid}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h6 className={styles.cardTitle}>📉 Tiến độ cân nặng (8 tuần)</h6>
                </div>
                <div className={styles.cardBody}>
                  {WEIGHT_CHART.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={WEIGHT_CHART}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                        <YAxis domain={[56, 62]} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v) => [`${v} kg`, "Cân nặng"]} />
                        <Line type="monotone" dataKey="weight" stroke="#1cc88a" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "#858796" }}>Chưa có dữ liệu</div>
                  )}
                </div>
              </div>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h6 className={styles.cardTitle}>📊 Buổi tập hoàn thành theo tuần</h6>
                </div>
                <div className={styles.cardBody}>
                  {SESSION_CHART.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={SESSION_CHART}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v) => [v, "Buổi tập"]} />
                        <Bar dataKey="done" fill="#4e73df" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "#858796" }}>Chưa có dữ liệu</div>
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
                  <button className={styles.exportBtn}>
                    <Download size={14} /> Xuất PDF
                  </button>
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
                      <tr><td colSpan={5} style={{ textAlign: "center", padding: "20px", color: "#858796" }}>Không có dữ liệu</td></tr>
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
