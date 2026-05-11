import { useState, useContext, useEffect, useCallback } from "react";
import { Flame, Weight, Bot, CalendarCheck, Dumbbell, Heart, Play, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Modal from "../../components/Modal";
import { AuthContext } from "../../context/AuthContext";
import styles from "./DashboardMember.module.scss";
import { useDashboardApi } from "../../api/dashboardApi";

const RPE_MSGS = {
  1: ["", "#1cc88a"], 2: ["", "#1cc88a"], 3: ["", "#1cc88a"],
  4: ["RPE = 4 — Trung bình nhẹ. AI có thể tăng tải buổi sau.", "#1cc88a"],
  5: ["RPE = 5 — Vừa sức.", "#36b9cc"],
  6: ["RPE = 6 — Hơi nặng.", "#36b9cc"],
  7: ["RPE = 7 — Khá nặng. Lịch tập phù hợp.", "#36b9cc"],
  8: ["RPE = 8 — Khá mệt. AI sẽ giảm tải lượng cho buổi tập tiếp theo.", "#e74a3b"],
  9: ["RPE = 9 — Rất mệt! AI sẽ tự động giảm volume và thêm ngày nghỉ.", "#e74a3b"],
  10: ["RPE = 10 — Kiệt sức! AI sẽ điều chỉnh toàn bộ kế hoạch tuần tới.", "#e74a3b"],
};

// Placeholder data – sẽ được thay bằng API sau
const WEEK = [];
const PR_LIST = [];

export default function DashboardMember() {
  const { user } = useContext(AuthContext) ?? {};
  const displayName = user?.hoTen || "Hội viên";
  const { getMemberStats, updateMemberMetrics } = useDashboardApi();

  const [memberStats, setMemberStats] = useState({
    aiQuota: 0,
    aiUsed: 0,
    sessionsCompleted: 0,
    totalSchedules: 0,
    streak: 0,
    weight: 0,
    referralCode: "",
    weightChart: [],
    checkedInToday: false,
  });
  const [exercises, setExercises] = useState([]);
  const [exLoading, setExLoading] = useState(false);
  const [expandedEx, setExpandedEx] = useState(null);
  const [rpe, setRpe] = useState(5);
  const [metricsOpen, setMetricsOpen] = useState(false);
  const [metrics, setMetrics] = useState({ weight: 0, fat: 0, muscle: 0, height: 0 });
  const [workoutLog, setWorkoutLog] = useState([]);
  const [checkedIn, setCheckedIn] = useState(false);

  const fetchStats = () => {
    getMemberStats()
      .then((s) => {
        setMemberStats(s);
        setMetrics((m) => ({
          ...m,
          weight: s.weight || m.weight,
          height: s.height || m.height,
          fat: s.bodyFat || m.fat,
        }));
        if (s.checkedInToday) {
          setCheckedIn(true);
        }
      })
      .catch((err) => console.error("Member stats error:", err));
  };

  const fetchWorkoutLog = () => {
    import("../../api/axiosClient").then(({ default: api }) => {
      api.get("/dashboard/workout-log")
        .then((res) => setWorkoutLog(res.data))
        .catch(() => setWorkoutLog([]));
    });
  };

  const fetchAssignedExercises = useCallback(async () => {
    setExLoading(true);
    try {
      const { default: axiosApi } = await import("../../api/axiosClient");
      const res = await axiosApi.get("/pt-assignments/my-exercises");
      setExercises(res.data || []);
    } catch { setExercises([]); }
    finally { setExLoading(false); }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchWorkoutLog();
    fetchAssignedExercises();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveMetrics = async () => {
    try {
      await updateMemberMetrics(metrics);
      alert("Đã cập nhật chỉ số cơ thể!");
      setMetricsOpen(false);
      fetchStats();
    } catch (err) {
      alert("Lỗi khi cập nhật chỉ số: " + err.message);
    }
  };

  const handleLog = async (assignmentId) => {
    try {
      const { default: axiosApi } = await import("../../api/axiosClient");
      await axiosApi.put(`/pt-assignments/${assignmentId}/complete`);
      setExercises(prev => prev.map(e => e.assignmentId === assignmentId ? { ...e, status: "Completed" } : e));
    } catch (e) {
      alert("Đánh dấu hoàn thành thất bại: " + (e.response?.data?.detail || e.message));
    }
  };

  const allExercisesDone = exercises.length > 0 && exercises.every(e => e.status === "Completed");
  const noExercises = exercises.length === 0 && !exLoading;

  const handleCheckin = async () => {
    // Guard: no exercises assigned
    if (noExercises) {
      alert("⚠️ Chưa có bài tập nào được giao!\n\nHãy liên hệ với HLV để được giao bài tập trước khi check-in.");
      return;
    }
    // Guard: exercises exist but not all completed
    if (!allExercisesDone) {
      const remaining = exercises.filter(e => e.status !== "Completed").length;
      alert(`⚠️ Bạn còn ${remaining} bài tập chưa hoàn thành!\n\nVui lòng hoàn thành tất cả bài tập trước khi check-in.`);
      return;
    }
    try {
      const { default: api } = await import("../../api/axiosClient");
      const res = await api.post("/streaks/checkin", { rpe });
      const data = res.data;
      setCheckedIn(true);
      fetchWorkoutLog();
      const ptMsg = data.reportedToPT ? "\n📤 Đã báo cáo tiến độ cho HLV của bạn!" : "";
      alert(`✅ ${data.message}${ptMsg}\n\n🏋️ Bài tập hoàn thành: ${data.exercisesCompleted}\n🔥 Chuỗi ngày: ${data.currentStreak}\n⭐ Tổng điểm: ${data.totalPoints}`);
    } catch (err) {
      const detail = err.response?.data?.detail || "";
      if (detail === "no_exercises") {
        alert("⚠️ Chưa có bài tập nào được giao!\n\nHãy liên hệ với HLV để được giao bài tập.");
      } else if (detail.startsWith("incomplete_exercises:")) {
        const names = detail.replace("incomplete_exercises:", "").split(",").join(", ");
        alert(`⚠️ Bạn chưa hoàn thành các bài tập:\n${names}\n\nVui lòng hoàn thành tất cả trước khi check-in.`);
      } else if (detail === "Bạn đã check-in hôm nay rồi!") {
        setCheckedIn(true);
      } else {
        alert("❌ Check-in thất bại: " + (detail || err.message));
      }
    }
  };

  const [rpeMsg, rpeColor] = RPE_MSGS[rpe] || ["", "#858796"];

  return (
    <>
      <div className={styles.tab} />
      <div className={styles.page}>
        {/* Welcome */}
        <div className={styles.welcome}>
          <div>
            <h2 className={styles.title}>Xin chào, {displayName}! 💪</h2>
            <p className={styles.subtitle}>Chưa có lịch tập hôm nay.</p>
          </div>
          <div className={styles.welcomeActions}>
            {memberStats.referralCode && (
              <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <span className="text-slate-400 text-sm">Mã hội viên:</span>
                <strong className="text-sky-400 tracking-wider">{memberStats.referralCode}</strong>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(memberStats.referralCode);
                    alert("Đã copy mã hội viên!");
                  }}
                  className="text-slate-500 hover:text-sky-400 transition-colors ml-1"
                  title="Copy mã hội viên"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
              </div>
            )}
            <span className={styles.tierTag}>Hội viên</span>
          </div>
        </div>

        {/* Stat Cards */}
        <div className={styles.statGrid}>
          {[
            { label: "Streak hiện tại", val: `${memberStats.streak} ngày`, border: "#4e73df", icon: <Flame size={28} color="#d1d3e2" /> },
            { label: "Cân nặng hiện tại", val: `${metrics.weight || memberStats.weight || 0} kg`, border: "#1cc88a", icon: <Weight size={28} color="#d1d3e2" /> },
            { label: "Lượt AI còn lại", val: `${memberStats.aiUsed} / ${memberStats.aiQuota}`, bar: memberStats.aiQuota ? Math.round(memberStats.aiUsed / memberStats.aiQuota * 100) : 0, border: "#36b9cc", icon: <Bot size={28} color="#d1d3e2" /> },
            { label: "Buổi tập tháng này", val: `${memberStats.sessionsCompleted} / ${memberStats.totalSchedules}`, border: "#f6c23e", icon: <CalendarCheck size={28} color="#d1d3e2" /> },
          ].map((s) => (
            <div key={s.label} className={styles.statCard} style={{ borderLeftColor: s.border }}>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>{s.label}</div>
                <div className={styles.statVal}>{s.val}</div>
                {s.sub && <div className={styles.statSub} style={{ color: "#1cc88a" }}>{s.sub}</div>}
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

        <div className={styles.mainGrid}>
          {/* Today's workout */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h6 className={styles.cardTitle}>
                <Dumbbell size={16} /> Bài tập hôm nay
              </h6>
            </div>
            <div className={styles.cardBody}>
              {exLoading ? (
                <div style={{ textAlign: "center", padding: "30px 0", color: "#858796" }}>Đang tải bài tập...</div>
              ) : exercises.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 0", color: "#858796" }}>
                  Chưa có bài tập nào — HLV của bạn sẽ phân bài tập sớm thôi!
                </div>
              ) : (
                exercises.map((ex) => {
                  const isDone = ex.status === "Completed";
                  const isExpanded = expandedEx === ex.assignmentId;
                  return (
                    <div key={ex.assignmentId}>
                      <div
                        className={`${styles.exerciseRow} ${isDone ? styles.done : ""}`}
                        style={{ cursor: "pointer" }}
                        onClick={() => setExpandedEx(isExpanded ? null : ex.assignmentId)}
                      >
                        <div className={styles.exLeft}>
                          <div className={styles.exName}>
                            {isDone && <span style={{ marginRight: 6 }}>✅</span>}
                            {ex.exerciseName}
                            {ex.assignmentName && <span style={{ color: "#64748b", marginLeft: 6, fontWeight: 400 }}>({ex.assignmentName})</span>}
                          </div>
                          <div className={styles.exSets}>
                            {ex.sets}×{ex.reps}
                            {ex.duration ? ` · ${ex.duration} phút` : ""}
                            {ex.weight ? ` · ${ex.weight}kg` : ""}
                            {isDone && <span className={styles.doneText}>✓ Hoàn thành</span>}
                          </div>
                        </div>
                        <div className={styles.exRight}>
                          {ex.note && <div style={{ color: "#f6c23e", fontSize: "0.85rem", marginRight: 8 }}>💬 {ex.note}</div>}
                          {isDone
                            ? <span className={styles.checkIcon}>✅</span>
                            : <button className={styles.logBtn} onClick={(e) => { e.stopPropagation(); handleLog(ex.assignmentId); }}>
                              <CheckCircle size={14} style={{ marginRight: 3 }} /> Hoàn thành
                            </button>
                          }
                          {isExpanded ? <ChevronUp size={16} style={{ marginLeft: 6, color: "#94a3b8" }} /> : <ChevronDown size={16} style={{ marginLeft: 6, color: "#94a3b8" }} />}
                        </div>
                      </div>
                      {/* Expanded detail with video */}
                      {isExpanded && (
                        <div style={{ padding: "12px 16px", background: "#0f172a", borderRadius: 10, margin: "4px 0 8px", border: "1px solid #334155" }}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                            <div style={{ flex: 1, minWidth: 200 }}>
                              <div style={{ color: "#94a3b8", fontSize: "1.1rem", marginBottom: 8 }}>
                                <strong style={{ color: "#f1f5f9" }}>Chi tiết bài tập</strong>
                              </div>
                              <div style={{ color: "#e2e8f0", fontSize: "1.1rem" }}>
                                <div>💪 Nhóm cơ: <strong>{ex.targetMuscle || "—"}</strong></div>
                                <div>🏋️ Loại: <strong>{ex.type || "—"}</strong></div>
                                <div>🔄 Hiệp × Lần: <strong>{ex.sets} × {ex.reps}</strong></div>
                                {ex.duration && <div>⏱️ Thời gian: <strong>{ex.duration} phút</strong></div>}
                                {ex.weight && <div>🏋️ Mức tạ: <strong>{ex.weight} kg</strong></div>}
                                {ex.equipmentName && <div>🔧 Thiết bị: <strong>{ex.equipmentName}</strong></div>}
                              </div>
                              {ex.note && (
                                <div style={{ marginTop: 8, padding: "8px 12px", background: "#f6c23e11", border: "1px solid #f6c23e33", borderRadius: 8, color: "#f6c23e" }}>
                                  📝 Ghi chú HLV: {ex.note}
                                </div>
                              )}
                            </div>
                            {ex.videoURL && (
                              <div style={{ flex: 1, minWidth: 280 }}>
                                <div style={{ color: "#94a3b8", fontSize: "1.1rem", marginBottom: 8 }}>
                                  <Play size={14} style={{ marginRight: 4 }} /> <strong style={{ color: "#f1f5f9" }}>Video hướng dẫn</strong>
                                </div>
                                {ex.videoURL.includes("youtube.com") || ex.videoURL.includes("youtu.be") ? (
                                  <iframe
                                    width="100%" height="200"
                                    src={ex.videoURL.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                                    title={ex.exerciseName}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    style={{ borderRadius: 10, border: "1px solid #334155" }}
                                  />
                                ) : (
                                  <a href={ex.videoURL} target="_blank" rel="noreferrer"
                                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 16px", background: "#36b9cc22", color: "#36b9cc", border: "1px solid #36b9cc44", borderRadius: 10, fontWeight: 700 }}>
                                    <Play size={16} /> Xem video hướng dẫn
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* RPE */}
              <div className={styles.rpeBox}>
                <div className={styles.rpeTitle}>
                  <Heart size={14} color="#e74a3b" /> Đánh giá mức độ mệt mỏi hôm nay (RPE)
                </div>
                <div className={styles.rpeBtns}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                    <button
                      key={v}
                      className={`${styles.rpeBtn} ${rpe === v ? (v >= 8 ? styles.rpeHigh : styles.rpeSelected) : ""}`}
                      onClick={() => setRpe(v)}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                {rpeMsg && (
                  <div className={styles.rpeMsg} style={{ color: rpeColor }}>
                    ℹ️ {rpeMsg}
                  </div>
                )}
                {/* Check-in status message */}
                {!checkedIn && noExercises && (
                  <div style={{ padding: "10px 14px", background: "#f6c23e15", border: "1px solid #f6c23e33", borderRadius: 10, color: "#f6c23e", fontSize: "0.92rem", marginBottom: 8 }}>
                    ⚠️ Chưa có bài tập nào được giao — Hãy liên hệ với HLV để được giao bài tập trước khi check-in.
                  </div>
                )}
                {!checkedIn && !noExercises && !allExercisesDone && exercises.length > 0 && (
                  <div style={{ padding: "10px 14px", background: "#e74a3b15", border: "1px solid #e74a3b33", borderRadius: 10, color: "#e74a3b", fontSize: "0.92rem", marginBottom: 8 }}>
                    🔒 Hoàn thành tất cả {exercises.filter(e => e.status !== "Completed").length} bài tập còn lại để mở khóa check-in.
                  </div>
                )}
                {!checkedIn && allExercisesDone && (
                  <div style={{ padding: "10px 14px", background: "#1cc88a15", border: "1px solid #1cc88a33", borderRadius: 10, color: "#1cc88a", fontSize: "0.92rem", marginBottom: 8 }}>
                    ✅ Đã hoàn thành tất cả bài tập! Bạn có thể check-in ngay bây giờ.
                  </div>
                )}
                <button
                  className={`${styles.checkinBtn} ${checkedIn ? styles.checkedIn : ""}`}
                  onClick={handleCheckin}
                  disabled={checkedIn}
                  style={!checkedIn && !allExercisesDone ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                >
                  {checkedIn
                    ? "✅ Đã check-in thành công! Tiến độ đã được báo cáo cho HLV."
                    : allExercisesDone
                      ? "✔ Hoàn thành buổi tập & Check-in"
                      : noExercises
                        ? "🔒 Chưa có bài tập — Liên hệ HLV"
                        : `🔒 Còn ${exercises.filter(e => e.status !== "Completed").length} bài tập chưa xong`
                  }
                </button>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className={styles.sideCol}>
            {/* Weekly schedule */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h6 className={styles.cardTitle}>📅 Lịch tuần này</h6>
              </div>
              <div className={styles.cardBody}>
                {WEEK.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "#858796" }}>Chưa có lịch</div>
                ) : (
                  <div className={styles.weekGrid}>
                    {WEEK.map((w) => (
                      <div key={w.day} className={`${styles.weekDay} ${styles[w.status]}`}>
                        <div className={styles.weekDayLabel}>{w.day}</div>
                        <div className={styles.weekDayText}>{w.label}</div>
                        {w.status === "done" && <span className={styles.weekMark}>✓</span>}
                        {w.status === "today" && <span className={styles.weekToday}>Hôm nay</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Weight chart */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h6 className={styles.cardTitle}>📈 Tiến độ cân nặng</h6>
              </div>
              <div className={styles.cardBody}>
                {memberStats.weightChart && memberStats.weightChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={memberStats.weightChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                      <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => [`${v} kg`, "Cân nặng"]} />
                      <Line type="monotone" dataKey="weight" stroke="#1cc88a" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "#858796" }}>Chưa có dữ liệu</div>
                )}
              </div>
            </div>

            {/* Body Metrics */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h6 className={styles.cardTitle}>⚖️ Chỉ số cơ thể</h6>
                <button className={styles.btnSm} onClick={() => setMetricsOpen(true)}>+ Cập nhật</button>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.metricsGrid}>
                  {[
                    { label: "Cân nặng (kg)", val: metrics.weight, color: "#4e73df" },
                    { label: "Mỡ cơ thể (%)", val: metrics.fat, color: "#f6c23e" },
                    { label: "Cơ bắp (kg)", val: metrics.muscle, color: "#1cc88a" },
                    { label: "Chiều cao (cm)", val: metrics.height, color: "#36b9cc" },
                  ].map((m) => (
                    <div key={m.label} className={styles.metricItem}>
                      <div className={styles.metricVal} style={{ color: m.color }}>{m.val}</div>
                      <div className={styles.metricLabel}>{m.label}</div>
                    </div>
                  ))}
                </div>
                <div className={styles.metricNote}>Chưa có lần cập nhật nào</div>
              </div>
            </div>
          </div>
        </div>

        {/* Nhật ký tập luyện chi tiết */}
        <div className={styles.card} style={{ marginTop: 20 }}>
          <div className={styles.cardHeader}>
            <h6 className={styles.cardTitle}>📋 Nhật ký tập luyện — Chi tiết bài tập đã hoàn thành</h6>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Ngày tập</th>
                  <th>Bài tập</th>
                  <th>Hiệp × Lần</th>
                  <th>Mức tạ (kg)</th>
                  <th>Tổng Volume (kg)</th>
                  <th>RPE</th>
                </tr>
              </thead>
              <tbody>
                {workoutLog.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: "24px", color: "#858796" }}>Chưa có dữ liệu — Hoàn thành buổi tập đầu tiên để ghi nhận nhật ký!</td></tr>
                )}
                {workoutLog.map((entry, idx) => {
                  const rpeVal = entry.rpe;
                  let rpeBg = "#1cc88a22"; let rpeClr = "#1cc88a";
                  if (rpeVal >= 8 && rpeVal <= 9) { rpeBg = "#f6c23e22"; rpeClr = "#f6c23e"; }
                  if (rpeVal === 10) { rpeBg = "#e74a3b22"; rpeClr = "#e74a3b"; }
                  return (
                    <tr key={idx}>
                      <td style={{ whiteSpace: "nowrap" }}>{entry.date}</td>
                      <td><strong>{entry.exercise}</strong></td>
                      <td style={{ textAlign: "center" }}>{entry.sets} × {entry.reps}</td>
                      <td style={{ textAlign: "center" }}>{entry.weight} kg</td>
                      <td style={{ textAlign: "center" }}>
                        <strong style={{ color: "#36b9cc" }}>{entry.volume} kg</strong>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {rpeVal != null ? (
                          <span style={{
                            display: "inline-block",
                            minWidth: 32,
                            padding: "2px 10px",
                            borderRadius: 20,
                            background: rpeBg,
                            color: rpeClr,
                            fontWeight: 700,
                            fontSize: "0.82rem",
                            border: `1px solid ${rpeClr}44`
                          }}>
                            {rpeVal}
                          </span>
                        ) : <span style={{ color: "#858796" }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Update Metrics Modal */}
      <Modal isOpen={metricsOpen} onRequestClose={() => setMetricsOpen(false)} title="Cập nhật chỉ số cơ thể">
        <div className={styles.metricsForm}>
          <div className={styles.metricsFormGrid}>
            {[
              { key: "weight", label: "Cân nặng (kg)", step: "0.1" },
              { key: "fat", label: "% Mỡ cơ thể", step: "0.1" },
              { key: "muscle", label: "Cơ bắp (kg)", step: "0.1" },
              { key: "height", label: "Chiều cao (cm)", step: "1" },
            ].map((f) => (
              <div key={f.key} className={styles.metricsField}>
                <label>{f.label}</label>
                <input
                  type="number"
                  step={f.step}
                  value={metrics[f.key] ?? 0}
                  onChange={(e) => setMetrics((m) => ({ ...m, [f.key]: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            ))}
          </div>
          <div className={styles.metricsActions}>
            <button className={styles.btnGhost} onClick={() => setMetricsOpen(false)}>Hủy</button>
            <button className={styles.btnPrimary} onClick={handleSaveMetrics}>💾 Lưu</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
