import { useMemo, useState, useEffect, useCallback, useContext } from "react";
import { Search, Check, X, UserRound, UserCog, Loader2, Star, Clock, Send, Award, Flame, Trophy } from "lucide-react";
import styles from "./PtRequests.module.scss";
import { usePtRequestsApi } from "../../api/ptRequestsApi";
import { AuthContext } from "../../context/AuthContext";

const STATUS_META = {
  pending: { label: "Chờ duyệt", cls: "pillPending" },
  approved: { label: "Đã duyệt", cls: "pillApproved" },
  rejected: { label: "Từ chối", cls: "pillRejected" },
  expired: { label: "Quá hạn", cls: "pillExpired" },
};

/* ════════════════ countdown helper ════════════════ */
function timeLeft(expiresAt) {
  if (!expiresAt) return "";
  const diff = new Date(expiresAt) - new Date();
  if (diff <= 0) return "Đã hết hạn";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${h}h ${m}m`;
}

/* ══════════════════════════════════════════════════════════
   MEMBER VIEW
   ══════════════════════════════════════════════════════════ */
function MemberView() {
  const api = usePtRequestsApi();
  const [tab, setTab] = useState("browse"); // browse | myRequests
  const [pts, setPts] = useState([]);
  const [myReqs, setMyReqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { pt }
  const [goal, setGoal] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [q, setQ] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ptList, reqList] = await Promise.all([api.getAvailablePTs(), api.getMyRequests()]);
      setPts(ptList);
      setMyReqs(reqList);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [api]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredPts = useMemo(() => {
    if (!q) return pts;
    const lq = q.toLowerCase();
    return pts.filter(p => [p.hoTen, p.specialty, p.certifications].filter(Boolean).join(" ").toLowerCase().includes(lq));
  }, [pts, q]);

  const handleSend = async () => {
    if (!modal) return;
    setSending(true);
    try {
      await api.create(modal.UserID, goal, note);
      alert("✅ Đã gửi yêu cầu thuê PT thành công!");
      setModal(null); setGoal(""); setNote("");
      fetchData();
    } catch (e) { alert("❌ " + (e.data?.detail || e.message)); }
    finally { setSending(false); }
  };

  if (loading) return <div className={styles.loadingState}><Loader2 className={styles.spinner} /><span>Đang tải...</span></div>;

  return (
    <>
      <div className={styles.tabs}>
        <button className={`${styles.tabBtn} ${tab === "browse" ? styles.tabActive : ""}`} onClick={() => setTab("browse")}>
          <UserCog size={16} /> Tìm PT phù hợp
        </button>
        <button className={`${styles.tabBtn} ${tab === "myRequests" ? styles.tabActive : ""}`} onClick={() => setTab("myRequests")}>
          <Clock size={16} /> Yêu cầu đã gửi ({myReqs.length})
        </button>
      </div>

      {tab === "browse" && (
        <>
          <div className={styles.searchBox}>
            <Search className={styles.searchIcon} size={16} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm theo tên, chuyên môn..." />
          </div>
          <div className={styles.ptGrid}>
            {filteredPts.map(p => (
              <div key={p.UserID} className={styles.ptCard}>
                <div className={styles.ptAvatar}>
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.hoTen)}&background=4e73df&color=fff&size=80`} alt={p.hoTen} />
                </div>
                <h3 className={styles.ptName}>{p.hoTen}</h3>
                <div className={styles.ptSpecialty}>{p.specialty || "Đa năng"}</div>
                <div className={styles.ptMeta}>
                  <span><Award size={14} /> {p.totalScore} điểm</span>
                  <span><Star size={14} /> {p.experienceYears} năm KN</span>
                </div>
                <div className={styles.ptCerts}>{p.certifications || ""}</div>
                <div className={styles.ptRate}>Tỷ lệ phản hồi: <strong>{p.responseRate}%</strong></div>
                <button className={styles.btnPrimary} onClick={() => setModal(p)}>
                  <Send size={14} /> Gửi yêu cầu
                </button>
              </div>
            ))}
            {filteredPts.length === 0 && <div className={styles.empty}>Không tìm thấy PT phù hợp.</div>}
          </div>
        </>
      )}

      {tab === "myRequests" && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Mã</th><th>PT</th><th>Nhu cầu</th><th>Trạng thái</th><th>Hạn chót</th></tr></thead>
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
                    <td>{r.status === "pending" ? <span className={styles.countdown}><Clock size={14} /> {timeLeft(r.expiresAt)}</span> : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal gửi yêu cầu */}
      {modal && (
        <div className={styles.overlay} onClick={() => setModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Gửi yêu cầu thuê PT</h3>
            <div className={styles.modalPt}>
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(modal.hoTen)}&background=4e73df&color=fff&size=48`} alt="" />
              <div><strong>{modal.hoTen}</strong><div className={styles.muted}>{modal.specialty}</div></div>
            </div>
            <label>Nhu cầu tập luyện</label>
            <textarea value={goal} onChange={e => setGoal(e.target.value)} placeholder="VD: Giảm mỡ, tăng cơ, chuẩn bị thi đấu..." rows={3} />
            <label>Ghi chú thêm</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Thời gian ưa thích, yêu cầu đặc biệt..." rows={2} />
            <div className={styles.modalActions}>
              <button className={styles.btnGhost} onClick={() => setModal(null)}>Hủy</button>
              <button className={styles.btnPrimary} onClick={handleSend} disabled={sending}>
                {sending ? <Loader2 size={14} className={styles.spinner} /> : <Send size={14} />} Gửi yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   PT VIEW
   ══════════════════════════════════════════════════════════ */
function PtView() {
  const api = usePtRequestsApi();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { setRows(await api.getIncoming()); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [api]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter(r => r.status === filter);
  }, [rows, filter]);

  // Stats
  const stats = useMemo(() => {
    const total = rows.length;
    const pending = rows.filter(r => r.status === "pending").length;
    const approved = rows.filter(r => r.status === "approved").length;
    const expired = rows.filter(r => r.status === "expired").length;
    return { total, pending, approved, expired };
  }, [rows]);

  const handleRespond = async (id, status) => {
    try {
      await api.respond(id, status);
      setRows(prev => prev.map(r => r.id === id ? { ...r, status, respondedAt: new Date().toISOString() } : r));
    } catch (e) { alert("❌ " + (e.data?.detail || e.message)); }
  };

  if (loading) return <div className={styles.loadingState}><Loader2 className={styles.spinner} /><span>Đang tải...</span></div>;

  return (
    <>
      <div className={styles.statsRow}>
        <div className={styles.statCard}><div className={styles.statNum}>{stats.total}</div><div className={styles.statLabel}>Tổng yêu cầu</div></div>
        <div className={`${styles.statCard} ${styles.statPending}`}><div className={styles.statNum}>{stats.pending}</div><div className={styles.statLabel}>Chờ duyệt</div></div>
        <div className={`${styles.statCard} ${styles.statApproved}`}><div className={styles.statNum}>{stats.approved}</div><div className={styles.statLabel}>Đã duyệt</div></div>
        <div className={`${styles.statCard} ${styles.statExpired}`}><div className={styles.statNum}>{stats.expired}</div><div className={styles.statLabel}>Quá hạn</div></div>
      </div>

      <div className={styles.filterGroup}>
        {["all", "pending", "approved", "rejected", "expired"].map(s => (
          <button key={s} className={`${styles.filterBtn} ${filter === s ? styles.filterActive : ""}`} onClick={() => setFilter(s)}>
            {{ all: "Tất cả", pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Từ chối", expired: "Quá hạn" }[s]}
          </button>
        ))}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr><th>Mã</th><th>Hội viên</th><th>Nhu cầu</th><th>Trạng thái</th><th>Hạn chót</th><th>Thao tác</th></tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={6} className={styles.empty}>Không có yêu cầu nào.</td></tr>}
            {filtered.map(r => {
              const meta = STATUS_META[r.status] || STATUS_META.pending;
              const urgent = r.status === "pending" && new Date(r.expiresAt) - new Date() < 86400000;
              return (
                <tr key={r.id} className={urgent ? styles.urgentRow : ""}>
                  <td><strong>#{r.id}</strong><div className={styles.muted}>{r.createdAt}</div></td>
                  <td><div className={styles.memberInfo}><UserRound size={14} /> <strong>{r.memberName}</strong></div><div className={styles.muted}>{r.memberGoal}</div></td>
                  <td>{r.note || r.memberGoal || "—"}</td>
                  <td><span className={`${styles.pill} ${styles[meta.cls]}`}>{meta.label}</span></td>
                  <td>{r.status === "pending" ? <span className={`${styles.countdown} ${urgent ? styles.urgentText : ""}`}><Clock size={14} /> {timeLeft(r.expiresAt)}</span> : "—"}</td>
                  <td>
                    <div className={styles.actions}>
                      {r.status === "pending" ? (
                        <>
                          <button className={styles.btnPrimary} onClick={() => handleRespond(r.id, "approved")}><Check size={16} /> Đồng ý</button>
                          <button className={styles.btnDanger} onClick={() => handleRespond(r.id, "rejected")}><X size={16} /> Từ chối</button>
                        </>
                      ) : <span className={styles.muted}>Đã xử lý</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   ADMIN / MANAGER VIEW
   ══════════════════════════════════════════════════════════ */
function AdminView() {
  const api = usePtRequestsApi();
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { setRows(await api.getAll()); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [api]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      const text = [r.id, r.note, r.memberName, r.memberGoal, r.ptName, r.ptSpecialty].filter(Boolean).join(" ").toLowerCase();
      const matchQ = !q || text.includes(q.toLowerCase());
      const matchStatus = filterStatus === "all" || r.status === filterStatus;
      return matchQ && matchStatus;
    });
  }, [rows, q, filterStatus]);

  const handleAssign = async (requestId) => {
    const ptId = prompt("Nhập UserID của PT mới:");
    if (!ptId) return;
    try {
      await api.assign(requestId, parseInt(ptId));
      alert("✅ Đã phân công PT mới!");
      fetchData();
    } catch (e) { alert("❌ " + (e.data?.detail || e.message)); }
  };

  if (loading) return <div className={styles.loadingState}><Loader2 className={styles.spinner} /><span>Đang tải...</span></div>;

  return (
    <>
      <div className={styles.tools}>
        <div className={styles.searchBox}>
          <Search className={styles.searchIcon} size={16} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm theo mã, hội viên, PT…" />
          {q && <button className={styles.clear} onClick={() => setQ("")}>×</button>}
        </div>
        <div className={styles.filterGroup}>
          {["all", "pending", "approved", "rejected", "expired"].map(s => (
            <button key={s} className={`${styles.filterBtn} ${filterStatus === s ? styles.filterActive : ""}`} onClick={() => setFilterStatus(s)}>
              {{ all: "Tất cả", pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Từ chối", expired: "Quá hạn" }[s]}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr><th>Request</th><th>Hội viên</th><th>Nhu cầu</th><th>PT phụ trách</th><th>Trạng thái</th><th>Hạn chót</th><th>Thao tác</th></tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={7} className={styles.empty}>Không có dữ liệu.</td></tr>}
            {filtered.map(r => {
              const meta = STATUS_META[r.status] || STATUS_META.pending;
              return (
                <tr key={r.id} className={r.status === "expired" ? styles.expiredRow : ""}>
                  <td><strong>#{r.id}</strong><div className={styles.muted}>{r.createdAt}</div></td>
                  <td><strong>{r.memberName}</strong></td>
                  <td>{r.memberGoal || "—"}</td>
                  <td>
                    <div><UserCog size={14} style={{ marginRight: 4 }} /><strong>{r.ptName}</strong></div>
                    <div className={styles.muted}>{r.ptSpecialty} · <Award size={12} /> {r.ptScore}đ</div>
                  </td>
                  <td><span className={`${styles.pill} ${styles[meta.cls]}`}>{meta.label}</span></td>
                  <td>{r.status === "pending" ? <span className={styles.countdown}><Clock size={14} /> {timeLeft(r.expiresAt)}</span> : "—"}</td>
                  <td>
                    <div className={styles.actions}>
                      {r.status === "expired" ? (
                        <button className={styles.btnPrimary} onClick={() => handleAssign(r.id)}><UserCog size={14} /> Phân công</button>
                      ) : (
                        <span className={styles.muted}>—</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */
export default function PtRequests() {
  const { user } = useContext(AuthContext) ?? {};
  const role = (user?.vaiTro || user?.role || "").toUpperCase();

  const title = {
    MEMBER: "Thuê huấn luyện viên",
    PT: "Yêu cầu thuê PT",
    ADMIN: "Quản lý yêu cầu thuê PT",
    MANAGER: "Quản lý yêu cầu thuê PT",
  }[role] || "Yêu cầu thuê PT";

  const subtitle = {
    MEMBER: "Tìm PT phù hợp với nhu cầu tập luyện của bạn và gửi yêu cầu thuê.",
    PT: "Xem và phản hồi các yêu cầu thuê PT từ hội viên.",
    ADMIN: "Quản lý tất cả yêu cầu thuê PT, phân công lại khi quá hạn.",
    MANAGER: "Quản lý tất cả yêu cầu thuê PT, phân công lại khi quá hạn.",
  }[role] || "";

  return (
    <>
      <div className={styles.tab} />
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.subtitle}>{subtitle}</p>
          </div>
        </div>

        {role === "MEMBER" && <MemberView />}
        {role === "PT" && <PtView />}
        {["ADMIN", "MANAGER"].includes(role) && <AdminView />}
      </div>
    </>
  );
}
