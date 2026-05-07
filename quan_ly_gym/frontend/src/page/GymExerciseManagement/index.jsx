import { useState, useEffect, useCallback } from "react";
import api from "../../api/axiosClient";
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, BookOpen, Video } from "lucide-react";

const TYPES = ["Cardio", "Free Weights", "Machine", "Bodyweight", "Stretching", "Khác"];
const MUSCLES = ["Ngực", "Lưng", "Vai", "Tay", "Bụng", "Đùi", "Bắp chân", "Mông", "Toàn thân"];

const EMPTY_FORM = { Name: "", AssignmentName: "", Type: "", TargetMuscle: "", MetValue: 0, EquipmentID: "", VideoURL: "" };

export default function GymExerciseManagement() {
  const [data, setData]           = useState({ items: [], total: 0, pages: 1 });
  const [equipments, setEquips]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [search, setSearch]       = useState("");
  const [muscle, setMuscle]       = useState("");
  const [page, setPage]           = useState(1);
  const [saving, setSaving]       = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, size: 15 });
      if (search) params.set("search", search);
      if (muscle) params.set("target_muscle", muscle);
      const res = await api.get(`/gym-exercises?${params}`);
      setData(res.data || { items: [], total: 0, pages: 1 });
    } catch { setData({ items: [], total: 0, pages: 1 }); }
    finally  { setLoading(false); }
  }, [page, search, muscle]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  useEffect(() => {
    api.get("/equipment").then(r => setEquips(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  useEffect(() => { setPage(1); }, [search, muscle]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit   = (item) => {
    setEditing(item);
    setForm({ Name: item.Name || "", AssignmentName: item.AssignmentName || "", Type: item.Type || "", TargetMuscle: item.TargetMuscle || "", MetValue: item.MetValue ?? 0, EquipmentID: item.EquipmentID || "", VideoURL: item.VideoURL || "" });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    const payload = { ...form, MetValue: parseFloat(form.MetValue) || 0, EquipmentID: form.EquipmentID ? parseInt(form.EquipmentID) : null, VideoURL: form.VideoURL || null };
    try {
      if (editing) await api.put(`/gym-exercises/${editing.ExerciseID}`, payload);
      else         await api.post("/gym-exercises", payload);
      setModalOpen(false); fetchItems();
    } catch { alert("Lưu thất bại!"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xác nhận xóa bài tập này?")) return;
    try { await api.delete(`/gym-exercises/${id}`); fetchItems(); }
    catch { alert("Xóa thất bại!"); }
  };

  const typeColor = { Cardio: "#f6c23e", "Free Weights": "#1cc88a", Machine: "#36b9cc", Bodyweight: "#4e73df", Stretching: "#e74a3b" };

  return (
    <div style={{ padding: "24px", minHeight: "100vh", background: "var(--theme-bg)", color: "var(--theme-text-dark)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--theme-text-dark)", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <BookOpen size={26} color="#1cc88a" /> Danh Mục Bài Tập
          </h1>
          <p style={{ color: "var(--theme-text)", margin: "4px 0 0", fontSize: "1.5rem" }}>
            {data.total} bài tập trong hệ thống
          </p>
        </div>
        <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,#1cc88a,#17a673)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer" }}>
          <Plus size={18} /> Thêm Bài Tập
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--theme-text)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên bài tập..."
            style={{ width: "100%", padding: "9px 12px 9px 36px", background: "var(--theme-surface)", border: "1px solid var(--theme-border)", borderRadius: 8, color: "var(--theme-text-dark)", fontSize: "1.5rem", outline: "none", boxSizing: "border-box" }} />
        </div>
        <select value={muscle} onChange={e => setMuscle(e.target.value)}
          style={{ padding: "9px 14px", background: "var(--theme-surface)", border: "1px solid var(--theme-border)", borderRadius: 8, color: "var(--theme-text-dark)", cursor: "pointer" }}>
          <option value="">Tất cả nhóm cơ</option>
          {MUSCLES.map(m => <option key={m}>{m}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "var(--theme-surface)", borderRadius: 14, border: "1px solid var(--theme-border)", overflow: "hidden", marginBottom: 16 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--theme-bg)" }}>
              {["Tên bài tập", "Tiếng Việt", "Loại", "Nhóm cơ", "MET", "Máy dùng", "Video", "Hành động"].map(h => (
                <th key={h} style={{ padding: "13px 16px", textAlign: "left", fontSize: "1.3rem", fontWeight: 700, color: "var(--theme-text)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--theme-text)" }}>Đang tải...</td></tr>}
            {!loading && data.items.length === 0 && <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--theme-text)" }}>Chưa có bài tập nào</td></tr>}
            {(data.items || []).map((item) => {
              const tc = typeColor[item.Type] || "var(--theme-text)";
              return (
                <tr key={item.ExerciseID} style={{ borderTop: "1px solid var(--theme-border)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--theme-bg)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--theme-text-dark)" }}>{item.Name}</td>
                  <td style={{ padding: "12px 16px", color: "var(--theme-text)" }}>{item.AssignmentName || "—"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: tc + "22", color: tc, padding: "3px 10px", borderRadius: 20, fontSize: "1.3rem", fontWeight: 600, border: `1px solid ${tc}44` }}>{item.Type || "—"}</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: "#4e73df22", color: "#a5b4fc", padding: "3px 10px", borderRadius: 20, fontSize: "1.3rem", fontWeight: 600 }}>{item.TargetMuscle || "—"}</span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#f6c23e", fontWeight: 700 }}>{item.MetValue ?? "—"}</td>
                  <td style={{ padding: "12px 16px", color: "var(--theme-text)", fontSize: "1.5rem" }}>{item.EquipmentName || "—"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {item.VideoURL ? (
                      <a href={item.VideoURL} target="_blank" rel="noreferrer" style={{ color: "#36b9cc", display: "flex", alignItems: "center", gap: 4 }}>
                        <Video size={16}/> Xem
                      </a>
                    ) : <span style={{ color: "var(--theme-text)" }}>—</span>}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => openEdit(item)} style={{ background: "#36b9cc22", color: "#36b9cc", border: "1px solid #36b9cc44", borderRadius: 7, padding: "6px 10px", cursor: "pointer" }}><Edit size={15}/></button>
                      <button onClick={() => handleDelete(item.ExerciseID)} style={{ background: "#e74a3b22", color: "#e74a3b", border: "1px solid #e74a3b44", borderRadius: 7, padding: "6px 10px", cursor: "pointer" }}><Trash2 size={15}/></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "var(--theme-text)", fontSize: "1.5rem" }}>Trang {data.page || page} / {data.pages || 1} ({data.total} bài tập)</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page <= 1}
            style={{ padding: "7px 14px", background: page <= 1 ? "var(--theme-bg)" : "var(--theme-primary)", color: page <= 1 ? "var(--theme-text)" : "#fff", border: "1px solid var(--theme-border)", borderRadius: 8, cursor: page <= 1 ? "default" : "pointer" }}>
            <ChevronLeft size={16}/>
          </button>
          <button onClick={() => setPage(p => Math.min(data.pages || 1, p+1))} disabled={page >= (data.pages || 1)}
            style={{ padding: "7px 14px", background: page >= (data.pages || 1) ? "var(--theme-bg)" : "var(--theme-primary)", color: page >= (data.pages || 1) ? "var(--theme-text)" : "#fff", border: "1px solid var(--theme-border)", borderRadius: 8, cursor: page >= (data.pages || 1) ? "default" : "pointer" }}>
            <ChevronRight size={16}/>
          </button>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "var(--theme-surface)", border: "1px solid var(--theme-border)", borderRadius: 16, padding: 28, width: "100%", maxWidth: 540, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
            <h2 style={{ color: "var(--theme-text-dark)", fontWeight: 800, marginBottom: 22, fontSize: "1.4rem" }}>
              {editing ? "✏️ Sửa bài tập" : "➕ Thêm bài tập mới"}
            </h2>
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", gap: 12 }}>
                {[
                  { label: "Tên bài tập (EN) *", key: "Name", required: true },
                  { label: "Tên tiếng Việt", key: "AssignmentName" },
                ].map(f => (
                  <div key={f.key} style={{ flex: 1 }}>
                    <label style={{ color: "var(--theme-text)", fontSize: "1.4rem", display: "block", marginBottom: 5 }}>{f.label}</label>
                    <input required={f.required} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      style={{ width: "100%", padding: "9px 12px", background: "var(--theme-bg)", border: "1px solid var(--theme-border)", borderRadius: 8, color: "var(--theme-text-dark)", outline: "none", boxSizing: "border-box" }} />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ color: "var(--theme-text)", fontSize: "1.4rem", display: "block", marginBottom: 5 }}>Loại bài tập</label>
                  <select value={form.Type} onChange={e => setForm(p => ({ ...p, Type: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", background: "var(--theme-bg)", border: "1px solid var(--theme-border)", borderRadius: 8, color: "var(--theme-text-dark)" }}>
                    <option value="">-- Chọn --</option>
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ color: "var(--theme-text)", fontSize: "1.4rem", display: "block", marginBottom: 5 }}>Nhóm cơ chính</label>
                  <select value={form.TargetMuscle} onChange={e => setForm(p => ({ ...p, TargetMuscle: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", background: "var(--theme-bg)", border: "1px solid var(--theme-border)", borderRadius: 8, color: "var(--theme-text-dark)" }}>
                    <option value="">-- Chọn --</option>
                    {MUSCLES.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ color: "var(--theme-text)", fontSize: "1.4rem", display: "block", marginBottom: 5 }}>Chỉ số MET</label>
                  <input type="number" step="0.1" min="0" value={form.MetValue} onChange={e => setForm(p => ({ ...p, MetValue: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", background: "var(--theme-bg)", border: "1px solid var(--theme-border)", borderRadius: 8, color: "var(--theme-text-dark)", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ color: "var(--theme-text)", fontSize: "1.4rem", display: "block", marginBottom: 5 }}>Máy tập liên kết</label>
                  <select value={form.EquipmentID} onChange={e => setForm(p => ({ ...p, EquipmentID: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", background: "var(--theme-bg)", border: "1px solid var(--theme-border)", borderRadius: 8, color: "var(--theme-text-dark)" }}>
                    <option value="">Không cần máy</option>
                    {equipments.map(eq => <option key={eq.EquipmentID} value={eq.EquipmentID}>{eq.Name}</option>)}
                  </select>
                </div>
              </div>
              {/* Video URL */}
              <div>
                <label style={{ color: "var(--theme-text)", fontSize: "1.4rem", display: "block", marginBottom: 5 }}>🎥 Link Video hướng dẫn</label>
                <input value={form.VideoURL} onChange={e => setForm(p => ({ ...p, VideoURL: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=... hoặc link video"
                  style={{ width: "100%", padding: "9px 12px", background: "var(--theme-bg)", border: "1px solid var(--theme-border)", borderRadius: 8, color: "var(--theme-text-dark)", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setModalOpen(false)} style={{ padding: "9px 20px", background: "var(--theme-bg)", color: "var(--theme-text-dark)", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 600 }}>Hủy</button>
                <button type="submit" disabled={saving} style={{ padding: "9px 22px", background: "linear-gradient(135deg,#1cc88a,#17a673)", color: "#fff", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 700 }}>
                  {saving ? "Đang lưu..." : "💾 Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
