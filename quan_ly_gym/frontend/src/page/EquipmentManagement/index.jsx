import { useState, useEffect } from "react";
import api from "../../api/axiosClient";
import { Plus, Edit, Trash2, Search, Filter, Dumbbell, AlertTriangle, CheckCircle2, Wrench } from "lucide-react";

const CATEGORIES = ["Cardio", "Tạ máy", "Tạ tự do", "Thể lực", "Yoga", "Khác"];
const STATUSES   = ["Hoạt động", "Đang bảo trì", "Hỏng"];

const statusStyle = {
  "Hoạt động":    { bg: "#1cc88a22", color: "#1cc88a", icon: <CheckCircle2 size={12}/> },
  "Đang bảo trì": { bg: "#f6c23e22", color: "#f6c23e", icon: <Wrench size={12}/> },
  "Hỏng":         { bg: "#e74a3b22", color: "#e74a3b", icon: <AlertTriangle size={12}/> },
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
    <div style={{ padding: "24px", minHeight: "100vh", background: "#0f172a", color: "#e2e8f0" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#f8fafc", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <Dumbbell size={26} color="#36b9cc" /> Quản Lý Thiết Bị & Máy Tập
          </h1>
          <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: "0.9rem" }}>
            {items.length} thiết bị — {items.filter(i => i.Status === "Hoạt động").length} đang hoạt động
          </p>
        </div>
        <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,#36b9cc,#1a8a9c)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer", fontSize: "0.95rem" }}>
          <Plus size={18} /> Thêm Thiết Bị
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm thiết bị..."
            style={{ width: "100%", paddingLeft: 36, padding: "9px 12px 9px 36px", background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }} />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          style={{ padding: "9px 14px", background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", cursor: "pointer" }}>
          <option value="">Tất cả danh mục</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterSt} onChange={e => setFilterSt(e.target.value)}
          style={{ padding: "9px 14px", background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", cursor: "pointer" }}>
          <option value="">Tất cả trạng thái</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "#1e293b", borderRadius: 14, border: "1px solid #334155", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#0f172a" }}>
              {["Tên thiết bị", "Danh mục", "Khu vực", "Số lượng", "Trạng thái", "Hành động"].map(h => (
                <th key={h} style={{ padding: "13px 16px", textAlign: "left", fontSize: "0.8rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#64748b" }}>Đang tải...</td></tr>}
            {!loading && displayed.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#64748b" }}>Chưa có thiết bị nào</td></tr>}
            {displayed.map((item) => {
              const st = statusStyle[item.Status] || statusStyle["Hoạt động"];
              return (
                <tr key={item.EquipmentID} style={{ borderTop: "1px solid #1e2d3d" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#243044"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "13px 16px", fontWeight: 600, color: "#f1f5f9" }}>{item.Name}</td>
                  <td style={{ padding: "13px 16px" }}>
                    <span style={{ background: "#36b9cc22", color: "#36b9cc", padding: "3px 10px", borderRadius: 20, fontSize: "0.8rem", fontWeight: 600 }}>{item.Category || "—"}</span>
                  </td>
                  <td style={{ padding: "13px 16px", color: "#94a3b8" }}>{item.Zone || "—"}</td>
                  <td style={{ padding: "13px 16px", fontWeight: 700, color: "#f1f5f9", fontSize: "1.1rem" }}>{item.Quantity}</td>
                  <td style={{ padding: "13px 16px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: st.bg, color: st.color, padding: "4px 12px", borderRadius: 20, fontSize: "0.8rem", fontWeight: 600, border: `1px solid ${st.color}44` }}>
                      {st.icon} {item.Status}
                    </span>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => openEdit(item)} style={{ background: "#36b9cc22", color: "#36b9cc", border: "1px solid #36b9cc44", borderRadius: 7, padding: "6px 10px", cursor: "pointer" }}><Edit size={15}/></button>
                      <button onClick={() => handleDelete(item.EquipmentID)} style={{ background: "#e74a3b22", color: "#e74a3b", border: "1px solid #e74a3b44", borderRadius: 7, padding: "6px 10px", cursor: "pointer" }}><Trash2 size={15}/></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 16, padding: 28, width: "100%", maxWidth: 500, boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
            <h2 style={{ color: "#f8fafc", fontWeight: 800, marginBottom: 22, fontSize: "1.2rem" }}>
              {editing ? "✏️ Sửa thiết bị" : "➕ Thêm thiết bị mới"}
            </h2>
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Tên thiết bị *", key: "Name", type: "text", required: true },
                { label: "Khu vực", key: "Zone", type: "text" },
                { label: "Số lượng", key: "Quantity", type: "number" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ color: "#94a3b8", fontSize: "0.85rem", display: "block", marginBottom: 5 }}>{f.label}</label>
                  <input type={f.type} required={f.required} value={form[f.key]} min={f.type === "number" ? 0 : undefined}
                    onChange={e => setForm(p => ({ ...p, [f.key]: f.type === "number" ? parseInt(e.target.value) || 0 : e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", outline: "none", fontSize: "0.95rem", boxSizing: "border-box" }} />
                </div>
              ))}
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ color: "#94a3b8", fontSize: "0.85rem", display: "block", marginBottom: 5 }}>Danh mục</label>
                  <select value={form.Category} onChange={e => setForm(p => ({ ...p, Category: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }}>
                    <option value="">-- Chọn --</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ color: "#94a3b8", fontSize: "0.85rem", display: "block", marginBottom: 5 }}>Trạng thái</label>
                  <select value={form.Status} onChange={e => setForm(p => ({ ...p, Status: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setModalOpen(false)} style={{ padding: "9px 20px", background: "#334155", color: "#e2e8f0", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 600 }}>Hủy</button>
                <button type="submit" disabled={saving} style={{ padding: "9px 22px", background: "linear-gradient(135deg,#36b9cc,#1a8a9c)", color: "#fff", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 700 }}>
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
