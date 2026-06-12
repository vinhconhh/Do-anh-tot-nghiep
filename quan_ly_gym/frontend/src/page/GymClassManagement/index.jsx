import { useState, useEffect } from "react";
import api from "../../api/axiosClient";
import { Plus, Edit, Trash2, Calendar, Users, Clock, Eye, Search, List } from "lucide-react";
import ClassFormModal from "./ClassFormModal";
import Modal from "../../components/Modal";
import styles from "./GymClassManagement.module.scss";

const EMPTY_FORM = {
  Name: "", InstructorID: "", InstructorName: "", StudioRoom: "", MaxCapacity: 20,
  StartTime: "", EndTime: "",
  Intensity: "medium",
  IsRecurring: 0, RecurringDays: "", RecurringStartDate: "", RecurringEndDate: "", TimeStart: "", TimeEnd: ""
};

function fmtDate(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function toInputLocal(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function GymClassManagement() {
  const [items, setItems] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [membersModal, setMembersModal] = useState(null);
  const [classMembersData, setClassMembersData] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));
  const [viewAll, setViewAll] = useState(false);
  const [saving, setSaving] = useState(false);
  const [conflictWarnings, setConflictWarnings] = useState([]);
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [childrenModal, setChildrenModal] = useState(null);
  const [classChildrenData, setClassChildrenData] = useState([]);

  const openChildren = async (item) => {
    setChildrenModal(item);
    try {
      const res = await api.get(`/classes/${item.ClassID}/children`);
      setClassChildrenData(Array.isArray(res.data) ? res.data : []);
    } catch { setClassChildrenData([]); }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get("/classes/all");
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch { setItems([]); }
    finally { setLoading(false); }
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
    const todayDate = new Date().toISOString().slice(0, 10);
    setForm({ ...EMPTY_FORM, StartTime: today, EndTime: today, RecurringStartDate: todayDate, RecurringEndDate: todayDate, TimeStart: "08:00", TimeEnd: "09:00" });
    setConflictWarnings([]);
    setModalOpen(true);
  };
  const openEdit = (item) => {
    setEditing(item);
    setConflictWarnings([]);
    setForm({
      Name: item.Name || "",
      InstructorID: item.InstructorID || "",
      InstructorName: item.InstructorName || "",
      StudioRoom: item.StudioRoom || "",
      MaxCapacity: item.MaxCapacity ?? 20,
      StartTime: toInputLocal(item.StartTime),
      EndTime: toInputLocal(item.EndTime),
      Intensity: item.Intensity || "medium",
      IsRecurring: 0,
    });
    setModalOpen(true);
  };
  const [pendingEnrollments, setPendingEnrollments] = useState([]);

  const openMembers = async (item) => {
    setMembersModal(item);
    try {
      const [res, pendRes] = await Promise.all([
        api.get(`/classes/${item.ClassID}/members`),
        api.get(`/classes/${item.ClassID}/pending-enrollments`),
      ]);
      setClassMembersData(Array.isArray(res.data) ? res.data : []);
      setPendingEnrollments(Array.isArray(pendRes.data) ? pendRes.data : []);
    } catch { setClassMembersData([]); setPendingEnrollments([]); }
  };

  const handleApprove = async (enrollId) => {
    try { await api.post(`/classes/enrollments/${enrollId}/approve`); openMembers(membersModal); fetchItems(); }
    catch (e) { alert("Lỗi: " + (e.response?.data?.detail || e.message)); }
  };
  const handleReject = async (enrollId) => {
    if (!window.confirm("Từ chối yêu cầu đăng ký này?")) return;
    try { await api.post(`/classes/enrollments/${enrollId}/reject`); openMembers(membersModal); }
    catch (e) { alert("Lỗi: " + (e.response?.data?.detail || e.message)); }
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setConflictWarnings([]);
    const payload = {
      ...form,
      MaxCapacity: parseInt(form.MaxCapacity) || 20,
      InstructorID: form.InstructorID ? parseInt(form.InstructorID) : null,
    };
    const isRecurring = !editing && form.RecurringDays && form.RecurringDays.length > 0;
    
    if (isRecurring) {
        if (!form.RecurringDays) {
            alert("Vui lòng chọn ít nhất 1 ngày trong tuần!");
            setSaving(false);
            return;
        }
        delete payload.StartTime;
        delete payload.EndTime;
        payload.IsRecurring = 1;
    } else {
        payload.StartTime = new Date(form.StartTime).toISOString();
        payload.EndTime = new Date(form.EndTime).toISOString();
    }

    try {
      let res;
      if (editing) {
          res = await api.put(`/classes/${editing.ClassID}`, payload);
      } else {
          res = await api.post("/classes", payload);
      }

      if (res.data?.conflicts && res.data.conflicts.length > 0) {
          setConflictWarnings(res.data.conflicts);
          if (res.data.created === 0 || res.data.updated === false) {
             setSaving(false);
             return;
          }
      }

      setModalOpen(false); fetchItems();
      if (childrenModal) openChildren(childrenModal);
    } catch (err) { 
        alert(err.response?.data?.detail || "Lưu thất bại! Kiểm tra thông tin."); 
    }
    finally { setSaving(false); }
  };

  const handleDelete = async (item) => {
    let url = `/classes/${item.ClassID}`;
    if (item.IsRecurring || item.ParentClassID) {
        if (!window.confirm("Lớp này nằm trong chuỗi lặp lại.\nXác nhận xóa TOÀN BỘ chuỗi lớp này?")) return;
        url += "?delete_all=true";
    } else {
        if (!window.confirm("Xác nhận xóa lớp học này?")) return;
    }

    try { 
      await api.delete(url); 
      fetchItems(); 
      if (childrenModal && (item.ClassID === childrenModal.ClassID || item.ParentClassID === childrenModal.ClassID)) {
        setChildrenModal(null);
      }
    }
    catch { alert("Xóa thất bại!"); }
  };

  const totalEnrolled = items.reduce((s, c) => s + (c.CurrentEnrolled || 0), 0);
  const totalCapacity = items.reduce((s, c) => s + (c.MaxCapacity || 0), 0);

  const filteredItems = items.filter(i => {
    const matchQ = !q || i.Name?.toLowerCase().includes(q.toLowerCase()) || i.InstructorName?.toLowerCase().includes(q.toLowerCase());
    const full = i.CurrentEnrolled >= i.MaxCapacity;
    const matchSt = filterStatus === "all" || (filterStatus === "full" ? full : !full);
    return matchQ && matchSt;
  });

  return (
    <>
      <div className={styles.tab} />
      <div className={styles.page}>
      {}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <Calendar size={26} color="#f6c23e" /> Quản Lý Lớp Học Nhóm
          </h1>
          <p className={styles.subtitle}>
            {items.length} lớp — {totalEnrolled}/{totalCapacity} học viên đăng ký
          </p>
        </div>
        <button onClick={openCreate} className={styles.btnWarning}>
          <Plus size={18} /> Tạo Lớp Mới
        </button>
      </div>

      {}
      <div className={styles.statGrid}>
        {[
          { label: "Lớp hiển thị", val: items.length, color: "#f6c23e", icon: <Calendar size={26} /> },
          { label: "Tổng học viên", val: `${totalEnrolled}/${totalCapacity}`, color: "#1cc88a", icon: <Users size={26} /> },
          { label: "Lớp đã đầy", val: items.filter(c => c.CurrentEnrolled >= c.MaxCapacity).length, color: "#e74a3b", icon: <Clock size={26} /> },
        ].map(c => (
          <div key={c.label} className={styles.statCard} style={{ borderLeft: `4px solid ${c.color}` }}>
            <div>
              <div className={styles.statLabel}>{c.label}</div>
              <div className={styles.statVal} style={{ color: c.color }}>{c.val}</div>
            </div>
            <div style={{ color: c.color, opacity: 0.5 }}>{c.icon}</div>
          </div>
        ))}
      </div>

      {}
      <div className={styles.tools}>
        <div className={styles.searchBox}>
          <Search className={styles.searchIcon} size={16} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tên lớp, HLV…"
          />
          {q && <button className={styles.clear} onClick={() => setQ("")}>×</button>}
        </div>

        <div className={styles.filterGroup}>
          {["all", "available", "full"].map((s) => (
            <button
              key={s}
              className={`${styles.filterBtn} ${filterStatus === s ? styles.filterActive : ""}`}
              onClick={() => setFilterStatus(s)}
            >
              {{ all: "Tất cả", available: "Còn chỗ", full: "Đã đầy" }[s]}
            </button>
          ))}
        </div>
      </div>

      {}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {["Tên lớp", "Huấn luyện viên", "Phòng", "Ngày bắt đầu", "Ngày kết thúc", "Giờ tập", "Học viên", "Hành động"].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--theme-text)" }}>Đang tải...</td></tr>}
            {!loading && filteredItems.length === 0 && <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--theme-text)" }}>Không có lớp học nào</td></tr>}
            {filteredItems.map((item) => {
              const full = item.CurrentEnrolled >= item.MaxCapacity;
              const pct = item.MaxCapacity > 0 ? Math.round(item.CurrentEnrolled / item.MaxCapacity * 100) : 0;
              const dayMap = { 0: "T2", 1: "T3", 2: "T4", 3: "T5", 4: "T6", 5: "T7", 6: "CN" };
              const daysLabel = item.RecurringDays
                ? item.RecurringDays.split(",").map(d => dayMap[d] || d).join(", ")
                : "";
              const startDate = item.RecurringStartDate || (item.StartTime ? item.StartTime.slice(0, 10) : "—");
              const endDate = item.RecurringEndDate || (item.EndTime ? item.EndTime.slice(0, 10) : "—");
              const timeLabel = item.StartTime
                ? `${new Date(item.StartTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} – ${new Date(item.EndTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`
                : "—";
              return (
                <tr key={item.ClassID}>
                  <td style={{ fontWeight: 700, color: "var(--theme-text-dark)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {item.Name}
                      {item.Intensity === "high" && <span className={styles.pillHigh}>🔴 Cao</span>}
                      {item.Intensity === "medium" && <span className={styles.pillMed}>🟡 TB</span>}
                      {item.Intensity === "low" && <span className={styles.pillLow}>🟢 Thấp</span>}
                    </div>
                    {daysLabel && <div style={{ fontSize: "1.3rem", color: "#36b9cc", marginTop: 4 }}>📅 {daysLabel}</div>}
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(item.InstructorName || "?")}&background=4e73df&color=fff&size=32`}
                        alt="" style={{ width: 32, height: 32, borderRadius: "50%" }} />
                      <div>
                        <div style={{ color: "var(--theme-text-dark)", fontWeight: 600, fontSize: "1.6rem" }}>{item.InstructorName || "Chưa phân công"}</div>
                        {item.InstructorSpecialty && <div style={{ color: "var(--theme-text)", fontSize: "1.4rem" }}>{item.InstructorSpecialty}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.pill} ${styles.pillRoom}`}>{item.StudioRoom || "—"}</span>
                  </td>
                  <td style={{ color: "var(--theme-text-dark)", whiteSpace: "nowrap" }}>{startDate}</td>
                  <td style={{ color: "var(--theme-text-dark)", whiteSpace: "nowrap" }}>{endDate}</td>
                  <td style={{ color: "var(--theme-text-dark)", whiteSpace: "nowrap" }}>{timeLabel}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 700, color: full ? "#e74a3b" : "#1cc88a", fontSize: "1.6rem" }}>{item.CurrentEnrolled}/{item.MaxCapacity}</span>
                      <div style={{ width: 60, height: 6, background: "var(--theme-bg)", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: full ? "#e74a3b" : "#1cc88a", transition: "width 0.3s" }} />
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      {(item.IsRecurring === 1 || item.IsRecurring === true) && (
                        <button onClick={() => openChildren(item)} title="Xem các buổi" className={`${styles.btnIcon} ${styles.btnView}`} style={{ background: "linear-gradient(135deg,#36b9cc,#2c9faf)" }}><List size={16} /></button>
                      )}
                      <button onClick={() => openMembers(item)} title="Xem học viên" className={`${styles.btnIcon} ${styles.btnView}`}><Eye size={16} /></button>
                      <button onClick={() => openEdit(item)} title="Sửa" className={`${styles.btnIcon} ${styles.btnEdit}`}><Edit size={16} /></button>
                      <button onClick={() => handleDelete(item)} title="Xóa" className={`${styles.btnIcon} ${styles.btnDanger}`}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {}


      {}
      <Modal
        isOpen={!!membersModal}
        onRequestClose={() => setMembersModal(null)}
        title={membersModal ? `👥 Học viên lớp: ${membersModal.Name}` : ""}
      >
        <div style={{ padding: "0 10px" }}>
            {}
            {pendingEnrollments.length > 0 && (
              <div className={styles.pendingBox}>
                <div className={styles.pendingTitle}>
                  ⏳ Yêu cầu chờ duyệt ({pendingEnrollments.length})
                </div>
                {pendingEnrollments.map(p => (
                  <div key={p.EnrollID} className={styles.pendingItem}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.FullName)}&background=f6c23e&color=fff&size=32`}
                        alt="" style={{ width: 32, height: 32, borderRadius: "50%" }} />
                      <div>
                        <strong style={{ color: "var(--theme-text-dark)", fontSize: "1.6rem" }}>{p.FullName}</strong>
                        <div style={{ color: "var(--theme-text)", fontSize: "1.4rem" }}>{p.Email} · {p.EnrolledAt}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => handleApprove(p.EnrollID)}
                        style={{ padding: "8px 14px", background: "#1cc88a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: "1.4rem" }}>✓ Duyệt</button>
                      <button onClick={() => handleReject(p.EnrollID)}
                        style={{ padding: "8px 14px", background: "#e74a3b22", color: "#e74a3b", border: "1px solid #e74a3b44", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: "1.4rem" }}>✕ Từ chối</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {}
            {classMembersData.length === 0 && pendingEnrollments.length === 0 ? (
              <div style={{ textAlign: "center", padding: 30, color: "var(--theme-text)", fontSize: "1.6rem" }}>Chưa có học viên nào đăng ký</div>
            ) : classMembersData.length > 0 && (
              <>
                <div className={styles.approvedTitle}>✓ Đã duyệt ({classMembersData.length})</div>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        {["#", "Họ tên", "Email", "Đăng ký lúc"].map(h => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {classMembersData.map((m, idx) => (
                        <tr key={m.EnrollID}>
                          <td style={{ color: "var(--theme-text)" }}>{idx + 1}</td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(m.FullName)}&background=1cc88a&color=fff&size=30`}
                                alt="" style={{ width: 30, height: 30, borderRadius: "50%" }} />
                              <strong style={{ color: "var(--theme-text-dark)", fontSize: "1.6rem" }}>{m.FullName}</strong>
                            </div>
                          </td>
                          <td style={{ color: "var(--theme-text)" }}>{m.Email}</td>
                          <td style={{ color: "var(--theme-text)" }}>{m.EnrolledAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </Modal>

      {/* MODAL DANH SÁCH LỚP CON */}
      <Modal
        isOpen={!!childrenModal}
        onRequestClose={() => setChildrenModal(null)}
        title={childrenModal ? `📋 Các buổi học của lớp: ${childrenModal.Name}` : ""}
        maxWidth="800px" width="90%"
      >
        <div style={{ padding: "0 10px" }}>
          {classChildrenData.length === 0 ? (
            <div style={{ textAlign: "center", padding: 30, color: "var(--theme-text)", fontSize: "1.6rem" }}>Không có buổi học nào</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Ngày tập</th>
                    <th>Giờ tập</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {classChildrenData.map((child, idx) => (
                    <tr key={child.ClassID}>
                      <td style={{ color: "var(--theme-text)" }}>{idx + 1}</td>
                      <td style={{ color: "var(--theme-text-dark)", fontWeight: 600 }}>{child.StartTime ? child.StartTime.slice(0, 10) : "—"}</td>
                      <td style={{ color: "var(--theme-text)" }}>
                        {child.StartTime ? new Date(child.StartTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "—"} – {child.EndTime ? new Date(child.EndTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button onClick={() => openEdit(child)} title="Sửa buổi học này" className={`${styles.btnIcon} ${styles.btnEdit}`}><Edit size={16} /></button>
                          <button onClick={() => handleDelete(child)} title="Xóa toàn chuỗi" className={`${styles.btnIcon} ${styles.btnDanger}`}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      {/* MODAL FORM LỚP HỌC (Đặt dưới cùng để luôn hiển thị trên cùng) */}
      {modalOpen && (
        <ClassFormModal
          form={form} setForm={setForm} editing={editing}
          instructors={instructors} saving={saving}
          conflictWarnings={conflictWarnings}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
      </div>
    </>
  );
}
