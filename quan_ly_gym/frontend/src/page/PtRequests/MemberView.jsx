import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, UserCog, Clock, Send, Award, Star, Loader2, Calendar, Users } from "lucide-react";
import styles from "./PtRequests.module.scss";
import { usePtRequestsApi } from "../../api/ptRequestsApi";
import api from "../../api/axiosClient";

const STATUS_META = {
  pending:  { label: "Chờ duyệt",  cls: "pillPending" },
  approved: { label: "Đã duyệt",   cls: "pillApproved" },
  rejected: { label: "Từ chối",    cls: "pillRejected" },
  expired:  { label: "Quá hạn",    cls: "pillExpired" },
};

function timeLeft(expiresAt) {
  if (!expiresAt) return "";
  const diff = new Date(expiresAt) - new Date();
  if (diff <= 0) return "Hết hạn";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h >= 24 ? `${Math.floor(h/24)}d ${h%24}h` : `${h}h ${m}m`;
}

function fmtTime(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export default function MemberView() {
  const ptApi = usePtRequestsApi();
  const [tab, setTab] = useState("browse");
  const [pts, setPts] = useState([]);
  const [myReqs, setMyReqs] = useState([]);
  const [classes, setClasses] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classLoading, setClassLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [goal, setGoal] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [q, setQ] = useState("");
  const [classDate, setClassDate] = useState(new Date().toISOString().slice(0, 10));
  const [experienceLevel, setExperienceLevel] = useState("new");
  const [bodyNote, setBodyNote] = useState("");

  // Check if member has an approved PT
  const hasApprovedPT = useMemo(
    () => myReqs.some(r => r.status === "approved"),
    [myReqs]
  );

  const fetchPT = useCallback(async () => {
    setLoading(true);
    try {
      const [a, b] = await Promise.all([ptApi.getAvailablePTs(), ptApi.getMyRequests()]);
      setPts(a); setMyReqs(b);
    } catch {}
    finally { setLoading(false); }
  }, [ptApi]);

  const fetchClasses = useCallback(async () => {
    setClassLoading(true);
    try {
      const [a, b] = await Promise.all([
        api.get("/classes?show_all=true"),
        api.get("/classes/member/my-enrollments"),
      ]);
      setClasses(Array.isArray(a.data) ? a.data : []);
      setMyClasses(Array.isArray(b.data) ? b.data : []);
    } catch { setClasses([]); setMyClasses([]); }
    finally { setClassLoading(false); }
  }, [classDate]);

  useEffect(() => { fetchPT(); }, [fetchPT]);

  // Switch default tab to classes when PT is approved and still on browse
  useEffect(() => {
    if (hasApprovedPT && tab === "browse") {
      setTab("classes");
    }
  }, [hasApprovedPT, tab]);

  useEffect(() => {
    if (tab === "classes" || tab === "myClasses") fetchClasses();
  }, [tab, fetchClasses]);

  const filteredPts = useMemo(() => {
    if (!q) return pts;
    const lq = q.toLowerCase();
    return pts.filter(p => [p.hoTen, p.specialty, p.certifications].filter(Boolean).join(" ").toLowerCase().includes(lq));
  }, [pts, q]);

  const handleSend = async () => {
    if (!modal) return; setSending(true);
    try {
      await ptApi.create(modal.UserID, goal, note, experienceLevel, bodyNote);
      alert("Đã gửi yêu cầu thuê PT!"); setModal(null); setGoal(""); setNote(""); setExperienceLevel("new"); setBodyNote(""); fetchPT();
    } catch (e) { alert("Lỗi: " + (e.data?.detail || e.message)); }
    finally { setSending(false); }
  };

  const handleEnroll = async (classId, className) => {
    if (!window.confirm(`Bạn muốn đăng ký lớp "${className}"?\nYêu cầu sẽ được gửi để HLV/Manager duyệt.`)) return;
    try {
      await api.post(`/classes/${classId}/enroll`);
      alert("Đã gửi yêu cầu đăng ký! Vui lòng chờ HLV/Manager duyệt.");
      fetchClasses();
    }
    catch (e) { alert("Lỗi: " + (e.response?.data?.detail || e.message)); }
  };

  const handleUnenroll = async (classId) => {
    if (!window.confirm("Hủy đăng ký lớp học này?")) return;
    try { await api.delete(`/classes/${classId}/enroll`); fetchClasses(); }
    catch (e) { alert("Lỗi: " + (e.response?.data?.detail || e.message)); }
  };

  if (loading) return <div className={styles.loadingState}><Loader2 className={styles.spinner}/><span>Đang tải...</span></div>;

  // Build tabs dynamically: hide "Tìm PT" if member already has approved PT
  const allTabs = [
    ...(!hasApprovedPT ? [{ key: "browse", icon: <UserCog size={16}/>, label: "Tìm PT" }] : []),
    { key: "myRequests", icon: <Clock size={16}/>,    label: `Yêu cầu PT (${myReqs.length})` },
    { key: "classes",    icon: <Calendar size={16}/>, label: "Đăng ký Lớp học" },
    { key: "myClasses",  icon: <Users size={16}/>,    label: `Lớp của tôi (${myClasses.length})` },
  ];

  return (
    <>
      {/* Tabs */}
      <div className={styles.tabs}>
        {allTabs.map(t => (
          <button key={t.key} className={`${styles.tabBtn} ${tab === t.key ? styles.tabActive : ""}`} onClick={() => setTab(t.key)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Browse PT */}
      {tab === "browse" && (
        <>
          <div className={styles.searchBox}>
            <Search className={styles.searchIcon} size={16}/>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm theo tên, chuyên môn..."/>
          </div>
          <div className={styles.ptGrid}>
            {filteredPts.map(p => (
              <div key={p.UserID} className={styles.ptCard}>
                <div className={styles.ptAvatar}>
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.hoTen)}&background=4e73df&color=fff&size=80`} alt={p.hoTen}/>
                </div>
                <h3 className={styles.ptName}>{p.hoTen}</h3>
                <div className={styles.ptSpecialty}>{p.specialty || "Đa năng"}</div>
                <div className={styles.ptMeta}>
                  <span><Award size={14}/> {p.totalScore} điểm</span>
                  <span><Star size={14}/> {p.experienceYears} năm KN</span>
                </div>
                <div className={styles.ptCerts}>{p.certifications || ""}</div>
                <div className={styles.ptRate}>Tỷ lệ phản hồi: <strong>{p.responseRate}%</strong></div>
                <button className={styles.btnPrimary} onClick={() => setModal(p)}>
                  <Send size={14}/> Gửi yêu cầu
                </button>
              </div>
            ))}
            {filteredPts.length === 0 && <div className={styles.empty}>Không tìm thấy PT.</div>}
          </div>
        </>
      )}

      {/* My PT requests */}
      {tab === "myRequests" && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Mã</th><th>PT</th><th>Nhu cầu</th><th>Trạng thái</th><th>Hạn chờ</th></tr></thead>
            <tbody>
              {myReqs.length === 0 && <tr><td colSpan={5} className={styles.empty}>Chưa có yêu cầu nào.</td></tr>}
              {myReqs.map(r => {
                const meta = STATUS_META[r.status] || STATUS_META.pending;
                return (
                  <tr key={r.id}>
                    <td><strong>#{r.id}</strong><div className={styles.muted}>{r.createdAt}</div></td>
                    <td><strong>{r.ptName}</strong><div className={styles.muted}>{r.ptSpecialty}</div></td>
                    <td>{r.memberGoal || "—"}</td>
                    <td><span className={`${styles.pill} ${styles[meta.cls]}`}>{meta.label}</span></td>
                    <td>{r.status === "pending" ? <span className={styles.countdown}><Clock size={14}/> {timeLeft(r.expiresAt)}</span> : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Browse Classes */}
      {tab === "classes" && (
        <>
          {classLoading
            ? <div className={styles.loadingState}><Loader2 className={styles.spinner}/><span>Đang tải...</span></div>
            : classes.length === 0
              ? <div className={styles.empty} style={{ textAlign: "center", padding: 40 }}>Chưa có lớp học nào.</div>
              : <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Tên lớp</th>
                        <th>Huấn luyện viên</th>
                        <th>Ngày bắt đầu</th>
                        <th>Ngày kết thúc</th>
                        <th>Giờ tập</th>
                        <th>Lịch tuần</th>
                        <th>Sĩ số</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {classes.map(c => {
                        const dayMap = { 0: "T2", 1: "T3", 2: "T4", 3: "T5", 4: "T6", 5: "T7", 6: "CN" };
                        const daysLabel = c.RecurringDays ? c.RecurringDays.split(",").map(d => dayMap[d] || d).join(", ") : "—";
                        const startDate = c.RecurringStartDate || (c.StartTime ? c.StartTime.slice(0, 10) : "—");
                        const endDate = c.RecurringEndDate || (c.EndTime ? c.EndTime.slice(0, 10) : "—");
                        const timeStr = c.StartTime
                          ? `${fmtTime(c.StartTime)} – ${fmtTime(c.EndTime)}`
                          : "—";
                        const full = c.CurrentEnrolled >= c.MaxCapacity;
                        return (
                          <tr key={c.ClassID}>
                            <td>
                              <strong>{c.Name}</strong>
                              {c.Intensity === "high" && <span style={{ marginLeft: 6, color: "#e74a3b", fontSize: "0.9rem" }}>🔴 Cao</span>}
                              {c.Intensity === "medium" && <span style={{ marginLeft: 6, color: "#f6c23e", fontSize: "0.9rem" }}>🟡 TB</span>}
                              {c.Intensity === "low" && <span style={{ marginLeft: 6, color: "#1cc88a", fontSize: "0.9rem" }}>🟢 Thấp</span>}
                            </td>
                            <td>{c.InstructorName || "Chưa phân công"}</td>
                            <td>{startDate}</td>
                            <td>{endDate}</td>
                            <td>{timeStr}</td>
                            <td><span style={{ color: "#36b9cc", fontWeight: 600 }}>{daysLabel}</span></td>
                            <td>{c.CurrentEnrolled}/{c.MaxCapacity}</td>
                            <td>
                              {c.EnrollmentStatus === "Active"
                                ? <button disabled style={{ padding: "6px 14px", background: "#1cc88a22", color: "#1cc88a", border: "1px solid #1cc88a44", borderRadius: 8, fontWeight: 700, fontSize: "1.1rem", cursor: "default" }}>✓ Đã đăng ký</button>
                                : c.EnrollmentStatus === "Pending"
                                  ? <button disabled style={{ padding: "6px 14px", background: "#f6c23e22", color: "#f6c23e", border: "1px solid #f6c23e44", borderRadius: 8, fontWeight: 700, fontSize: "1.1rem", cursor: "default" }}>⏳ Chờ duyệt</button>
                                  : <button onClick={() => handleEnroll(c.ClassID, c.Name)} disabled={full} style={{ padding: "6px 14px", background: full ? "#33415522" : "linear-gradient(135deg,#1cc88a,#17a673)", color: full ? "#475569" : "#fff", border: "none", borderRadius: 8, cursor: full ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "1.1rem" }}>
                                      {full ? "Đầy" : "Đăng ký"}
                                    </button>
                              }
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
          }
        </>
      )}

      {/* My enrolled classes */}
      {tab === "myClasses" && (
        classLoading
          ? <div className={styles.loadingState}><Loader2 className={styles.spinner}/><span>Đang tải...</span></div>
          : myClasses.length === 0
            ? <div className={styles.empty} style={{ textAlign: "center", padding: 40 }}>Bạn chưa đăng ký lớp học nào.</div>
            : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
                {myClasses.map(c => (
                  <div key={c.ClassID} style={{ background: "#1e293b", border: "1px solid #1cc88a33", borderRadius: 14, padding: 20 }}>
                    <strong style={{ color: "#f8fafc", display: "block", marginBottom: 8 }}>{c.Name}</strong>
                    <div style={{ color: "#94a3b8", fontSize: "1.1rem", marginBottom: 4 }}>🎓 {c.InstructorName || "Chưa phân công"}</div>
                    <div style={{ color: "#64748b", fontSize: "1.0rem", marginBottom: 4 }}>
                      🕐 {new Date(c.StartTime).toLocaleDateString("vi-VN")} · {fmtTime(c.StartTime)} – {fmtTime(c.EndTime)}
                    </div>
                    <div style={{ color: "#64748b", fontSize: "1.0rem", marginBottom: 12 }}>📍 {c.StudioRoom || "—"} · Đăng ký: {c.EnrolledAt}</div>
                    <button onClick={() => handleUnenroll(c.ClassID)} style={{ width: "100%", padding: "8px", background: "#e74a3b22", color: "#e74a3b", border: "1px solid #e74a3b44", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>
                      Hủy đăng ký
                    </button>
                  </div>
                ))}
              </div>
      )}

      {/* Modal PT request */}
      {modal && (
        <div className={styles.overlay} onClick={() => setModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Gửi yêu cầu thuê PT</h3>
            <div className={styles.modalPt}>
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(modal.hoTen)}&background=4e73df&color=fff&size=48`} alt=""/>
              <div><strong>{modal.hoTen}</strong><div className={styles.muted}>{modal.specialty}</div></div>
            </div>
            <label>Nhu cầu tập luyện</label>
            <textarea value={goal} onChange={e => setGoal(e.target.value)} placeholder="VD: Giảm mỡ, tăng cơ..." rows={3}/>

            <label>Trình độ tập luyện</label>
            <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              {[
                { value: "new", label: "🆕 Người mới", color: "#1cc88a" },
                { value: "experienced", label: "💪 Đã từng tập", color: "#36b9cc" },
                { value: "other", label: "📝 Khác", color: "#f6c23e" },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setExperienceLevel(opt.value)}
                  style={{
                    flex: 1, padding: "10px 8px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: "1.1rem",
                    background: experienceLevel === opt.value ? opt.color + "22" : "#0f172a",
                    color: experienceLevel === opt.value ? opt.color : "#64748b",
                    border: `2px solid ${experienceLevel === opt.value ? opt.color : "#334155"}`,
                    transition: "all 0.2s",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {experienceLevel === "other" && (
              <>
                <label>Mô tả tình trạng cơ thể</label>
                <textarea value={bodyNote} onChange={e => setBodyNote(e.target.value)}
                  placeholder="Mô tả tình trạng cơ thể, tiền sử chấn thương, bệnh lý..."
                  rows={3} />
              </>
            )}

            <label>Ghi chú thêm</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Thời gian ưa thích..." rows={2}/>
            <div className={styles.modalActions}>
              <button className={styles.btnGhost} onClick={() => setModal(null)}>Hủy</button>
              <button className={styles.btnPrimary} onClick={handleSend} disabled={sending}>
                {sending ? <Loader2 size={14} className={styles.spinner}/> : <Send size={14}/>} Gửi yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
