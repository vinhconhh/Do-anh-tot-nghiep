import { useState, useEffect, useCallback } from "react";
import api from "../../api/axiosClient";
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, BookOpen, Video } from "lucide-react";
import Modal from "../../components/Modal";
import styles from "./GymExerciseManagement.module.scss";

const TYPES = ["Cardio", "Free Weights", "Machine", "Bodyweight", "Stretching", "Khác"];
const MUSCLES = ["Ngực", "Lưng", "Vai", "Tay", "Bụng", "Chân", "Cardio", "Toàn thân"];

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
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage]           = useState(1);
  const [saving, setSaving]       = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, size: 15 });
      if (search) params.set("search", search);
      if (muscle) params.set("target_muscle", muscle);
      if (typeFilter && typeFilter !== "all") params.set("type", typeFilter);
      const res = await api.get(`/gym-exercises?${params}`);
      setData(res.data || { items: [], total: 0, pages: 1 });
    } catch { setData({ items: [], total: 0, pages: 1 }); }
    finally  { setLoading(false); }
  }, [page, search, muscle, typeFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  useEffect(() => {
    api.get("/equipment").then(r => setEquips(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  useEffect(() => { setPage(1); }, [search, muscle, typeFilter]);

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
    <>
      <div className={styles.tab} />
      <div className={styles.page}>
      {}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <BookOpen size={26} color="#1cc88a" /> Danh Mục Bài Tập
          </h1>
          <p className={styles.subtitle}>
            {data.total} bài tập trong hệ thống
          </p>
        </div>
        <button onClick={openCreate} className={styles.btnSuccess}>
          <Plus size={18} /> Thêm Bài Tập
        </button>
      </div>

      {}
      <div className={styles.tools}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên bài tập..." />
          {search && <button className={styles.clear} onClick={() => setSearch("")}>×</button>}
        </div>

        <div className={styles.filterGroup}>
          {["all", ...TYPES].map((t) => (
            <button
              key={t}
              className={`${styles.filterBtn} ${(typeFilter || "all") === t ? styles.filterActive : ""}`}
              onClick={() => setTypeFilter(t)}
            >
              {t === "all" ? "Mọi thể loại" : t}
            </button>
          ))}
        </div>

        <div className={styles.filterGroup}>
          {["all", ...MUSCLES].map((m) => (
            <button
              key={m}
              className={`${styles.filterBtn} ${(muscle || "all") === m ? styles.filterActive : ""}`}
              onClick={() => setMuscle(m === "all" ? "" : m)}
            >
              {m === "all" ? "Mọi nhóm cơ" : m}
            </button>
          ))}
        </div>
      </div>

      {}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {["Tên bài tập", "Tiếng Việt", "Loại", "Nhóm cơ", "MET", "Máy dùng", "Video", "Hành động"].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--theme-text)" }}>Đang tải...</td></tr>}
            {!loading && data.items.length === 0 && <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--theme-text)" }}>Chưa có bài tập nào</td></tr>}
            {(data.items || []).map((item) => {
              const tc = typeColor[item.Type] || "var(--theme-text)";
              return (
                <tr key={item.ExerciseID}>
                  <td style={{ fontWeight: 600, color: "var(--theme-text-dark)" }}>{item.Name}</td>
                  <td style={{ color: "var(--theme-text)" }}>{item.AssignmentName || "—"}</td>
                  <td>
                    <span className={styles.pill} style={{ background: tc + "22", color: tc, border: `1px solid ${tc}44` }}>{item.Type || "—"}</span>
                  </td>
                  <td>
                    <span className={`${styles.pill} ${styles.pillMuscle}`}>{item.TargetMuscle || "—"}</span>
                  </td>
                  <td style={{ color: "#f6c23e", fontWeight: 700 }}>{item.MetValue ?? "—"}</td>
                  <td style={{ color: "var(--theme-text)", fontSize: "1.6rem" }}>{item.EquipmentName || "—"}</td>
                  <td>
                    {item.VideoURL ? (
                      <a href={item.VideoURL} target="_blank" rel="noreferrer" className={styles.videoLink}>
                        <Video size={16}/> Xem
                      </a>
                    ) : <span style={{ color: "var(--theme-text)" }}>—</span>}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button onClick={() => openEdit(item)} className={`${styles.btnIcon} ${styles.btnEdit}`} title="Sửa"><Edit size={16}/></button>
                      <button onClick={() => handleDelete(item.ExerciseID)} className={`${styles.btnIcon} ${styles.btnDanger}`} title="Xóa"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {}
      <div className={styles.pagination}>
        <span className={styles.pageInfo}>Trang {data.page || page} / {data.pages || 1} ({data.total} bài tập)</span>
        <div className={styles.pageControls}>
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page <= 1} className={styles.btnPage}>
            <ChevronLeft size={18}/>
          </button>
          <button onClick={() => setPage(p => Math.min(data.pages || 1, p+1))} disabled={page >= (data.pages || 1)} className={styles.btnPage}>
            <ChevronRight size={18}/>
          </button>
        </div>
      </div>

      {}
      <Modal
        isOpen={modalOpen}
        onRequestClose={() => setModalOpen(false)}
        title={editing ? "✏️ Sửa bài tập" : "➕ Thêm bài tập mới"}
      >
        <form onSubmit={handleSave} className={styles.form}>
              <div className={styles.formGrid}>
                {[
                  { label: "Tên bài tập (EN) *", key: "Name", required: true },
                  { label: "Tên tiếng Việt", key: "AssignmentName" },
                ].map(f => (
                  <div key={f.key} className={styles.formGroup}>
                    <label>{f.label}</label>
                    <input required={f.required} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Loại bài tập</label>
                  <select value={form.Type} onChange={e => setForm(p => ({ ...p, Type: e.target.value }))}>
                    <option value="">-- Chọn --</option>
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Nhóm cơ chính</label>
                  <select value={form.TargetMuscle} onChange={e => setForm(p => ({ ...p, TargetMuscle: e.target.value }))}>
                    <option value="">-- Chọn --</option>
                    {MUSCLES.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Chỉ số MET</label>
                  <input type="number" step="0.1" min="0" value={form.MetValue} onChange={e => setForm(p => ({ ...p, MetValue: e.target.value }))} />
                </div>
                <div className={styles.formGroup}>
                  <label>Máy tập liên kết</label>
                  <select value={form.EquipmentID} onChange={e => setForm(p => ({ ...p, EquipmentID: e.target.value }))}>
                    <option value="">Không cần máy</option>
                    {equipments.map(eq => <option key={eq.EquipmentID} value={eq.EquipmentID}>{eq.Name}</option>)}
                  </select>
                </div>
              </div>
              {}
              <div className={styles.formGroup}>
                <label>🎥 Link Video hướng dẫn</label>
                <input value={form.VideoURL} onChange={e => setForm(p => ({ ...p, VideoURL: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=... hoặc link video" />
              </div>
              <div className={styles.formActions}>
                <button type="button" onClick={() => setModalOpen(false)} className={styles.btnCancel}>Hủy</button>
                <button type="submit" className={styles.btnPrimary} disabled={saving}>{saving ? "Đang lưu..." : "Lưu lại"}</button>
              </div>
            </form>
      </Modal>
      </div>
    </>
  );
}
