import { useState, useEffect } from "react";
import api from "../../api/axiosClient";
import { Plus, Edit, Trash2, Calendar, Users, Clock, UserCog, Eye } from "lucide-react";

const EMPTY_FORM = {
  Name: "", InstructorID: "", InstructorName: "", StudioRoom: "", MaxCapacity: 20,
  StartTime: "", EndTime: ""
};

function fmtDate(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function toInputLocal(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function GymClassManagement() {
  const [items, setItems]           = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modalOpen, setModalOpen]   = useState(false);
  const [membersModal, setMembersModal] = useState(null); // { class }
  const [classMembersData, setClassMembersData] = useState([]);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));
  const [viewAll, setViewAll]       = useState(false);
  const [saving, setSaving]         = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = viewAll
        ? await api.get("/classes/all")
        : await api.get(`/classes?date_filter=${dateFilter}`);
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch { setItems([]); }
    finally  { setLoading(false); }
  };

  const fetchInstructors = async () => {
    try {
      const res = await api.get("/classes/available-instructors");
      setInstructors(Array.isArray(res.data) ? res.data : []);
    } catch { setInstructors([]); }
  };

  useEffect(() => { fetchItems(); }, [dateFilter, viewAll]);
  useEffect(() => { fetchInstructors(); }, []);

  const openCreate = () => {
    setEditing(null);
    const today = new Date().toISOString().slice(0, 16);
    setForm({ ...EMPTY_FORM, StartTime: today, EndTime: today });
    setModalOpen(true);
  };
  const openEdit = (item) => {
    setEditing(item);
    setForm({
      Name: item.Name || "",
      InstructorID: item.InstructorID || "",
      InstructorName: item.InstructorName || "",
      StudioRoom: item.StudioRoom || "",
      MaxCapacity: item.MaxCapacity ?? 20,
      StartTime: toInputLocal(item.StartTime),
      EndTime: toInputLocal(item.EndTime),
    });
    setModalOpen(true);
  };

  const openMembers = async (item) => {
    setMembersModal(item);
    try {
      const res = await api.get(`/classes/${item.ClassID}/members`);
      setClassMembersData(Array.isArray(res.data) ? res.data : []);
    } catch { setClassMembersData([]); }
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    const payload = {
      ...form,
      MaxCapacity: parseInt(form.MaxCapacity) || 20,
      InstructorID: form.InstructorID ? parseInt(form.InstructorID) : null,
      StartTime: new Date(form.StartTime).toISOString(),
      EndTime: new Date(form.EndTime).toISOString()
    };
    try {
      if (editing) await api.put(`/classes/${editing.ClassID}`, payload);
      else         await api.post("/classes", payload);
      setModalOpen(false); fetchItems();
    } catch { alert("Lưu thất bại! Kiểm tra EndTime phải sau StartTime."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xác nhận xóa lớp học này?")) return;
    try { await api.delete(`/classes/${id}`); fetchItems(); }
    catch { alert("Xóa thất bại!"); }
  };

  const totalEnrolled = items.reduce((s, c) => s + (c.CurrentEnrolled || 0), 0);
  const totalCapacity = items.reduce((s, c) => s + (c.MaxCapacity || 0), 0);

  return (
    <div style={{ padding: "24px", minHeight: "100vh", background: "#0f172a", color: "#e2e8f0" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#f8fafc", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <Calendar size={26} color="#f6c23e" /> Quản Lý Lớp Học Nhóm
          </h1>
          <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: "0.9rem" }}>
            {items.length} lớp — {totalEnrolled}/{totalCapacity} học viên đăng ký
          </p>
        </div>
        <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,#f6c23e,#d4a017)", color: "#0f172a", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer" }}>
          <Plus size={18} /> Tạo Lớp Mới
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 22 }}>
        {[
          { label: "Lớp hiển thị", val: items.length, color: "#f6c23e", icon: <Calendar size={22}/> },
          { label: "Tổng học viên", val: `${totalEnrolled}/${totalCapacity}`, color: "#1cc88a", icon: <Users size={22}/> },
          { label: "Lớp đã đầy", val: items.filter(c => c.CurrentEnrolled >= c.MaxCapacity).length, color: "#e74a3b", icon: <Clock size={22}/> },
        ].map(c => (
          <div key={c.label} style={{ background: "#1e293b", borderRadius: 12, padding: "18px 20px", border: `1px solid ${c.color}33`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "#64748b", fontSize: "0.8rem", marginBottom: 4 }}>{c.label}</div>
              <div style={{ color: c.color, fontSize: "1.6rem", fontWeight: 800 }}>{c.val}</div>
            </div>
            <div style={{ color: c.color, opacity: 0.5 }}>{c.icon}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} disabled={viewAll}
          style={{ padding: "9px 14px", background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", cursor: viewAll ? "not-allowed" : "pointer", opacity: viewAll ? 0.5 : 1 }} />
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "#94a3b8", fontSize: "0.9rem" }}>
          <input type="checkbox" checked={viewAll} onChange={e => setViewAll(e.target.checked)} style={{ accentColor: "#f6c23e", width: 16, height: 16 }} />
          Xem tất cả lớp học
        </label>
      </div>

      {/* Table */}
      <div style={{ background: "#1e293b", borderRadius: 14, border: "1px solid #334155", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
          <thead>
            <tr style={{ background: "#0f172a" }}>
              {["Tên lớp", "Huấn luyện viên", "Phòng", "Bắt đầu", "Kết thúc", "Học viên", "Trạng thái", "Hành động"].map(h => (
                <th key={h} style={{ padding: "13px 16px", textAlign: "left", fontSize: "0.8rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#64748b" }}>Đang tải...</td></tr>}
            {!loading && items.length === 0 && <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#64748b" }}>Không có lớp học nào</td></tr>}
            {items.map((item) => {
              const full = item.CurrentEnrolled >= item.MaxCapacity;
              const pct  = item.MaxCapacity > 0 ? Math.round(item.CurrentEnrolled / item.MaxCapacity * 100) : 0;
              return (
                <tr key={item.ClassID} style={{ borderTop: "1px solid #1e2d3d" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#243044"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "13px 16px", fontWeight: 700, color: "#f1f5f9" }}>{item.Name}</td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(item.InstructorName || "?")}&background=4e73df&color=fff&size=28`}
                        alt="" style={{ width: 28, height: 28, borderRadius: "50%" }} />
                      <div>
                        <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: "0.88rem" }}>{item.InstructorName || "Chưa phân công"}</div>
                        {item.InstructorSpecialty && <div style={{ color: "#64748b", fontSize: "0.75rem" }}>{item.InstructorSpecialty}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <span style={{ background: "#f6c23e22", color: "#f6c23e", padding: "3px 10px", borderRadius: 20, fontSize: "0.78rem", fontWeight: 600 }}>{item.StudioRoom || "—"}</span>
                  </td>
                  <td style={{ padding: "13px 16px", color: "#e2e8f0", fontSize: "0.88rem", whiteSpace: "nowrap" }}>{fmtDate(item.StartTime)}</td>
                  <td style={{ padding: "13px 16px", color: "#e2e8f0", fontSize: "0.88rem", whiteSpace: "nowrap" }}>{fmtDate(item.EndTime)}</td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 700, color: full ? "#e74a3b" : "#1cc88a" }}>{item.CurrentEnrolled}/{item.MaxCapacity}</span>
                      <div style={{ width: 50, height: 5, background: "#334155", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: full ? "#e74a3b" : "#1cc88a", transition: "width 0.3s" }}/>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: "0.78rem", fontWeight: 600, background: full ? "#e74a3b22" : "#1cc88a22", color: full ? "#e74a3b" : "#1cc88a", border: `1px solid ${full ? "#e74a3b" : "#1cc88a"}44` }}>
                      {full ? "Đã đầy" : `Còn ${item.AvailableSlots} chỗ`}
                    </span>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => openMembers(item)} title="Xem học viên" style={{ background: "#4e73df22", color: "#a5b4fc", border: "1px solid #4e73df44", borderRadius: 7, padding: "6px 10px", cursor: "pointer" }}><Eye size={14}/></button>
                      <button onClick={() => openEdit(item)} style={{ background: "#36b9cc22", color: "#36b9cc", border: "1px solid #36b9cc44", borderRadius: 7, padding: "6px 10px", cursor: "pointer" }}><Edit size={14}/></button>
                      <button onClick={() => handleDelete(item.ClassID)} style={{ background: "#e74a3b22", color: "#e74a3b", border: "1px solid #e74a3b44", borderRadius: 7, padding: "6px 10px", cursor: "pointer" }}><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 16, padding: 28, width: "100%", maxWidth: 560, boxShadow: "0 25px 50px rgba(0,0,0,0.5)", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ color: "#f8fafc", fontWeight: 800, marginBottom: 22, fontSize: "1.2rem" }}>
              {editing ? "✏️ Sửa lớp học" : "➕ Tạo lớp học mới"}
            </h2>
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ color: "#94a3b8", fontSize: "0.85rem", display: "block", marginBottom: 5 }}>Tên lớp học *</label>
                <input required value={form.Name} onChange={e => setForm(p => ({ ...p, Name: e.target.value }))}
                  placeholder="Yoga, Zumba, Pilates..."
                  style={{ width: "100%", padding: "9px 12px", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", outline: "none", boxSizing: "border-box" }} />
              </div>

              {/* Instructor Dropdown */}
              <div>
                <label style={{ color: "#94a3b8", fontSize: "0.85rem", display: "block", marginBottom: 5 }}>
                  <UserCog size={13} style={{ display: "inline", marginRight: 4 }} />Huấn luyện viên (PT)
                </label>
                <select value={form.InstructorID} onChange={e => setForm(p => ({ ...p, InstructorID: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", boxSizing: "border-box" }}>
                  <option value="">-- Chưa phân công --</option>
                  {instructors.map(pt => (
                    <option key={pt.UserID} value={pt.UserID}>
                      {pt.FullName}{pt.Specialty ? ` — ${pt.Specialty}` : ""} ({pt.Score}đ)
                    </option>
                  ))}
                </select>
                {!form.InstructorID && (
                  <div style={{ marginTop: 6 }}>
                    <input value={form.InstructorName} onChange={e => setForm(p => ({ ...p, InstructorName: e.target.value }))}
                      placeholder="Hoặc nhập tên HLV bên ngoài..."
                      style={{ width: "100%", padding: "9px 12px", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", outline: "none", boxSizing: "border-box", fontSize: "0.88rem" }} />
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ color: "#94a3b8", fontSize: "0.85rem", display: "block", marginBottom: 5 }}>Phòng tập</label>
                  <input value={form.StudioRoom} placeholder="Studio 1, Studio 2..." onChange={e => setForm(p => ({ ...p, StudioRoom: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ color: "#94a3b8", fontSize: "0.85rem", display: "block", marginBottom: 5 }}>Sức chứa tối đa</label>
                  <input type="number" min="1" value={form.MaxCapacity} onChange={e => setForm(p => ({ ...p, MaxCapacity: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                {[{ label: "Giờ bắt đầu *", key: "StartTime" }, { label: "Giờ kết thúc *", key: "EndTime" }].map(f => (
                  <div key={f.key} style={{ flex: 1 }}>
                    <label style={{ color: "#94a3b8", fontSize: "0.85rem", display: "block", marginBottom: 5 }}>{f.label}</label>
                    <input required type="datetime-local" value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      style={{ width: "100%", padding: "9px 12px", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", outline: "none", boxSizing: "border-box", colorScheme: "dark" }} />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setModalOpen(false)} style={{ padding: "9px 20px", background: "#334155", color: "#e2e8f0", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 600 }}>Hủy</button>
                <button type="submit" disabled={saving} style={{ padding: "9px 22px", background: "linear-gradient(135deg,#f6c23e,#d4a017)", color: "#0f172a", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 700 }}>
                  {saving ? "Đang lưu..." : "💾 Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {membersModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 16, padding: 28, width: "100%", maxWidth: 600, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ color: "#f8fafc", fontWeight: 800, fontSize: "1.1rem", margin: 0 }}>
                👥 Học viên lớp: <span style={{ color: "#f6c23e" }}>{membersModal.Name}</span>
              </h2>
              <button onClick={() => setMembersModal(null)} style={{ background: "#334155", color: "#e2e8f0", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}>Đóng</button>
            </div>
            {classMembersData.length === 0 ? (
              <div style={{ textAlign: "center", padding: 30, color: "#64748b" }}>Chưa có học viên nào đăng ký</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#0f172a" }}>
                    {["#", "Họ tên", "Email", "Đăng ký lúc"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "0.78rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {classMembersData.map((m, idx) => (
                    <tr key={m.EnrollID} style={{ borderTop: "1px solid #1e2d3d" }}>
                      <td style={{ padding: "10px 14px", color: "#64748b", fontSize: "0.85rem" }}>{idx + 1}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(m.FullName)}&background=1cc88a&color=fff&size=26`}
                            alt="" style={{ width: 26, height: 26, borderRadius: "50%" }} />
                          <strong style={{ color: "#f1f5f9", fontSize: "0.9rem" }}>{m.FullName}</strong>
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px", color: "#94a3b8", fontSize: "0.85rem" }}>{m.Email}</td>
                      <td style={{ padding: "10px 14px", color: "#64748b", fontSize: "0.82rem" }}>{m.EnrolledAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
