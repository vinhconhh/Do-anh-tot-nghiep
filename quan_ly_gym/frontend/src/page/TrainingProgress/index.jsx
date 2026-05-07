import { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart2,
  Users,
  CalendarCheck,
  Activity,
  Award,
  ChevronDown,
  ChevronUp,
  Loader2,
  Dumbbell,
  Heart,
  Flame,
  TrendingUp,
} from "lucide-react";
import styles from "./TrainingProgress.module.scss";

export default function TrainingProgress() {
  const [progress, setProgress] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // Filters
  const [filterMember, setFilterMember] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { default: api } = await import("../../api/axiosClient");

      const params = new URLSearchParams();
      if (filterMember) params.set("member_id", filterMember);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);

      const [progressRes, summaryRes] = await Promise.all([
        api.get(`/pt-assignments/training-progress?${params}`),
        api.get("/pt-assignments/training-progress/summary"),
      ]);

      setProgress(progressRes.data || []);
      setSummary(summaryRes.data || null);
    } catch (e) {
      console.error("Training progress fetch error:", e);
      setProgress([]);
    } finally {
      setLoading(false);
    }
  }, [filterMember, dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Unique members for filter dropdown
  const uniqueMembers = useMemo(() => {
    const map = new Map();
    progress.forEach((p) => {
      if (!map.has(p.memberId)) {
        map.set(p.memberId, p.memberName);
      }
    });
    return [...map.entries()]; // [[id, name], ...]
  }, [progress]);

  const getRpeStyle = (rpe) => {
    if (!rpe) return { bg: "#85879622", color: "#858796" };
    if (rpe <= 4) return { bg: "#1cc88a22", color: "#1cc88a" };
    if (rpe <= 7) return { bg: "#36b9cc22", color: "#36b9cc" };
    return { bg: "#e74a3b22", color: "#e74a3b" };
  };

  const getRankStyle = (rank) => {
    if (rank === 1) return { background: "linear-gradient(135deg, #f6c23e, #e0a800)", color: "#fff" };
    if (rank === 2) return { background: "linear-gradient(135deg, #94a3b8, #64748b)", color: "#fff" };
    if (rank === 3) return { background: "linear-gradient(135deg, #cd7f32, #a0522d)", color: "#fff" };
    return { background: "var(--theme-bg)", color: "var(--theme-text)" };
  };

  if (loading) {
    return (
      <>
        <div className={styles.tab} />
        <div className={styles.page}>
          <div className={styles.loadingState}>
            <Loader2 className={styles.spinner} size={24} />
            <span>Đang tải tiến độ tập luyện...</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={styles.tab} />
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>
              <BarChart2 size={26} color="#4e73df" /> Tiến Độ Tập Luyện Của Học Viên
            </h2>
            <p className={styles.subtitle}>
              Theo dõi check-in và tiến độ hoàn thành bài tập của tất cả học viên
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard} style={{ borderLeftColor: "#4e73df" }}>
              <div>
                <div className={styles.statLabel}>Tổng check-in</div>
                <div className={styles.statVal}>{summary.totalCheckins}</div>
              </div>
              <CalendarCheck size={28} color="#4e73df" />
            </div>
            <div className={styles.statCard} style={{ borderLeftColor: "#1cc88a" }}>
              <div>
                <div className={styles.statLabel}>Check-in tuần này</div>
                <div className={styles.statVal}>{summary.weekCheckins}</div>
              </div>
              <TrendingUp size={28} color="#1cc88a" />
            </div>
            <div className={styles.statCard} style={{ borderLeftColor: "#f6c23e" }}>
              <div>
                <div className={styles.statLabel}>RPE trung bình</div>
                <div className={styles.statVal}>{summary.avgRPE || "—"}</div>
              </div>
              <Heart size={28} color="#f6c23e" />
            </div>
            <div className={styles.statCard} style={{ borderLeftColor: "#36b9cc" }}>
              <div>
                <div className={styles.statLabel}>Học viên hoạt động</div>
                <div className={styles.statVal}>
                  {summary.activeClients} / {summary.totalClients}
                </div>
              </div>
              <Users size={28} color="#36b9cc" />
            </div>
          </div>
        )}

        {/* Top Students */}
        {summary?.topStudents?.length > 0 && (
          <div className={styles.topStudents}>
            <div className={styles.topTitle}>
              <Award size={18} color="#f6c23e" /> Học viên tích cực nhất
            </div>
            {summary.topStudents.map((s, idx) => (
              <div key={s.memberId} className={styles.topItem}>
                <div className={styles.topRank} style={getRankStyle(idx + 1)}>
                  {idx + 1}
                </div>
                <div className={styles.topName}>{s.memberName}</div>
                <div className={styles.topCount}>
                  <Flame size={14} style={{ marginRight: 4 }} />
                  {s.totalCheckins} check-in
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className={styles.filters}>
          <select
            className={styles.filterSelect}
            value={filterMember}
            onChange={(e) => setFilterMember(e.target.value)}
          >
            <option value="">Tất cả học viên</option>
            {uniqueMembers.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          <input
            type="date"
            className={styles.filterInput}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="Từ ngày"
          />
          <input
            type="date"
            className={styles.filterInput}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="Đến ngày"
          />
        </div>

        {/* Progress Table */}
        {progress.length === 0 ? (
          <div className={styles.emptyState}>
            <Activity size={48} />
            <p>Chưa có dữ liệu check-in</p>
            <small style={{ color: "var(--theme-text)" }}>
              Học viên sẽ check-in sau khi hoàn thành tất cả bài tập được giao.
            </small>
          </div>
        ) : (
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Học viên</th>
                  <th>Ngày check-in</th>
                  <th>Bài tập</th>
                  <th>Tổng Sets</th>
                  <th>RPE</th>
                  <th>Chuỗi ngày</th>
                  <th>Điểm</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {progress.map((entry) => {
                  const isExpanded = expandedId === entry.logId;
                  const rpeStyle = getRpeStyle(entry.rpe);
                  return (
                    <tr key={entry.logId}>
                      <td colSpan={8} style={{ padding: 0 }}>
                        {/* Main row */}
                        <div
                          className={styles.clickRow}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1.5fr 1fr 0.8fr 0.8fr 0.6fr 0.8fr 0.6fr 40px",
                            alignItems: "center",
                            padding: "12px 16px",
                          }}
                          onClick={() => setExpandedId(isExpanded ? null : entry.logId)}
                        >
                          <div style={{ fontWeight: 700 }}>{entry.memberName}</div>
                          <div>
                            {entry.checkInDate
                              ? new Date(entry.checkInDate).toLocaleDateString("vi-VN")
                              : "—"}
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <span
                              style={{
                                background: "#1cc88a22",
                                color: "#1cc88a",
                                padding: "2px 10px",
                                borderRadius: 20,
                                fontWeight: 700,
                                fontSize: "1.1rem",
                                border: "1px solid #1cc88a44",
                              }}
                            >
                              {entry.exercisesCompleted}
                            </span>
                          </div>
                          <div style={{ textAlign: "center", fontWeight: 600 }}>
                            {entry.totalSets}
                          </div>
                          <div style={{ textAlign: "center" }}>
                            {entry.rpe != null ? (
                              <span
                                className={styles.rpeBadge}
                                style={{
                                  background: rpeStyle.bg,
                                  color: rpeStyle.color,
                                  border: `1px solid ${rpeStyle.color}44`,
                                }}
                              >
                                {entry.rpe}
                              </span>
                            ) : (
                              <span style={{ color: "#858796" }}>—</span>
                            )}
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <Flame
                              size={14}
                              color="#f6c23e"
                              style={{ marginRight: 4, verticalAlign: "middle" }}
                            />
                            <span style={{ fontWeight: 700, color: "#f6c23e" }}>
                              {entry.streakDay}
                            </span>
                          </div>
                          <div
                            style={{
                              textAlign: "center",
                              fontWeight: 700,
                              color: "#4e73df",
                            }}
                          >
                            +{entry.points}
                          </div>
                          <div style={{ textAlign: "center" }}>
                            {isExpanded ? (
                              <ChevronUp size={16} color="var(--theme-text)" />
                            ) : (
                              <ChevronDown size={16} color="var(--theme-text)" />
                            )}
                          </div>
                        </div>

                        {/* Expanded exercise details */}
                        {isExpanded && entry.exercises?.length > 0 && (
                          <div className={styles.expandedDetail}>
                            <div
                              style={{
                                fontWeight: 700,
                                color: "var(--theme-text-dark)",
                                marginBottom: 10,
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <Dumbbell size={14} /> Chi tiết bài tập đã hoàn thành
                            </div>
                            <div className={styles.exerciseList}>
                              {entry.exercises.map((ex, i) => (
                                <div key={i} className={styles.exerciseItem}>
                                  <span className={styles.exerciseName}>
                                    {ex.assignmentName || ex.exerciseName}
                                  </span>
                                  <span className={styles.exerciseMeta}>
                                    {ex.sets}×{ex.reps}
                                    {ex.weight ? ` · ${ex.weight}kg` : ""}
                                  </span>
                                  {ex.targetMuscle && (
                                    <span className={styles.muscleTag}>
                                      {ex.targetMuscle}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {isExpanded && (!entry.exercises || entry.exercises.length === 0) && (
                          <div className={styles.expandedDetail}>
                            <div style={{ color: "var(--theme-text)", fontStyle: "italic" }}>
                              Không có chi tiết bài tập.
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
