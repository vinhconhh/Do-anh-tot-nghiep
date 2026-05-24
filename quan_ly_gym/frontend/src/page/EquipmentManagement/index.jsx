import { useState, useEffect } from "react";
import api from "../../api/axiosClient";
import { Plus, Edit, Trash2, Search, Filter, Dumbbell, AlertTriangle, CheckCircle2, Wrench, Loader2 } from "lucide-react";
import Modal from "../../components/Modal";
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
  const [formError, setFormError] = useState("");

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

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setFormError(""); setModalOpen(true); };
  const openEdit   = (item) => {
    setEditing(item);
    setForm({ Name: item.Name, Category: item.Category || "", Zone: item.Zone || "", Quantity: item.Quantity ?? 1, Status: item.Status || "Hoạt động" });
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); 
    if (!form.Name.trim()) { setFormError("Vui lòng nhập tên thiết bị."); return; }
    setSaving(true);
    setFormError("");
    try {
      if (editing) await api.put(`/equipment/${editing.EquipmentID}`, form);
      else         await api.post("/equipment", form);
      setModalOpen(false); fetchItems();
    } catch (e) { 
      setFormError(e?.response?.data?.detail || "Lưu thất bại!"); 
    }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Thiết bị này sẽ bị xóa khỏi danh sách. Xác nhận xóa?")) return;
    try { await api.delete(`/equipment/${id}`); fetchItems(); }
    catch (e) { alert(e?.response?.data?.detail || "Xóa thất bại!"); }
  };

  const stats = {
    total: items.length,
    active: items.filter(i => i.Status === "Hoạt động").length,
    maintenance: items.filter(i => i.Status === "Đang bảo trì").length,
    broken: items.filter(i => i.Status === "Hỏng").length,
  };

  const displayed = items.filter(i => {
    const matchSearch = !search || i.Name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || filterCat === "all" || i.Category === filterCat;
    const matchSt = !filterSt || filterSt === "all" || i.Status === filterSt;
    return matchSearch && matchCat && matchSt;
  });

  return (
    <>
      <div className={styles.tab} />
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

      {/* Stat Cards */}
      <div className={styles.statGrid}>
        {[
          { label: "Tổng thiết bị", val: stats.total, color: "#4e73df" },
          { label: "Đang hoạt động", val: stats.active, color: "#1cc88a" },
          { label: "Bảo trì", val: stats.maintenance, color: "#f6c23e" },
          { label: "Bị hỏng", val: stats.broken, color: "#e74a3b" },
        ].map((s) => (
          <div key={s.label} className={styles.statCard} style={{ borderLeftColor: s.color }}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={styles.statVal} style={{ color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div className={styles.tools}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm thiết bị..." />
          {search && <button className={styles.clear} onClick={() => setSearch("")}>×</button>}
        </div>

        <div className={styles.filterGroup}>
          {["all", ...CATEGORIES].map((c) => (
            <button
              key={c}
              className={`${styles.filterBtn} ${(filterCat || "all") === c ? styles.filterActive : ""}`}
              onClick={() => setFilterCat(c)}
            >
              {c === "all" ? "Mọi danh mục" : c}
            </button>
          ))}
        </div>

        <div className={styles.filterGroup}>
          {["all", ...STATUSES].map((s) => (
            <button
              key={s}
              className={`${styles.filterBtn} ${(filterSt || "all") === s ? styles.filterActive : ""}`}
              onClick={() => setFilterSt(s)}
            >
              {s === "all" ? "Mọi trạng thái" : s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className={styles.emptyState}>
          <Loader2 size={32} className={styles.spinner} />
          <div>Đang tải thiết bị...</div>
        </div>
      ) : displayed.length === 0 ? (
        <div className={styles.emptyState}>
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>🏋️</div>
          <div style={{ fontSize: "1.3rem", marginBottom: 8 }}>Không tìm thấy thiết bị nào</div>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {["Tên thiết bị", "Danh mục", "Khu vực", "Số lượng", "Trạng thái", "Hành động"].map(h => (
                  <th key={h} className={h === "Hành động" || h === "Số lượng" ? styles.center : ""}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map((item) => {
                const st = statusStyle[item.Status] || statusStyle["Hoạt động"];
                return (
                  <tr key={item.EquipmentID}>
                    <td style={{ fontWeight: 600, color: "var(--theme-text-dark)" }}>{item.Name}</td>
                    <td>
                      <span className={`${styles.pill} ${styles.pillCategory}`}>{item.Category || "—"}</span>
                    </td>
                    <td style={{ color: "var(--theme-text)" }}>{item.Zone || "—"}</td>
                    <td className={styles.center} style={{ fontWeight: 700, color: "var(--theme-text-dark)" }}>{item.Quantity}</td>
                    <td>
                      <span className={`${styles.pill} ${st.class}`}>
                        {st.icon} {item.Status}
                      </span>
                    </td>
                    <td className={styles.center}>
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
      )}

      </div>

      <Modal
        isOpen={modalOpen}
        onRequestClose={() => setModalOpen(false)}
        title={editing ? "✏️ Sửa thiết bị" : "➕ Thêm thiết bị mới"}
      >
        <div className={styles.modalBody}>
          <div className={styles.formGrid}>
            <div className={`${styles.field} ${styles.span2}`}>
              <label>Tên thiết bị <span className={styles.required}>*</span></label>
              <input type="text" className={styles.input} placeholder="VD: Máy chạy bộ (Treadmill)" value={form.Name} onChange={e => setForm(p => ({ ...p, Name: e.target.value }))} />
            </div>
            <div className={styles.field}>
              <label>Khu vực</label>
              <input type="text" className={styles.input} placeholder="VD: Khu Cardio" value={form.Zone} onChange={e => setForm(p => ({ ...p, Zone: e.target.value }))} />
            </div>
            <div className={styles.field}>
              <label>Số lượng</label>
              <input type="number" min="0" className={styles.input} value={form.Quantity} onChange={e => setForm(p => ({ ...p, Quantity: parseInt(e.target.value) || 0 }))} />
            </div>

            <div className={styles.field}>
              <label>Danh mục</label>
              <select className={styles.input} value={form.Category} onChange={e => setForm(p => ({ ...p, Category: e.target.value }))}>
                <option value="">-- Chọn --</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label>Trạng thái</label>
              <select className={styles.input} value={form.Status} onChange={e => setForm(p => ({ ...p, Status: e.target.value }))}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {formError && <div className={styles.formError}>{formError}</div>}
        </div>
        <div className={styles.formActions}>
          <button type="button" onClick={() => setModalOpen(false)} className={styles.btnCancel}>Hủy</button>
          <button type="button" onClick={handleSave} disabled={saving} className={styles.btnSave}>{saving ? "Đang lưu..." : "💾 Lưu"}
          </button>
        </div>
      </Modal>
    </>
  );
}
