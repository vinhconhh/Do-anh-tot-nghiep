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
        api.get(`/classes?date_filter=${classDate}`),
        api.get("/classes/member/my-enrollments"),
      ]);
      setClasses(Array.isArray(a.data) ? a.data : []);
      setMyClasses(Array.isArray(b.data) ? b.data : []);
    } catch { setClasses([]); setMyClasses([]); }
    finally { setClassLoading(false); }
  }, [classDate]);

  useEffect(() => { fetchPT(); }, [fetchPT]);
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
      await ptApi.create(modal.UserID, goal, note);
      alert("Đã gửi yêu cầu thuê PT!"); setModal(null); setGoal(""); setNote(""); fetchPT();
    } catch (e) { alert("Lỗi: " + (e.data?.detail || e.message)); }
    finally { setSending(false); }
  };

  const handleEnroll = async (classId) => {
    try { await api.post(`/classes/${classId}/enroll`); fetchClasses(); }
    catch (e) { alert("Lỗi: " + (e.response?.data?.detail || e.message)); }
  };

  const handleUnenroll = async (classId) => {
    if (!window.confirm("Hủy đăng ký lớp học này?")) return;
    try { await api.delete(`/classes/${classId}/enroll`); fetchClasses(); }
    catch (e) { alert("Lỗi: " + (e.response?.data?.detail || e.message)); }
  };

  if (loading) return <div className={styles.loadingState}><Loader2 className={styles.spinner}/><span>Đang tải...</span></div>;

  return (
    <>
      {/* Tabs */}
      <div className={styles.tabs}>
        {[
          { key: "browse",     icon: <UserCog size={16}/>,  label: "Tìm PT" },
          { key: "myRequests", icon: <Clock size={16}/>,    label: `Yêu cầu PT (${myReqs.length})` },
          { key: "classes",    icon: <Calendar size={16}/>, label: "Đăng ký Lớp học" },
          { key: "myClasses",  icon: <Users size={16}/>,    label: `Lớp của tôi (${myClasses.length})` },
        ].map(t => (
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
          <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
            <label style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Chọn ngày:</label>
            <input type="date" value={classDate} onChange={e => setClassDate(e.target.value)}
              style={{ padding: "8px 12px", background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", colorScheme: "dark" }}/>
          </div>
          {classLoading
            ? <div className={styles.loadingState}><Loader2 className={styles.spinner}/><span>Đang tải...</span></div>
            : classes.length === 0
              ? <div className={styles.empty} style={{ textAlign: "center", padding: 40 }}>Không có lớp học vào ngày này.</div>
              : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
                  {classes.map(c => {
                    const full = c.CurrentEnrolled >= c.MaxCapacity;
                    const pct = c.MaxCapacity > 0 ? Math.round(c.CurrentEnrolled / c.MaxCapacity * 100) : 0;
                    return (
                      <div key={c.ClassID} style={{ background: "#1e293b", border: `1px solid ${c.IsEnrolled ? "#1cc88a55" : "#334155"}`, borderRadius: 14, padding: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <strong style={{ color: "#f8fafc" }}>{c.Name}</strong>
                          {c.IsEnrolled && <span style={{ background: "#1cc88a22", color: "#1cc88a", padding: "2px 8px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 700 }}>✓ Đã đăng ký</span>}
                        </div>
                        <div style={{ color: "#94a3b8", fontSize: "0.82rem", marginBottom: 4 }}>🎓 {c.InstructorName || "Chưa phân công"}</div>
                        <div style={{ color: "#64748b", fontSize: "0.8rem", marginBottom: 4 }}>🕐 {fmtTime(c.StartTime)} – {fmtTime(c.EndTime)}</div>
                        <div style={{ color: "#64748b", fontSize: "0.8rem", marginBottom: 10 }}>📍 {c.StudioRoom || "—"} · {c.CurrentEnrolled}/{c.MaxCapacity} chỗ</div>
                        <div style={{ height: 4, background: "#334155", borderRadius: 4, marginBottom: 12, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: full ? "#e74a3b" : "#1cc88a" }}/>
                        </div>
                        {c.IsEnrolled
                          ? <button onClick={() => handleUnenroll(c.ClassID)} style={{ width: "100%", padding: "8px", background: "#e74a3b22", color: "#e74a3b", border: "1px solid #e74a3b44", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>Hủy đăng ký</button>
                          : <button onClick={() => handleEnroll(c.ClassID)} disabled={full} style={{ width: "100%", padding: "8px", background: full ? "#33415522" : "linear-gradient(135deg,#1cc88a,#17a673)", color: full ? "#475569" : "#fff", border: "none", borderRadius: 8, cursor: full ? "not-allowed" : "pointer", fontWeight: 700 }}>
                              {full ? "Đã đầy chỗ" : "Đăng ký tham gia"}
                            </button>
                        }
                      </div>
                    );
                  })}
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
                    <div style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: 4 }}>🎓 {c.InstructorName || "Chưa phân công"}</div>
                    <div style={{ color: "#64748b", fontSize: "0.8rem", marginBottom: 4 }}>
                      🕐 {new Date(c.StartTime).toLocaleDateString("vi-VN")} · {fmtTime(c.StartTime)} – {fmtTime(c.EndTime)}
                    </div>
                    <div style={{ color: "#64748b", fontSize: "0.8rem", marginBottom: 12 }}>📍 {c.StudioRoom || "—"} · Đăng ký: {c.EnrolledAt}</div>
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
