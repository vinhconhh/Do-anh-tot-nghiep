import { useState, useContext, useEffect, useCallback } from "react";
import { Flame, Weight, Bot, CalendarCheck, Dumbbell, Heart, Play, ChevronDown, ChevronUp, CheckCircle, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Modal from "../../components/Modal";
import { AuthContext } from "../../context/AuthContext";
import styles from "./DashboardMember.module.scss";
import { useDashboardApi } from "../../api/dashboardApi";

const WEEK = [];
const PR_LIST = [];



const formatVNDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const formatVNDateTime = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

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
  const [allExercises, setAllExercises] = useState([]);
  const [needInput, setNeedInput] = useState("");
  const [exLoading, setExLoading] = useState(false);
  const [expandedEx, setExpandedEx] = useState(null);
  const [meals, setMeals] = useState([]);
  const [allMeals, setAllMeals] = useState([]);
  const [mealsLoading, setMealsLoading] = useState(false);
  const [expandedMeal, setExpandedMeal] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState("Tất cả");
  const [metricsOpen, setMetricsOpen] = useState(false);
  const [metrics, setMetrics] = useState({ weight: 0, fat: 0, muscle: 0, height: 0 });
  const [workoutLog, setWorkoutLog] = useState([]);
  const [checkedIn, setCheckedIn] = useState(false);
  const [attendanceFrequency, setAttendanceFrequency] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const navigate = useNavigate();
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiRequest, setAiRequest] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const fetchStats = () => {
    getMemberStats()
      .then((s) => {
        setMemberStats(s);
        setMetrics((m) => ({
          ...m,
          weight: s.weight || m.weight,
          height: s.height || m.height,
          fat: s.bodyFat || m.fat,
          muscle: s.muscle || m.muscle,
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

  const fetchAttendanceFrequency = () => {
    setAttendanceLoading(true);
    import("../../api/axiosClient").then(({ default: api }) => {
      api.get("/dashboard/attendance-frequency")
        .then((res) => setAttendanceFrequency(res.data))
        .catch(() => setAttendanceFrequency([]))
        .finally(() => setAttendanceLoading(false));
    });
  };

  const fetchMealPlans = () => {
    setMealsLoading(true);
    import("../../api/axiosClient").then(({ default: api }) => {
      api.get("/meal-plans")
        .then((res) => { setAllMeals(res.data); setMeals(res.data); })
        .catch(() => { setAllMeals([]); setMeals([]); })
        .finally(() => setMealsLoading(false));
    });
  };

  const fetchAllExercises = useCallback(async () => {
    setExLoading(true);
    try {
      const { default: axiosApi } = await import("../../api/axiosClient");
      const res = await axiosApi.get("/gym-exercises?size=100");
      const items = res.data.items || [];
      const mapped = items.map(ex => ({
        id: ex.ExerciseID,
        name: ex.Name,
        muscleGroup: ex.TargetMuscle,
        equipment: ex.EquipmentName,
        assignmentName: ex.AssignmentName,
        type: ex.Type,
        videoUrl: ex.VideoURL || ""
      }));
      setAllExercises(mapped);
      setExercises(mapped);
    } catch { setAllExercises([]); setExercises([]); }
    finally { setExLoading(false); }
  }, []);

  const handleSearchNeed = () => {
    if (!needInput.trim()) {
      setExercises(allExercises);
      setMeals(allMeals);
      return;
    }
    const n = needInput.toLowerCase();
    let targetGroup = "";
    if (n.includes("ngực") || n.includes("chest") || n.includes("vòng 1")) targetGroup = "Ngực";
    else if (n.includes("chân") || n.includes("đùi") || n.includes("mông") || n.includes("vòng 3") || n.includes("mông đùi")) targetGroup = "Chân";
    else if (n.includes("lưng") || n.includes("back") || n.includes("xô")) targetGroup = "Lưng";
    else if (n.includes("bụng") || n.includes("eo") || n.includes("mỡ bụng") || n.includes("vòng 2")) targetGroup = "Bụng";
    else if (n.includes("tay") || n.includes("bắp")) targetGroup = "Tay";
    else if (n.includes("vai") || n.includes("shoulder")) targetGroup = "Vai";
    else if (n.includes("cardio") || n.includes("giảm cân") || n.includes("giảm mỡ") || n.includes("toàn thân")) targetGroup = "Cardio";

    if (targetGroup) {
      setExercises(allExercises.filter(ex => (ex.muscleGroup || "").toLowerCase().includes(targetGroup.toLowerCase()) || (ex.name || "").toLowerCase().includes(n) || (ex.assignmentName || "").toLowerCase().includes(n)));
    } else {
      setExercises(allExercises.filter(ex => (ex.name || "").toLowerCase().includes(n) || (ex.muscleGroup || "").toLowerCase().includes(n) || (ex.assignmentName || "").toLowerCase().includes(n)));
    }

    const filteredMeals = allMeals.filter(meal =>
      (meal.goal || "").toLowerCase().includes(n) ||
      (meal.name || "").toLowerCase().includes(n) ||
      (meal.category || "").toLowerCase().includes(n) ||
      (meal.description || "").toLowerCase().includes(n)
    );
    setMeals(filteredMeals);
  };

  useEffect(() => {
    fetchStats();
    fetchWorkoutLog();
    fetchAllExercises();
    fetchAttendanceFrequency();
    fetchMealPlans();
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



  const handleAiConsultClick = () => {
    setShowAiModal(true);
  };

  const handleAiSubmit = async () => {
    if (!aiRequest.trim() || aiLoading) return;

    let age = "Không rõ";
    if (memberStats.birthday) {
      const birthYear = new Date(memberStats.birthday).getFullYear();
      const currentYear = new Date().getFullYear();
      age = currentYear - birthYear;
    }

    let bmi = "Không rõ";
    const h = metrics.height || memberStats.height;
    const w = metrics.weight || memberStats.weight;
    if (h && w) {
      const heightM = parseFloat(h) / 100;
      const weightKg = parseFloat(w);
      if (heightM > 0) {
        bmi = (weightKg / (heightM * heightM)).toFixed(1);
      }
    }

    const prompt = `Bạn là một chuyên gia phân tích thể hình (Body Composition Analyst), huấn luyện viên thể hình (Fitness Coach) và chuyên gia dinh dưỡng thể thao hàng đầu với hơn 10 năm kinh nghiệm.

NHIỆM VỤ:
Dựa trên dữ liệu cơ thể của tôi, hãy phân tích chi tiết tình trạng cơ thể và đưa ra nhận xét chuyên sâu, cá nhân hóa. Đồng thời, giải đáp yêu cầu cụ thể: "${aiRequest.trim()}"

QUY TẮC QUAN TRỌNG:
1. TRẢ LỜI BẰNG TIẾNG VIỆT CÓ DẤU HOÀN CHỈNH.
2. Sử dụng Markdown (Bảng, In đậm, Danh sách) để trình bày chuyên nghiệp.
3. Nếu thiếu dữ liệu nào, hãy nhận xét dựa trên những gì hiện có (VD: BMI) và đưa ra giả định hợp lý.

DỮ LIỆU NGƯỜI DÙNG HIỆN TẠI:
- Giới tính: ${memberStats.gender === "Nam" || memberStats.gender === "Nữ" ? memberStats.gender : "Không rõ"}
- Tuổi: ${age}
- Chiều cao: ${h || "Không rõ"} cm
- Cân nặng: ${w || "Không rõ"} kg
- Khối lượng cơ bắp: ${metrics.muscle ? metrics.muscle + " kg" : "Không rõ"}
- Tỷ lệ mỡ cơ thể (Body Fat %): ${metrics.fat ? metrics.fat + "%" : "Không rõ"}
- BMI: ${bmi}

YÊU CẦU NỘI DUNG:
1. Đánh giá tổng quan cơ thể (BMI, Vóc dáng).
2. Phân tích mỡ và cơ bắp (Đánh giá mức độ, nguy cơ).
3. Mục tiêu đề xuất (Tăng cơ/Giảm mỡ/Recomp).
4. Khuyến nghị chi tiết (Lập BẢNG gồm: Calo hàng ngày, Protein/Carbs/Fat, Tần suất tập, Loại hình tập, Chế độ ăn, Phục hồi).
5. Kết luận ngắn gọn (3-5 câu).`;

    setAiLoading(true);
    try {
      const { default: api } = await import("../../api/axiosClient");
      await api.post("/ai/chat", { prompt, hidden: true });
      setShowAiModal(false);
      setAiRequest("");
      navigate('/ai-chat');
    } catch (e) {
      alert("Lỗi khi tư vấn AI: " + (e.response?.data?.detail || e.message));
    } finally {
      setAiLoading(false);
    }
  };



  let displayBmi = "—";
  let bmiColor = "#858796";
  let bmiStatus = "";
  let bmiDescription = "";
  const currHeight = metrics.height || memberStats.height;
  const currWeight = metrics.weight || memberStats.weight;
  if (currHeight && currWeight) {
    const heightM = parseFloat(currHeight) / 100;
    const weightKg = parseFloat(currWeight);
    if (heightM > 0) {
      const bmiVal = weightKg / (heightM * heightM);
      displayBmi = bmiVal.toFixed(1);
      if (bmiVal < 18.5) {
        bmiColor = "#f6c23e";
        bmiStatus = "⚠️ Thiếu cân";
        bmiDescription = "Bạn đang ở mức thiếu cân. Hãy tăng cường dinh dưỡng và xây dựng cơ bắp.";
      } else if (bmiVal < 25) {
        bmiColor = "#1cc88a";
        bmiStatus = "✅ Bình thường";
        bmiDescription = "Chỉ số BMI của bạn nằm trong khoảng lý tưởng. Hãy duy trì lối sống lành mạnh!";
      } else if (bmiVal < 30) {
        bmiColor = "#f97316";
        bmiStatus = "⚡ Thừa cân";
        bmiDescription = "Bạn đang ở mức thừa cân. Hãy điều chỉnh chế độ ăn và tăng cường cardio.";
      } else if (bmiVal < 35) {
        bmiColor = "#e74a3b";
        bmiStatus = "🔴 Béo phì độ I";
        bmiDescription = "Bạn đang ở mức béo phì độ I. Nên có kế hoạch giảm cân với sự hỗ trợ của huấn luyện viên.";
      } else {
        bmiColor = "#850000";
        bmiStatus = "🚨 Béo phì độ II+";
        bmiDescription = "Chỉ số BMI ở mức nguy hiểm. Hãy tham khảo ý kiến bác sĩ và chuyên gia dinh dưỡng ngay.";
      }
    }
  }

  return (
    <>
      <div className={styles.tab} />
      <div className={styles.page}>
        {}
        <div className={styles.welcome}>
          <div>
            <h2 className={styles.title}>Xin chào, {displayName}! 💪</h2>
            <p className={styles.subtitle}>Khám phá các bài tập tham khảo phù hợp với bạn.</p>
          </div>
          <div className={styles.welcomeActions}>
            {memberStats.referralCode && (
              <div style={{ background: "rgba(255,255,255,0.22)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.35)", padding: "6px 14px", borderRadius: 999, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.78rem" }}>Mã HV:</span>
                <strong style={{ color: "#fff", letterSpacing: "0.12em", fontSize: "0.88rem" }}>{memberStats.referralCode}</strong>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(memberStats.referralCode);
                    alert("Đã copy mã hội viên!");
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.75)", display: "flex", padding: 2 }}
                  title="Copy mã hội viên"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
              </div>
            )}
            <span className={styles.tierTag}>Hội viên</span>
          </div>
        </div>

        {}
        <div className={styles.statGrid}>
          {[
            { label: "Streak hiện tại", val: memberStats.streak === -1 ? "Đăng ký lớp học để mở khóa streak" : `${memberStats.streak} buổi`, border: "#10b981", iconBg: "rgba(16,185,129,0.13)", icon: <Flame size={24} color="#10b981" />, isMessage: memberStats.streak === -1 },
            { label: "Cân nặng hiện tại", val: `${metrics.weight || memberStats.weight || 0} kg`, border: "#06b6d4", iconBg: "rgba(6,182,212,0.13)", icon: <Weight size={24} color="#06b6d4" /> },
            { label: "Lượt AI còn lại", val: `${memberStats.aiUsed} / ${memberStats.aiQuota}`, bar: memberStats.aiQuota ? Math.round(memberStats.aiUsed / memberStats.aiQuota * 100) : 0, border: "#8b5cf6", iconBg: "rgba(139,92,246,0.13)", icon: <Bot size={24} color="#8b5cf6" /> },
            { label: "Buổi tập tháng này", val: `${memberStats.sessionsCompleted} / ${memberStats.totalSchedules}`, border: "#f59e0b", iconBg: "rgba(245,158,11,0.13)", icon: <CalendarCheck size={24} color="#f59e0b" /> },
          ].map((s) => (
            <div key={s.label} className={styles.statCard} style={{ borderLeftColor: s.border }}>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>{s.label}</div>
                <div className={styles.statVal} style={s.isMessage ? { fontSize: "0.9rem", whiteSpace: "normal", lineHeight: "1.5", fontWeight: 600 } : {}}>{s.val}</div>
                {s.sub && <div className={styles.statSub} style={{ color: s.border }}>{s.sub}</div>}
                {s.bar !== undefined && (
                  <div className={styles.progressTrack}>
                    <div className={styles.progressFill} style={{ width: `${s.bar}%`, background: `linear-gradient(90deg, ${s.border}, ${s.iconBg.replace('0.13', '0.8')})` }} />
                  </div>
                )}
              </div>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: s.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {s.icon}
              </div>
            </div>
          ))}
        </div>


        {}
        <div className={styles.card} style={{ marginTop: 20 }}>
          <div className={styles.cardHeader}>
            <h6 className={styles.cardTitle}>
              <Dumbbell size={16} /> Bài tập tham khảo
            </h6>
          </div>
          <div className={styles.cardBody}>
            {}
            <div style={{ marginBottom: 20, display: "flex", gap: 10, background: "#f8fafc", padding: "6px 6px 6px 16px", borderRadius: 14, border: "1.5px solid #e2e8f0" }}>
              <input
                type="text"
                value={needInput}
                onChange={(e) => setNeedInput(e.target.value)}
                placeholder="Nhập nhu cầu (VD: giảm mỡ bụng, tập ngực, cardio...)"
                style={{ flex: 1, padding: "10px 0", border: "none", background: "transparent", color: "#0f172a", fontSize: "0.92rem", outline: "none", fontFamily: "Inter, sans-serif" }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchNeed()}
              />
              <button
                onClick={handleSearchNeed}
                style={{ padding: "10px 22px", borderRadius: 10, background: "linear-gradient(135deg,#10b981,#06b6d4)", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer", fontSize: "0.88rem", fontFamily: "Inter, sans-serif", whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(16,185,129,0.3)" }}
              >
                🔍 Tìm bài tập
              </button>
            </div>

            {exLoading ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: "#858796", fontSize: "1.5rem" }}>Đang tải bài tập...</div>
            ) : exercises.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: "#858796", fontSize: "1.5rem" }}>
                Không tìm thấy bài tập nào phù hợp với nhu cầu của bạn.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}>
                {exercises.map((ex) => {
                  const isExpanded = expandedEx === ex.id;
                  const embedUrl = ex.videoUrl
                    ? ex.videoUrl.includes("youtube.com/watch")
                      ? ex.videoUrl.replace("watch?v=", "embed/").split("&")[0]
                      : ex.videoUrl.includes("youtu.be/")
                        ? "https://www.youtube.com/embed/" + ex.videoUrl.split("youtu.be/")[1]?.split("?")[0]
                        : ex.videoUrl
                    : null;
                  return (
                    <div key={ex.id} style={{ border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", background: "#fff", boxShadow: "0 1px 6px rgba(15,23,42,0.05)", transition: "box-shadow 0.2s" }}>
                      <div
                        className={styles.exerciseRow}
                        style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", margin: 0, borderRadius: 0, background: "transparent", border: "none" }}
                        onClick={() => setExpandedEx(isExpanded ? null : ex.id)}
                      >
                        <div className={styles.exLeft}>
                          <div className={styles.exName} style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{ex.name}</div>
                          <div className={styles.exSets} style={{ fontSize: "1.05rem", marginTop: 4 }}>
                            {ex.assignmentName && <span style={{ color: "#10b981", fontWeight: 600 }}>{ex.assignmentName} · </span>}
                            💪 {ex.muscleGroup || "Khác"}
                            {ex.equipment ? ` · 🔧 ${ex.equipment}` : ""}
                          </div>
                        </div>
                        <div style={{ color: "#94a3b8", flexShrink: 0, background: "#f8fafc", borderRadius: 8, padding: 4 }}>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{ borderTop: "1px solid var(--theme-border)", background: "var(--theme-bg)", padding: "12px 16px" }}>
                          {embedUrl ? (
                            <div style={{ marginBottom: 12, borderRadius: 8, overflow: "hidden", aspectRatio: "16/9" }}>
                              <iframe
                                src={embedUrl}
                                width="100%"
                                height="100%"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                style={{ border: "none", display: "block" }}
                                title={ex.name}
                              />
                            </div>
                          ) : (
                            <div style={{ marginBottom: 10, padding: "8px 12px", background: "#f1f5f9", borderRadius: 8, color: "#94a3b8", fontSize: "1.35rem" }}>
                              🎬 Chưa có video hướng dẫn
                            </div>
                          )}
                          <div style={{ color: "var(--theme-text-dark)", fontSize: "1.4rem", lineHeight: "1.7", marginBottom: 8 }}>
                            <div>💪 Nhóm cơ: <strong>{ex.muscleGroup || "—"}</strong></div>
                            <div>🔧 Thiết bị: <strong>{ex.equipment || "—"}</strong></div>
                          </div>
                          <div style={{ padding: "8px 12px", background: "#36b9cc11", border: "1px solid #36b9cc33", borderRadius: 8, color: "#36b9cc", fontSize: "1.35rem" }}>
                            💡 <strong>Gợi ý:</strong> Dùng AI Tư vấn để nhận số Hiệp × Lần phù hợp với bạn.
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className={styles.mainGrid}>
          {}
          <div className={styles.card} style={{ marginTop: 20 }}>
            <div className={styles.cardHeader}>
              <h6 className={styles.cardTitle}>
                <Flame size={16} /> Thực đơn cá nhân
              </h6>
            </div>
            <div className={styles.cardBody}>
              {mealsLoading ? (
                <div style={{ textAlign: "center", padding: "30px 0", color: "#858796" }}>Đang tải thực đơn...</div>
              ) : meals.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "#858796" }}>
                  <div style={{ fontSize: "2.4rem", marginBottom: 8 }}>🍽️</div>
                  <div style={{ fontSize: "1.3rem" }}>Chưa có thực đơn nào — Manager sẽ cập nhật sớm!</div>
                </div>
              ) : (() => {
                const FIXED_CATEGORIES = ["Bữa sáng", "Bữa trưa", "Bữa tối", "Bữa phụ"];
                
                const mealsByCategory = {
                  "Bữa sáng": [],
                  "Bữa trưa": [],
                  "Bữa tối": [],
                  "Bữa phụ": [],
                };
                
                const uniqueGoals = ["Tất cả", ...new Set(allMeals.map(m => m.goal).filter(Boolean))];
                
                const filteredByGoal = selectedGoal === "Tất cả" 
                  ? meals 
                  : meals.filter(m => m.goal?.toLowerCase() === selectedGoal.toLowerCase());
                
                const getFixedCategory = (cat) => {
                  const lower = (cat || "").toLowerCase();
                  if (lower.includes("sáng")) return "Bữa sáng";
                  if (lower.includes("trưa") || lower.includes("chính")) return "Bữa trưa";
                  if (lower.includes("tối")) return "Bữa tối";
                  if (lower.includes("phụ") || lower.includes("snack") || lower.includes("xế")) return "Bữa phụ";
                  return "Bữa phụ";
                };

                filteredByGoal.forEach(meal => {
                  const mappedCat = getFixedCategory(meal.category);
                  if (mealsByCategory[mappedCat]) {
                    mealsByCategory[mappedCat].push(meal);
                  } else {
                    mealsByCategory["Bữa phụ"].push(meal);
                  }
                });

                return (
                  <>
                    {uniqueGoals.length > 1 && (
                      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 6 }}>
                        {uniqueGoals.map((goal) => (
                          <button
                            key={goal}
                            onClick={() => setSelectedGoal(goal)}
                            style={{
                              padding: "8px 16px",
                              borderRadius: "999px",
                              fontSize: "0.92rem",
                              fontWeight: 700,
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                              transition: "all 0.2s ease",
                              background: selectedGoal === goal 
                                ? "linear-gradient(135deg, #10b981, #06b6d4)" 
                                : "#f1f5f9",
                              color: selectedGoal === goal ? "#fff" : "#475569",
                              border: "none",
                              boxShadow: selectedGoal === goal ? "0 4px 12px rgba(16,185,129,0.25)" : "none"
                            }}
                          >
                            {goal === "Tất cả" ? "🌐 Tất cả mục tiêu" : `🎯 ${goal}`}
                          </button>
                        ))}
                      </div>
                    )}

                    <div style={{ maxHeight: "550px", overflowY: "auto", paddingRight: 4 }}>
                      {FIXED_CATEGORIES.map((category) => {
                        const items = mealsByCategory[category] || [];
                        const catLower = category.toLowerCase();
                        let emoji = "🍽️";
                        let catColor = "#8b5cf6";
                        let catBg = "rgba(139,92,246,0.08)";
                        
                        if (catLower.includes("sáng")) {
                          emoji = "🌅";
                          catColor = "#f59e0b";
                          catBg = "rgba(245,158,11,0.08)";
                        } else if (catLower.includes("trưa")) {
                          emoji = "☀️";
                          catColor = "#06b6d4";
                          catBg = "rgba(6,182,212,0.08)";
                        } else if (catLower.includes("tối")) {
                          emoji = "🌙";
                          catColor = "#3b82f6";
                          catBg = "rgba(59,130,246,0.08)";
                        } else if (catLower.includes("phụ")) {
                          emoji = "🍎";
                          catColor = "#ef4444";
                          catBg = "rgba(239,68,68,0.08)";
                        }

                        return (
                          <div key={category} style={{ marginBottom: 20 }}>
                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "12px 16px",
                              borderRadius: "12px",
                              background: catBg,
                              color: catColor,
                              fontWeight: 800,
                              fontSize: "1.15rem",
                              marginBottom: 12,
                              borderLeft: `4px solid ${catColor}`
                            }}>
                              <span style={{ fontSize: "1.3rem" }}>{emoji}</span>
                              <span style={{ textTransform: "capitalize", letterSpacing: "-0.01em" }}>{category}</span>
                              <span style={{ fontSize: "0.95rem", fontWeight: 700, color: catColor, marginLeft: "auto", opacity: 0.9 }}>
                                {items.length} món
                              </span>
                            </div>
                            
                            {items.length === 0 ? (
                              <div style={{
                                padding: "22px 16px",
                                textAlign: "center",
                                color: "#94a3b8",
                                border: "1px dashed #e2e8f0",
                                borderRadius: "14px",
                                background: "#f8fafc",
                                fontSize: "1.02rem",
                                fontStyle: "italic",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 6
                              }}>
                                🥣 Chưa có thực đơn cho bữa này
                              </div>
                            ) : (
                              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {items.map((meal) => {
                                  const isExpanded = expandedMeal === meal.id;
                                  return (
                                    <div key={meal.id} style={{ border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", background: "#fff", boxShadow: "0 1px 4px rgba(15,23,42,0.02)" }}>
                                      <div
                                        className={styles.exerciseRow}
                                        style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", margin: 0, borderRadius: 0, background: "transparent", border: "none" }}
                                        onClick={() => setExpandedMeal(isExpanded ? null : meal.id)}
                                      >
                                        <div className={styles.exLeft}>
                                          <div className={styles.exName} style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                                            {meal.name}
                                          </div>
                                          <div className={styles.exSets} style={{ fontSize: "1.05rem", marginTop: 4 }}>
                                            <span style={{ color: "#10b981", fontWeight: 600 }}>{meal.category}</span>
                                            {meal.goal && ` · 🎯 ${meal.goal}`}
                                            <strong style={{ color: "#f59e0b", marginLeft: 8 }}>🔥 {meal.calories} kcal</strong>
                                          </div>
                                        </div>
                                        <div style={{ color: "#94a3b8", flexShrink: 0, background: "#f8fafc", borderRadius: 8, padding: 4 }}>
                                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </div>
                                      </div>
                                      {isExpanded && (
                                        <div style={{ padding: "14px 18px", background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", borderTop: "1px solid #e2e8f0" }}>
                                          <div style={{ display: "flex", gap: 16, fontSize: "0.85rem" }}>
                                            <div style={{ background: "#fff", padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", flex: 1, textAlign: "center" }}>🥩 Protein: <strong style={{ color: "#10b981", fontSize: "1rem", display: "block" }}>{meal.protein}g</strong></div>
                                            <div style={{ background: "#fff", padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", flex: 1, textAlign: "center" }}>🍚 Carbs: <strong style={{ color: "#06b6d4", fontSize: "1rem", display: "block" }}>{meal.carbs}g</strong></div>
                                            <div style={{ background: "#fff", padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", flex: 1, textAlign: "center" }}>🥑 Fat: <strong style={{ color: "#f59e0b", fontSize: "1rem", display: "block" }}>{meal.fat}g</strong></div>
                                          </div>
                                          {meal.description && (
                                            <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 10, color: "#475569", fontSize: "0.85rem", lineHeight: 1.5 }}>
                                              <strong style={{ color: "#10b981" }}>💡 Gợi ý:</strong> {meal.description}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {}
          <div className={styles.card} style={{ marginTop: 20 }}>
            <div className={styles.cardHeader}>
              <h6 className={styles.cardTitle}>⚖️ Chỉ số cơ thể</h6>
              <div style={{ display: "flex", gap: "6px" }}>
                <button className={styles.btnPrimary} style={{ padding: "4px 8px", fontSize: "0.78rem" }} onClick={handleAiConsultClick}>
                  <Sparkles size={12} /> AI Tư vấn
                </button>
                <button className={styles.btnGhost} style={{ padding: "4px 8px", fontSize: "0.78rem" }} onClick={() => setMetricsOpen(true)}>+ Cập nhật</button>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.metricsGrid}>
                {[
                  { label: "Giới tính", val: memberStats.gender || "—", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
                  { label: "Tuổi", val: (memberStats.birthday ? new Date().getFullYear() - new Date(memberStats.birthday).getFullYear() : "—"), color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
                  { label: "Cân nặng (kg)", val: metrics.weight, color: "#10b981", bg: "rgba(16,185,129,0.1)" },
                  { label: "Chiều cao (cm)", val: metrics.height, color: "#06b6d4", bg: "rgba(6,182,212,0.1)" },
                  { label: "Cơ bắp (kg)", val: metrics.muscle, color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
                  { label: "Mỡ cơ thể (%)", val: metrics.fat, color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
                ].map((m) => (
                  <div key={m.label} className={styles.metricItem} style={{ border: `1px solid ${m.color}22`, background: "#fff", boxShadow: "0 1px 4px rgba(15,23,42,0.03)" }}>
                    <div style={{ background: m.bg, width: 56, height: 56, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                      <span style={{ color: m.color, fontWeight: 800, fontSize: "1.45rem" }}>{m.val}</span>
                    </div>
                    <div className={styles.metricLabel}>{m.label}</div>
                  </div>
                ))}
                <div className={styles.metricItem} style={{ gridColumn: "1 / -1", background: `linear-gradient(135deg, ${bmiColor}11 0%, transparent 100%)`, border: `1px solid ${bmiColor}33`, display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 16px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
                    <div className={styles.metricVal} style={{ color: bmiColor, fontSize: "2.8rem" }}>{displayBmi}</div>
                    <div className={styles.metricLabel} style={{ fontSize: "0.85rem", letterSpacing: "0.08em" }}>BMI</div>
                  </div>
                  {bmiStatus && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <span style={{
                        display: "inline-block",
                        padding: "4px 16px",
                        borderRadius: 999,
                        background: `${bmiColor}22`,
                        border: `1px solid ${bmiColor}55`,
                        color: bmiColor,
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        boxShadow: `0 2px 8px ${bmiColor}15`
                      }}>
                        {bmiStatus}
                      </span>
                      <span style={{ fontSize: "0.85rem", color: "#64748b", textAlign: "center", maxWidth: 280, lineHeight: 1.5, marginTop: 4 }}>
                        {bmiDescription}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.metricNote}>Chưa có lần cập nhật nào</div>
            </div>
          </div>

        </div>

        {}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, marginTop: 20, alignItems: "start" }}>
          {}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h6 className={styles.cardTitle}>📋 Nhật ký tập luyện — Chi tiết bài tập đã hoàn thành</h6>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Ngày tập</th>
                    <th>Bài tập</th>
                    <th style={{ textAlign: "center" }}>Hiệp × Lần</th>
                    <th style={{ textAlign: "center" }}>Mức tạ (kg)</th>
                    <th style={{ textAlign: "center" }}>Tổng Volume (kg)</th>
                    <th style={{ textAlign: "center" }}>RPE</th>
                  </tr>
                </thead>
                <tbody>
                  {workoutLog.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: "center", padding: "24px", color: "#858796" }}>Chưa có dữ liệu — Hoàn thành buổi tập đầu tiên để ghi nhận nhật ký!</td></tr>
                  )}
                  {workoutLog.map((entry, idx) => {
                    const rpeVal = entry.rpe;
                    let rpeBg = "#10b98122"; let rpeClr = "#10b981";
                    if (rpeVal >= 8 && rpeVal <= 9) { rpeBg = "#f59e0b22"; rpeClr = "#f59e0b"; }
                    if (rpeVal === 10) { rpeBg = "#ef444422"; rpeClr = "#ef4444"; }
                    return (
                      <tr key={idx}>
                        <td style={{ whiteSpace: "nowrap", color: "#64748b", fontSize: "0.85rem" }}>{entry.date}</td>
                        <td><strong style={{ color: "#0f172a" }}>{entry.exercise}</strong></td>
                        <td style={{ textAlign: "center", fontWeight: 600 }}>{entry.sets} × {entry.reps}</td>
                        <td style={{ textAlign: "center" }}>{entry.weight} kg</td>
                        <td style={{ textAlign: "center" }}>
                          <strong style={{ color: "#06b6d4" }}>{entry.volume} kg</strong>
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
                          ) : <span style={{ color: "#94a3b8" }}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h6 className={styles.cardTitle}>📈 Tiến độ cân nặng</h6>
              {memberStats.weightChart && memberStats.weightChart.length > 0 && (
                <span style={{ fontSize: "0.78rem", color: "#10b981", fontWeight: 600, background: "rgba(16,185,129,0.1)", padding: "3px 10px", borderRadius: 999 }}>
                  {memberStats.weightChart.length} điểm dữ liệu
                </span>
              )}
            </div>
            <div className={styles.cardBody} style={{ paddingTop: 12 }}>
              {memberStats.weightChart && memberStats.weightChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={memberStats.weightChart} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="weightGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "#0f172a", border: "none", borderRadius: 10, color: "#fff", fontSize: "0.82rem", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}
                      itemStyle={{ color: "#10b981" }}
                      formatter={(v) => [`${v} kg`, "Cân nặng"]}
                    />
                    <Line type="monotoneX" dataKey="weight" stroke="url(#weightGrad)" strokeWidth={3} dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6, fill: "#06b6d4" }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: "center", padding: "36px 0", color: "#94a3b8" }}>
                  <div style={{ fontSize: "2rem", marginBottom: 8 }}>📊</div>
                  <div style={{ fontSize: "0.88rem" }}>Chưa có dữ liệu cân nặng</div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {}
      <div className={styles.card} style={{ marginTop: 20 }}>
        <div className={styles.cardHeader}>
          <h6 className={styles.cardTitle}>📅 Thống kê tần suất đến lớp</h6>
          <span style={{ fontSize: "1.15rem", color: "var(--theme-text)", fontStyle: "italic" }}>Dữ liệu điểm danh từ HLV</span>
        </div>
        <div className={styles.tableWrap}>
          {attendanceLoading ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#858796" }}>Đang tải dữ liệu điểm danh...</div>
          ) : attendanceFrequency.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#858796" }}>
              <div style={{ fontSize: "2.4rem", marginBottom: 8 }}>🏫</div>
              <div style={{ fontSize: "1.3rem" }}>Chưa có dữ liệu điểm danh — Đăng ký lớp học và HLV sẽ điểm danh cho bạn!</div>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tên lớp</th>
                  <th>Huấn luyện viên</th>
                  <th style={{ textAlign: "center" }}>Tổng buổi</th>
                  <th style={{ textAlign: "center" }}>Có mặt</th>
                  <th style={{ textAlign: "center" }}>Vắng mặt</th>
                  <th style={{ textAlign: "center" }}>Chưa điểm danh</th>
                  <th style={{ minWidth: 160 }}>Tỷ lệ tham dự</th>
                  <th style={{ textAlign: "center" }}>Buổi gần nhất</th>
                </tr>
              </thead>
              <tbody>
                {attendanceFrequency.map((row) => {
                  const rate = row.attendanceRate;
                  let rateColor = "#10b981";
                  if (rate < 50) rateColor = "#ef4444";
                  else if (rate < 75) rateColor = "#f59e0b";
                  return (
                    <tr key={row.classGroupId}>
                      <td><strong style={{ color: "var(--theme-text-dark)" }}>{row.className}</strong></td>
                      <td style={{ color: "#06b6d4" }}>{row.instructorName}</td>
                      <td style={{ textAlign: "center", fontWeight: 700 }}>{row.totalSessions}</td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{ display: "inline-block", minWidth: 32, padding: "2px 10px", borderRadius: 20, background: "#10b98122", color: "#10b981", fontWeight: 700, fontSize: "0.9rem", border: "1px solid #10b98144" }}>{row.present}</span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {row.absent > 0 ? (
                          <span style={{ display: "inline-block", minWidth: 32, padding: "2px 10px", borderRadius: 20, background: "#ef444422", color: "#ef4444", fontWeight: 700, fontSize: "0.9rem", border: "1px solid #ef444444" }}>{row.absent}</span>
                        ) : <span style={{ color: "#94a3b8" }}>0</span>}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {row.notRecorded > 0 ? (
                          <span style={{ display: "inline-block", minWidth: 32, padding: "2px 10px", borderRadius: 20, background: "#f59e0b22", color: "#f59e0b", fontWeight: 700, fontSize: "0.9rem", border: "1px solid #f59e0b44" }}>{row.notRecorded}</span>
                        ) : <span style={{ color: "#94a3b8" }}>0</span>}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ flex: 1, height: 7, background: "#f1f5f9", borderRadius: 999, overflow: "hidden", minWidth: 80 }}>
                            <div style={{ width: `${rate}%`, height: "100%", background: rate >= 75 ? "linear-gradient(90deg,#10b981,#06b6d4)" : rate >= 50 ? "linear-gradient(90deg,#f59e0b,#fbbf24)" : "linear-gradient(90deg,#ef4444,#f87171)", borderRadius: 999, transition: "width 0.6s ease" }} />
                          </div>
                          <span style={{ fontWeight: 700, color: rateColor, fontSize: "0.85rem", minWidth: 38, background: `${rateColor}15`, padding: "2px 8px", borderRadius: 999, border: `1px solid ${rateColor}33` }}>{rate}%</span>
                        </div>
                      </td>
                      <td style={{ textAlign: "center", color: "var(--dm-text)", fontSize: "0.82rem" }}>{row.latestDate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {}
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

      {}
      {showAiModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            {aiLoading ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <Bot size={48} color="#10b981" style={{ margin: "0 auto 16px", animation: "bounce 2s infinite" }} />
                <h3 className={styles.modalTitle} style={{ marginBottom: "12px" }}>Đang phân tích dữ liệu...</h3>
                <p style={{ fontSize: "1.5rem", color: "var(--theme-text)" }}>
                  AI đang đọc các chỉ số cơ thể của bạn và đưa ra hướng tập. Vui lòng chờ trong ít phút nhé!
                </p>
              </div>
            ) : (
              <>
                <h3 className={styles.modalTitle}>Tư vấn luyện tập bằng AI</h3>
                <p style={{ fontSize: "1.4rem", color: "var(--theme-text)", marginBottom: "16px" }}>
                  Bạn muốn tập theo hướng nào, hay có bài tập cụ thể nào mong muốn? (VD: Tôi muốn giảm mỡ bụng, tập 4 ngày/tuần...)
                </p>
                <textarea
                  className={styles.modalInput}
                  value={aiRequest}
                  onChange={(e) => setAiRequest(e.target.value)}
                  placeholder="Nhập yêu cầu của bạn..."
                  disabled={aiLoading}
                />
                <div className={styles.modalActions}>
                  <button className={styles.btnCancel} onClick={() => setShowAiModal(false)} disabled={aiLoading}>Hủy</button>
                  <button className={styles.btnSubmitAi} onClick={handleAiSubmit} disabled={aiLoading || !aiRequest.trim()}>
                    <Sparkles size={16} /> Nhận tư vấn
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
