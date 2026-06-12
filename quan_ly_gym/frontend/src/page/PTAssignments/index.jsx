import { useState, useEffect, useCallback } from "react";
import api from "../../api/axiosClient";
import { Dumbbell, Search, Trash2, Check, Send, Loader2, ChevronLeft, ChevronRight, User } from "lucide-react";

const EXP_LABELS = { new: "🆕 Người mới", experienced: "💪 Đã từng tập", other: "📝 Khác" };
const EXP_COLORS = { new: "#1cc88a", experienced: "#36b9cc", other: "#f6c23e" };

export default function PTAssignments() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [exercises, setExercises] = useState({ items: [], total: 0, pages: 1 });
  const [mealPlans, setMealPlans] = useState([]);
  const [assignedEx, setAssignedEx] = useState([]);
  const [assignedMeals, setAssignedMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exLoading, setExLoading] = useState(false);
  const [mealLoading, setMealLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [assignDate, setAssignDate] = useState(new Date().toISOString().slice(0, 10));

  // Checked exercises and meals
  const [checkedEx, setCheckedEx] = useState({});
  const [checkedMeals, setCheckedMeals] = useState({});
  // Confirmation dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);

  // Fetch clients
  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/pt-assignments/my-clients");
      setClients(res.data || []);
    } catch { setClients([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const fetchExercises = useCallback(async () => {
    setExLoading(true);
    try {
      const params = new URLSearchParams({ page, size: 10 });
      if (search) params.set("search", search);
      const res = await api.get(`/gym-exercises?${params}`);
      setExercises(res.data || { items: [], total: 0, pages: 1 });
    } catch { setExercises({ items: [], total: 0, pages: 1 }); }
    finally { setExLoading(false); }
  }, [page, search]);

  const fetchMealPlans = useCallback(async () => {
    setMealLoading(true);
    try {
      const res = await api.get(`/meal-plans`);
      setMealPlans(res.data || []);
    } catch { setMealPlans([]); }
    finally { setMealLoading(false); }
  }, []);

  useEffect(() => { 
    if (selectedClient) {
      fetchExercises();
      fetchMealPlans();
    }
  }, [fetchExercises, fetchMealPlans, selectedClient]);
  useEffect(() => { setPage(1); }, [search]);

  // Fetch assigned exercises and meals for selected client
  const fetchAssigned = useCallback(async () => {
    if (!selectedClient) return;
    try {
      const [exRes, mealRes] = await Promise.all([
        api.get(`/pt-assignments/client/${selectedClient.memberId}/exercises?assigned_date=${assignDate}`),
        api.get(`/pt-assignments/client/${selectedClient.memberId}/meals?assigned_date=${assignDate}`)
      ]);
      setAssignedEx(exRes.data || []);
      setAssignedMeals(mealRes.data || []);
    } catch { 
      setAssignedEx([]); 
      setAssignedMeals([]);
    }
  }, [selectedClient, assignDate]);

  useEffect(() => { fetchAssigned(); }, [fetchAssigned]);

  const toggleCheckEx = (exId) => {
    setCheckedEx(prev => {
      const next = { ...prev };
      if (next[exId]) delete next[exId];
      else next[exId] = { sets: 3, reps: 12, duration: "", weight: "", note: "" };
      return next;
    });
  };

  const updateConfigEx = (exId, key, val) => {
    setCheckedEx(prev => ({ ...prev, [exId]: { ...prev[exId], [key]: val } }));
  };

  const toggleCheckMeal = (mealId) => {
    setCheckedMeals(prev => {
      const next = { ...prev };
      if (next[mealId]) delete next[mealId];
      else next[mealId] = { note: "" };
      return next;
    });
  };

  const updateConfigMeal = (mealId, key, val) => {
    setCheckedMeals(prev => ({ ...prev, [mealId]: { ...prev[mealId], [key]: val } }));
  };

  const checkedExCount = Object.keys(checkedEx).length;
  const checkedMealCount = Object.keys(checkedMeals).length;
  const totalChecked = checkedExCount + checkedMealCount;

  const handleSend = async () => {
    setSending(true);
    try {
      const exList = Object.entries(checkedEx).map(([exId, cfg]) => ({
        exerciseId: parseInt(exId),
        sets: parseInt(cfg.sets) || 3,
        reps: parseInt(cfg.reps) || 12,
        duration: cfg.duration ? parseInt(cfg.duration) : null,
        weight: cfg.weight ? parseFloat(cfg.weight) : null,
        note: cfg.note || "",
      }));
      const mealList = Object.entries(checkedMeals).map(([mealId, cfg]) => ({
        mealPlanId: parseInt(mealId),
        note: cfg.note || "",
      }));

      const promises = [];
      if (exList.length > 0) {
        promises.push(api.post("/pt-assignments", {
          memberId: selectedClient.memberId,
          assignedDate: assignDate,
          exercises: exList,
        }));
      }
      if (mealList.length > 0) {
        promises.push(api.post("/pt-assignments/meals", {
          memberId: selectedClient.memberId,
          assignedDate: assignDate,
          meals: mealList,
        }));
      }

      await Promise.all(promises);

      setCheckedEx({});
      setCheckedMeals({});
      setConfirmOpen(false);
      fetchAssigned();
      alert("✅ Đã gửi giáo án thành công!");
    } catch (e) {
      alert("❌ Lỗi: " + (e.response?.data?.detail || e.message));
    }
    finally { setSending(false); }
  };

  const handleDeleteAssignment = async (id, type) => {
    if (!window.confirm(`Xóa ${type === 'meal' ? 'thực đơn' : 'bài tập'} đã phân này?`)) return;
    try {
      if (type === 'meal') {
        await api.delete(`/pt-assignments/meals/${id}`);
      } else {
        await api.delete(`/pt-assignments/${id}`);
      }
      fetchAssigned();
    } catch (e) { alert("Lỗi: " + (e.response?.data?.detail || e.message)); }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "var(--theme-text)", gap: 10, fontSize: "1.5rem" }}>
      <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} /> Đang tải...
    </div>
  );

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto" }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--theme-text-dark)", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <Dumbbell size={26} color="#1cc88a" /> Giao Giáo án (Bài tập & Bữa ăn)
        </h1>
        <p style={{ color: "var(--theme-text)", margin: "4px 0 0", fontSize: "1.4rem" }}>
          Chọn khách hàng → chọn bài tập và thực đơn → gửi
        </p>
      </div>

      {clients.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--theme-text)" }}>
          <User size={48} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ fontSize: "1.5rem" }}>Bạn chưa có khách hàng nào</p>
          <p style={{ fontSize: "1.3rem" }}>Chờ hội viên gửi yêu cầu thuê PT và bạn phê duyệt.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20 }}>
          {/* Left: Client list */}
          <div style={{ background: "var(--theme-surface)", borderRadius: 14, border: "1px solid var(--theme-border)", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ padding: "16px", borderBottom: "1px solid var(--theme-border)" }}>
              <h3 style={{ color: "var(--theme-text-dark)", fontSize: "1.5rem", margin: 0, fontWeight: 700 }}>Khách hàng ({clients.length})</h3>
            </div>
            <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
              {clients.map(c => {
                const active = selectedClient?.memberId === c.memberId;
                const ec = EXP_COLORS[c.experienceLevel] || "#94a3b8";
                return (
                  <div key={c.memberId} onClick={() => { setSelectedClient(c); setCheckedEx({}); setCheckedMeals({}); }}
                    style={{
                      padding: "14px 16px", cursor: "pointer", borderBottom: "1px solid var(--theme-border)",
                      background: active ? "var(--theme-primary)" : "transparent", transition: "background 0.15s",
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--theme-bg)"; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ fontWeight: 700, color: active ? "#fff" : "var(--theme-text-dark)", fontSize: "1.5rem" }}>{c.memberName}</div>
                    <div style={{ color: active ? "rgba(255,255,255,0.7)" : "var(--theme-text)", fontSize: "1.3rem", marginTop: 2 }}>{c.goal || "Chưa có mục tiêu"}</div>
                    <span style={{ display: "inline-block", marginTop: 6, background: ec + "22", color: ec, padding: "3px 10px", borderRadius: 12, fontSize: "1.2rem", fontWeight: 700, border: `1px solid ${ec}44` }}>
                      {EXP_LABELS[c.experienceLevel] || "🆕 Người mới"}
                    </span>
                    {c.experienceLevel === "other" && c.bodyNote && (
                      <div style={{ color: "#f6c23e", fontSize: "1.2rem", marginTop: 4, fontStyle: "italic" }}>"{c.bodyNote}"</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Content */}
          {selectedClient ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Date picker */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <label style={{ color: "var(--theme-text)", fontSize: "1.4rem", fontWeight: 600 }}>Ngày phân bài:</label>
                <input type="date" value={assignDate} onChange={e => setAssignDate(e.target.value)}
                  style={{ padding: "8px 14px", background: "var(--theme-surface)", border: "1px solid var(--theme-border)", borderRadius: 8, color: "var(--theme-text-dark)", fontSize: "1.4rem" }} />
              </div>

              {/* Assigned exercises & meals */}
              <div style={{ background: "var(--theme-surface)", borderRadius: 14, border: "1px solid var(--theme-border)", padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <h3 style={{ color: "var(--theme-text-dark)", fontSize: "1.5rem", margin: "0 0 12px", fontWeight: 700 }}>📋 Giáo án đã giao cho {selectedClient.memberName}</h3>
                
                {assignedEx.length === 0 && assignedMeals.length === 0 ? (
                  <div style={{ color: "var(--theme-text)", textAlign: "center", padding: 20, fontSize: "1.4rem" }}>Chưa có giáo án nào cho ngày này</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    
                    {assignedEx.length > 0 && (
                      <div>
                        <h4 style={{ color: "var(--theme-text-dark)", fontSize: "1.3rem", marginBottom: 8, fontWeight: 700 }}>💪 Bài tập</h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {assignedEx.map(a => (
                            <div key={a.assignmentId} style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              padding: "12px 14px", background: "var(--theme-bg)", borderRadius: 10, border: "1px solid var(--theme-border)",
                            }}>
                              <div>
                                <span style={{ fontWeight: 700, color: a.status === "Completed" ? "#1cc88a" : "var(--theme-text-dark)", fontSize: "1.4rem" }}>
                                  {a.status === "Completed" && "✅ "}{a.exerciseName}
                                </span>
                                {a.assignmentName && <span style={{ color: "var(--theme-text)", marginLeft: 8, fontSize: "1.3rem" }}>({a.assignmentName})</span>}
                                <div style={{ color: "var(--theme-text)", fontSize: "1.3rem", marginTop: 2 }}>
                                  {a.sets}×{a.reps} {a.duration ? `· ${a.duration} phút` : ""} {a.weight ? `· ${a.weight}kg` : ""}
                                  {a.note && <span style={{ color: "#f6c23e", marginLeft: 6 }}>💬 {a.note}</span>}
                                </div>
                              </div>
                              <button onClick={() => handleDeleteAssignment(a.assignmentId, 'exercise')}
                                style={{ background: "#e74a3b22", color: "#e74a3b", border: "1px solid #e74a3b44", borderRadius: 7, padding: "6px 10px", cursor: "pointer", fontSize: "1.3rem" }}>
                                <Trash2 size={15} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {assignedMeals.length > 0 && (
                      <div>
                        <h4 style={{ color: "var(--theme-text-dark)", fontSize: "1.3rem", marginBottom: 8, fontWeight: 700, marginTop: 8 }}>🥗 Thực đơn</h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {assignedMeals.map(a => (
                            <div key={a.assignmentId} style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              padding: "12px 14px", background: "var(--theme-bg)", borderRadius: 10, border: "1px solid var(--theme-border)",
                            }}>
                              <div>
                                <span style={{ fontWeight: 700, color: a.status === "Completed" ? "#1cc88a" : "var(--theme-text-dark)", fontSize: "1.4rem" }}>
                                  {a.status === "Completed" && "✅ "}{a.mealPlanName}
                                </span>
                                {a.category && <span style={{ color: "var(--theme-text)", marginLeft: 8, fontSize: "1.3rem" }}>({a.category})</span>}
                                <div style={{ color: "var(--theme-text)", fontSize: "1.3rem", marginTop: 2 }}>
                                  {a.calories} Kcal
                                  {a.note && <span style={{ color: "#f6c23e", marginLeft: 6 }}>💬 {a.note}</span>}
                                </div>
                              </div>
                              <button onClick={() => handleDeleteAssignment(a.assignmentId, 'meal')}
                                style={{ background: "#e74a3b22", color: "#e74a3b", border: "1px solid #e74a3b44", borderRadius: 7, padding: "6px 10px", cursor: "pointer", fontSize: "1.3rem" }}>
                                <Trash2 size={15} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>

              {/* Exercise catalog - tick to select */}
              <div style={{ background: "var(--theme-surface)", borderRadius: 14, border: "1px solid var(--theme-border)", padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <h3 style={{ color: "var(--theme-text-dark)", fontSize: "1.5rem", margin: "0 0 12px", fontWeight: 700 }}>📚 Danh mục bài tập — tick để chọn</h3>

                {/* Search */}
                <div style={{ position: "relative", marginBottom: 12 }}>
                  <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--theme-text)" }} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm bài tập..."
                    style={{ width: "100%", padding: "10px 14px 10px 38px", background: "var(--theme-bg)", border: "1px solid var(--theme-border)", borderRadius: 8, color: "var(--theme-text-dark)", fontSize: "1.4rem", outline: "none", boxSizing: "border-box" }} />
                </div>

                {exLoading ? (
                  <div style={{ textAlign: "center", padding: 20, color: "var(--theme-text)", fontSize: "1.4rem" }}>Đang tải...</div>
                ) : (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {exercises.items.map(ex => {
                        const isChecked = !!checkedEx[ex.ExerciseID];
                        return (
                          <div key={ex.ExerciseID} style={{
                            background: isChecked ? "#1cc88a11" : "var(--theme-bg)", border: `1px solid ${isChecked ? "#1cc88a44" : "var(--theme-border)"}`,
                            borderRadius: 10, padding: "12px 14px", cursor: "pointer", transition: "all 0.15s",
                          }} onClick={() => toggleCheckEx(ex.ExerciseID)}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              {/* Checkbox */}
                              <div style={{
                                width: 24, height: 24, borderRadius: 6, border: `2px solid ${isChecked ? "#1cc88a" : "var(--theme-border)"}`,
                                background: isChecked ? "#1cc88a" : "transparent", display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "all 0.15s", flexShrink: 0,
                              }}>
                                {isChecked && <Check size={14} color="#fff" strokeWidth={3} />}
                              </div>
                              <div style={{ flex: 1 }}>
                                <span style={{ fontWeight: 700, color: "var(--theme-text-dark)", fontSize: "1.5rem" }}>{ex.Name}</span>
                                {ex.AssignmentName && <span style={{ color: "var(--theme-text)", marginLeft: 8, fontSize: "1.3rem" }}>({ex.AssignmentName})</span>}
                                <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                                  {ex.Type && <span style={{ background: "#4e73df22", color: "#4e73df", padding: "3px 10px", borderRadius: 12, fontSize: "1.2rem", fontWeight: 600 }}>{ex.Type}</span>}
                                  {ex.TargetMuscle && <span style={{ background: "#1cc88a22", color: "#1cc88a", padding: "3px 10px", borderRadius: 12, fontSize: "1.2rem", fontWeight: 600 }}>{ex.TargetMuscle}</span>}
                                </div>
                              </div>
                            </div>

                            {/* Config row — show when checked */}
                            {isChecked && (
                              <div onClick={e => e.stopPropagation()} style={{
                                display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center",
                              }}>
                                {[
                                  { key: "sets", label: "Hiệp", w: 65, type: "number" },
                                  { key: "reps", label: "Lần", w: 65, type: "number" },
                                  { key: "duration", label: "Phút", w: 65, type: "number" },
                                  { key: "weight", label: "Kg", w: 75, type: "number" },
                                ].map(f => (
                                  <div key={f.key} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                    <span style={{ color: "var(--theme-text)", fontSize: "1.2rem", fontWeight: 600 }}>{f.label}</span>
                                    <input type={f.type} value={checkedEx[ex.ExerciseID]?.[f.key] || ""} onClick={e => e.stopPropagation()}
                                      onChange={e => updateConfigEx(ex.ExerciseID, f.key, e.target.value)}
                                      style={{ width: f.w, padding: "6px 8px", background: "var(--theme-bg)", border: "1px solid var(--theme-border)", borderRadius: 6, color: "var(--theme-text-dark)", fontSize: "1.4rem", outline: "none" }} />
                                  </div>
                                ))}
                                <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, minWidth: 120 }}>
                                  <span style={{ color: "var(--theme-text)", fontSize: "1.2rem", fontWeight: 600 }}>Ghi chú</span>
                                  <input value={checkedEx[ex.ExerciseID]?.note || ""} onClick={e => e.stopPropagation()}
                                    onChange={e => updateConfigEx(ex.ExerciseID, "note", e.target.value)} placeholder="Ghi chú cho bài tập..."
                                    style={{ padding: "6px 8px", background: "var(--theme-bg)", border: "1px solid var(--theme-border)", borderRadius: 6, color: "var(--theme-text-dark)", fontSize: "1.4rem", outline: "none" }} />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                      <span style={{ color: "var(--theme-text)", fontSize: "1.3rem" }}>Trang {exercises.page || page} / {exercises.pages || 1}</span>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                          style={{ padding: "7px 14px", background: page <= 1 ? "var(--theme-bg)" : "var(--theme-primary)", color: page <= 1 ? "var(--theme-text)" : "#fff", border: "1px solid var(--theme-border)", borderRadius: 8, cursor: page <= 1 ? "default" : "pointer", fontSize: "1.3rem" }}>
                          <ChevronLeft size={16} />
                        </button>
                        <button onClick={() => setPage(p => Math.min(exercises.pages || 1, p + 1))} disabled={page >= (exercises.pages || 1)}
                          style={{ padding: "7px 14px", background: page >= (exercises.pages || 1) ? "var(--theme-bg)" : "var(--theme-primary)", color: page >= (exercises.pages || 1) ? "var(--theme-text)" : "#fff", border: "1px solid var(--theme-border)", borderRadius: 8, cursor: page >= (exercises.pages || 1) ? "default" : "pointer", fontSize: "1.3rem" }}>
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Meal catalog - tick to select */}
              <div style={{ background: "var(--theme-surface)", borderRadius: 14, border: "1px solid var(--theme-border)", padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <h3 style={{ color: "var(--theme-text-dark)", fontSize: "1.5rem", margin: "0 0 12px", fontWeight: 700 }}>🥗 Danh mục thực đơn — tick để chọn</h3>

                {mealLoading ? (
                  <div style={{ textAlign: "center", padding: 20, color: "var(--theme-text)", fontSize: "1.4rem" }}>Đang tải...</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {mealPlans.map(mp => {
                      const isChecked = !!checkedMeals[mp.id];
                      return (
                        <div key={mp.id} style={{
                          background: isChecked ? "#f6c23e11" : "var(--theme-bg)", border: `1px solid ${isChecked ? "#f6c23e44" : "var(--theme-border)"}`,
                          borderRadius: 10, padding: "12px 14px", cursor: "pointer", transition: "all 0.15s",
                        }} onClick={() => toggleCheckMeal(mp.id)}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 24, height: 24, borderRadius: 6, border: `2px solid ${isChecked ? "#f6c23e" : "var(--theme-border)"}`,
                              background: isChecked ? "#f6c23e" : "transparent", display: "flex", alignItems: "center", justifyContent: "center",
                              transition: "all 0.15s", flexShrink: 0,
                            }}>
                              {isChecked && <Check size={14} color="#fff" strokeWidth={3} />}
                            </div>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontWeight: 700, color: "var(--theme-text-dark)", fontSize: "1.5rem" }}>{mp.name}</span>
                              <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                                <span style={{ background: "#f6c23e22", color: "#f6c23e", padding: "3px 10px", borderRadius: 12, fontSize: "1.2rem", fontWeight: 600 }}>{mp.category}</span>
                                <span style={{ background: "#e74a3b22", color: "#e74a3b", padding: "3px 10px", borderRadius: 12, fontSize: "1.2rem", fontWeight: 600 }}>{mp.calories} kcal</span>
                              </div>
                            </div>
                          </div>

                          {/* Config row — show when checked */}
                          {isChecked && (
                            <div onClick={e => e.stopPropagation()} style={{
                              display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center",
                            }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
                                <span style={{ color: "var(--theme-text)", fontSize: "1.2rem", fontWeight: 600 }}>Ghi chú dặn dò</span>
                                <input value={checkedMeals[mp.id]?.note || ""} onClick={e => e.stopPropagation()}
                                  onChange={e => updateConfigMeal(mp.id, "note", e.target.value)} placeholder="VD: ăn trước tập 2 tiếng..."
                                  style={{ padding: "6px 8px", background: "var(--theme-bg)", border: "1px solid var(--theme-border)", borderRadius: 6, color: "var(--theme-text-dark)", fontSize: "1.4rem", outline: "none" }} />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Send button */}
              {totalChecked > 0 && (
                  <button onClick={() => setConfirmOpen(true)}
                    style={{
                      marginTop: 16, width: "100%", padding: "14px", fontSize: "1.5rem", fontWeight: 800,
                      background: "linear-gradient(135deg,#1cc88a,#17a673)", color: "#fff", border: "none",
                      borderRadius: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}>
                    <Send size={18} /> Gửi {totalChecked} hạng mục cho {selectedClient.memberName}
                  </button>
                )}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--theme-text)", fontSize: "1.5rem", height: 300 }}>
              👆 Chọn một khách hàng để bắt đầu phân bài tập
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}
          onClick={() => setConfirmOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "var(--theme-surface)", border: "1px solid var(--theme-border)", borderRadius: 16, padding: 32, width: "100%", maxWidth: 440,
            boxShadow: "0 25px 50px rgba(0,0,0,0.25)", textAlign: "center",
          }}>
            <div style={{ fontSize: "3.2rem", marginBottom: 12 }}>📤</div>
            <h2 style={{ color: "var(--theme-text-dark)", fontWeight: 800, marginBottom: 8, fontSize: "1.8rem" }}>Xác nhận gửi bài tập</h2>
            <p style={{ color: "var(--theme-text)", marginBottom: 20, fontSize: "1.4rem" }}>
              Bạn có chắc muốn gửi <strong style={{ color: "#1cc88a" }}>{checkedExCount} bài tập</strong> và <strong style={{ color: "#f6c23e" }}>{checkedMealCount} thực đơn</strong> cho <strong style={{ color: "#4e73df" }}>{selectedClient?.memberName}</strong>?
            </p>
            <p style={{ color: "var(--theme-text)", fontSize: "1.3rem", marginBottom: 20 }}>
              Ngày: <strong style={{ color: "#f6c23e" }}>{assignDate}</strong>
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => setConfirmOpen(false)}
                style={{ padding: "10px 24px", background: "var(--theme-bg)", color: "var(--theme-text-dark)", border: "1px solid var(--theme-border)", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: "1.4rem" }}>
                Hủy
              </button>
              <button onClick={handleSend} disabled={sending}
                style={{ padding: "10px 24px", background: "linear-gradient(135deg,#1cc88a,#17a673)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: "1.4rem" }}>
                {sending ? "Đang gửi..." : "✅ Xác nhận gửi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
