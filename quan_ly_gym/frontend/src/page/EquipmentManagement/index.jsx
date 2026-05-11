import { useState, useEffect } from "react";
import api from "../../api/axiosClient";
import { Plus, Edit, Trash2, Search, Filter, Dumbbell, AlertTriangle, CheckCircle2, Wrench } from "lucide-react";
import styles from "./EquipmentManagement.module.scss";

const CATEGORIES = ["Cardio", "Tạ máy", "Tạ tự do", "Thể lực", "Yoga", "Khác"];
const STATUSES   = ["Hoạt động", "Đang bảo trì", "Hỏng"];

const statusStyle = {
  "Hoạt động":    { class: styles.pillActive, icon: <CheckCircle2 size={14}/> },
  "Đang bảo trì": { class: styles.pillMaintenance, icon: <Wrench size={14}/> },
  "Hỏng":         { class: styles.pillBroken, icon: <AlertTriangle size={14}/> },
};

const EMPTY_FORM = { Name: "", Category: "", Zone: "", Quantity: 1, Status: "Hoạt động" };

export default function EquipmentManagement() {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [filterCat, setFilterCat] = useState("");
  const [filterSt, setFilterSt]   = useState("");
  const [search, setSearch]       = useState("");
  const [saving, setSaving]       = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = [];
      if (filterCat) params.push(`category=${encodeURIComponent(filterCat)}`);
      if (filterSt)  params.push(`status=${encodeURIComponent(filterSt)}`);
      const res = await api.get(`/equipment${params.length ? "?" + params.join("&") : ""}`);
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch { setItems([]); }
    finally  { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, [filterCat, filterSt]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit   = (item) => {
    setEditing(item);
    setForm({ Name: item.Name, Category: item.Category || "", Zone: item.Zone || "", Quantity: item.Quantity ?? 1, Status: item.Status || "Hoạt động" });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) await api.put(`/equipment/${editing.EquipmentID}`, form);
      else         await api.post("/equipment", form);
      setModalOpen(false); fetchItems();
    } catch { alert("Lưu thất bại!"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xác nhận xóa thiết bị này?")) return;
    try { await api.delete(`/equipment/${id}`); fetchItems(); }
    catch { alert("Xóa thất bại!"); }
  };

  const displayed = items.filter(i =>
    !search || i.Name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <Dumbbell size={26} color="var(--theme-primary)" /> Quản Lý Thiết Bị & Máy Tập
          </h1>
          <p className={styles.subtitle}>
            {items.length} thiết bị — {items.filter(i => i.Status === "Hoạt động").length} đang hoạt động
          </p>
        </div>
        <button onClick={openCreate} className={styles.btnPrimary}>
          <Plus size={18} /> Thêm Thiết Bị
        </button>
      </div>

      <div className={styles.tools}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm thiết bị..." />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className={styles.filterSelect}>
          <option value="">Tất cả danh mục</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterSt} onChange={e => setFilterSt(e.target.value)} className={styles.filterSelect}>
          <option value="">Tất cả trạng thái</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {["Tên thiết bị", "Danh mục", "Khu vực", "Số lượng", "Trạng thái", "Hành động"].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} style={{ textAlign: "center", padding: 40 }}>Đang tải...</td></tr>}
            {!loading && displayed.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", padding: 40 }}>Chưa có thiết bị nào</td></tr>}
            {displayed.map((item) => {
              const st = statusStyle[item.Status] || statusStyle["Hoạt động"];
              return (
                <tr key={item.EquipmentID}>
                  <td style={{ fontWeight: 600, color: "var(--theme-text-dark)" }}>{item.Name}</td>
                  <td>
                    <span className={`${styles.pill} ${styles.pillCategory}`}>{item.Category || "—"}</span>
                  </td>
                  <td style={{ color: "var(--theme-text)" }}>{item.Zone || "—"}</td>
                  <td style={{ fontWeight: 700, color: "var(--theme-text-dark)" }}>{item.Quantity}</td>
                  <td>
                    <span className={`${styles.pill} ${st.class}`}>
                      {st.icon} {item.Status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button onClick={() => openEdit(item)} className={`${styles.btnIcon} ${styles.btnEdit}`} title="Sửa"><Edit size={16}/></button>
                      <button onClick={() => handleDelete(item.EquipmentID)} className={`${styles.btnIcon} ${styles.btnDanger}`} title="Xóa"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>
              {editing ? "✏️ Sửa thiết bị" : "➕ Thêm thiết bị mới"}
            </h2>
            <form onSubmit={handleSave} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Tên thiết bị *</label>
                <input type="text" required value={form.Name} onChange={e => setForm(p => ({ ...p, Name: e.target.value }))} />
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Khu vực</label>
                  <input type="text" value={form.Zone} onChange={e => setForm(p => ({ ...p, Zone: e.target.value }))} />
                </div>
                <div className={styles.formGroup}>
                  <label>Số lượng</label>
                  <input type="number" min="0" value={form.Quantity} onChange={e => setForm(p => ({ ...p, Quantity: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Danh mục</label>
                  <select value={form.Category} onChange={e => setForm(p => ({ ...p, Category: e.target.value }))}>
                    <option value="">-- Chọn --</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Trạng thái</label>
                  <select value={form.Status} onChange={e => setForm(p => ({ ...p, Status: e.target.value }))}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.formActions}>
                <button type="button" onClick={() => setModalOpen(false)} className={styles.btnGhost}>Hủy</button>
                <button type="submit" disabled={saving} className={styles.btnPrimary}>
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
