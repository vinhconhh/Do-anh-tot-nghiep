import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Ban,
  CheckCircle2,
  Trash2,
  Shield,
  GraduationCap,
  CalendarDays,
  Activity,
  MapPin,
} from "lucide-react";
import Modal from "../../components/Modal";
import styles from "./Trainers.module.scss";
import { useTrainersApi } from "../../api/trainersApi";

const STATUS_META = {
  active: { label: "Hoạt động", cls: "pillActive", icon: <CheckCircle2 size={14} /> },
  suspended: { label: "Tạm khóa", cls: "pillSuspended", icon: <Ban size={14} /> },
  inactive: { label: "Đã nghỉ", cls: "pillInactive", icon: <Ban size={14} /> },
};

const RANKS = ["Junior PT", "Senior PT", "Master PT"];

const EMPTY_FORM = {
  hoTen: "",
  tuoi: 0,
  gioiTinh: "Nam",
  email: "",
  sdt: "",
  avatarUrl: "",
  status: "active",
  rank: "Junior PT",
  expYears: 0,
  bio: "",
  specialtiesText: "",
};

function initialsOf(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function pct(n) {
  if (Number.isNaN(n) || n == null) return "—";
  return `${Math.round(n * 100)}%`;
}

export default function Trainers() {
  const api = useTrainersApi();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRank, setFilterRank] = useState("all");
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState("auth");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Load trainers from API
  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.list()
      .then((data) => {
        if (!alive) return;
        // Map API response fields to UI fields
        setRows(data.map((t) => ({
          ...t,
          id: t.UserID,
          hoTen: t.hoTen,
          email: t.email,
          status: t.isActive !== false ? "active" : "inactive",
          rank: t.certifications || "Junior PT",
          expYears: t.experienceYears || 0,
          specialties: t.specialty ? t.specialty.split(",").map((s) => s.trim()) : [],
          bio: "",
          auth: { lastLoginAt: "—", loginHistory: [] },
          auditLog: [],
          schedules: { fixedSlots: [], bookedSlots: [] },
          requests: [],
          assignedMembers: [],
          performance: { aiApprovalRate: 0, aiPlansReviewed: 0, rpeNotesCount: 0, sessionsCompleted: 0, sessionsPlanned: 0 },
          tracking: { checkins: [], completionRate: 0 },
        })));
      })
      .catch((err) => console.error("Trainers fetch error:", err))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const active = rows.filter((r) => r.status === "active").length;
    const suspended = rows.filter((r) => r.status === "suspended").length;
    const inactive = rows.filter((r) => r.status === "inactive").length;
    return {
      total: rows.length,
      active,
      suspended,
      inactive,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchQ =
        !q ||
        r.hoTen.toLowerCase().includes(q.toLowerCase()) ||
        r.email.toLowerCase().includes(q.toLowerCase()) ||
        (r.sdt || "").toLowerCase().includes(q.toLowerCase());
      const matchStatus = filterStatus === "all" || r.status === filterStatus;
      const matchRank = filterRank === "all" || r.rank === filterRank;
      return matchQ && matchStatus && matchRank;
    });
  }, [rows, q, filterStatus, filterRank]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, specialtiesText: "" });
    setEditing({});
  };

  const openEdit = (t) => {
    setForm({
      hoTen: t.hoTen || "",
      tuoi: t.tuoi ?? 0,
      gioiTinh: t.gioiTinh || "Nam",
      email: t.email || "",
      sdt: t.sdt || "",
      avatarUrl: t.avatarUrl || "",
      status: t.status || "active",
      rank: t.rank || "Junior PT",
      expYears: t.expYears ?? 0,
      bio: t.bio || "",
      specialtiesText: (t.specialties || []).join(", "),
    });
    setEditing(t);
  };

  const saveTrainer = async (e) => {
    e.preventDefault();
    setSaving(true);

    const specialties = (form.specialtiesText || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      if (editing?.UserID) {
        await api.update(editing.UserID, {
          hoTen: form.hoTen.trim(),
          email: form.email.trim(),
          isActive: form.status === "active" ? 1 : 0,
          experienceYears: Number(form.expYears) || 0,
          certifications: form.rank,
          specialty: specialties.join(", "),
        });
        setRows((prev) => prev.map((x) => x.id === editing.id ? { ...x, hoTen: form.hoTen, email: form.email, rank: form.rank, expYears: Number(form.expYears), specialties, status: form.status } : x));
      } else {
        const created = await api.create({
          hoTen: form.hoTen.trim(),
          email: form.email.trim(),
          matKhau: "PT@1234",
          experienceYears: Number(form.expYears) || 0,
          certifications: form.rank,
          specialty: specialties.join(", "),
        });
        setRows((prev) => [...prev, {
          ...created,
          id: created.UserID,
          status: "active",
          rank: form.rank,
          expYears: Number(form.expYears),
          specialties,
          bio: "",
          auth: { lastLoginAt: "—", loginHistory: [] },
          auditLog: [], schedules: { fixedSlots: [], bookedSlots: [] },
          requests: [], assignedMembers: [],
          performance: { aiApprovalRate: 0, aiPlansReviewed: 0, rpeNotesCount: 0, sessionsCompleted: 0, sessionsPlanned: 0 },
          tracking: { checkins: [], completionRate: 0 },
        }]);
      }
    } catch (err) {
      alert(err.message || "Lưu thất bại");
    } finally {
      setSaving(false);
      setEditing(null);
    }
  };

  const toggleSuspend = (t) => {
    const next = t.status === "suspended" ? "active" : "suspended";
    setRows((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: next } : x)));
    if (selected?.id === t.id) setSelected((s) => ({ ...s, status: next }));
  };

  const removeTrainer = async (t) => {
    if (!window.confirm(`Xóa PT "${t.hoTen}"?`)) return;
    try {
      await api.remove(t.UserID);
      setRows((prev) => prev.filter((x) => x.id !== t.id));
      if (selected?.id === t.id) setSelected(null);
    } catch (err) {
      alert(err.message || "Xóa thất bại");
    }
  };

  const openDetail = (t) => {
    setSelected(t);
    setActiveTab("auth");
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("selected", String(t.id));
      return next;
    });
  };

  const selectedFull = useMemo(() => {
    if (!selected) return null;
    return rows.find((x) => x.id === selected.id) || selected;
  }, [rows, selected]);

  useEffect(() => {
    const raw = searchParams.get("selected");
    if (!raw) return;
    const id = Number(raw);
    if (!id) return;
    const t = rows.find((x) => x.id === id);
    if (t) {
      setSelected(t);
      setActiveTab("auth");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, rows]);

  return (
    <>
      <div className={styles.tab} />
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Quản lý Huấn luyện viên</h2>
            <p className={styles.subtitle}>Thiết lập tài khoản, chuyên môn, lịch trình, hiệu suất AI và tracking vị trí.</p>
          </div>
          <button className={styles.btnPrimary} onClick={openCreate}>
            <Plus size={16} /> Thêm PT
          </button>
        </div>

        <div className={styles.statGrid}>
          <div className={styles.statCard} style={{ borderLeftColor: "#4e73df" }}>
            <div className={styles.statLabel}>Tổng PT</div>
            <div className={styles.statVal}>{stats.total}</div>
          </div>
          <div className={styles.statCard} style={{ borderLeftColor: "#1cc88a" }}>
            <div className={styles.statLabel}>Hoạt động</div>
            <div className={styles.statVal}>{stats.active}</div>
          </div>
          <div className={styles.statCard} style={{ borderLeftColor: "#f6c23e" }}>
            <div className={styles.statLabel}>Tạm khóa</div>
            <div className={styles.statVal}>{stats.suspended}</div>
          </div>
          <div className={styles.statCard} style={{ borderLeftColor: "#858796" }}>
            <div className={styles.statLabel}>Đã nghỉ</div>
            <div className={styles.statVal}>{stats.inactive}</div>
          </div>
        </div>

        <div className={styles.tools}>
          <div className={styles.searchBox}>
            <Search className={styles.searchIcon} size={16} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên, email, SĐT…" />
            {q && (
              <button className={styles.clear} onClick={() => setQ("")}>
                ×
              </button>
            )}
          </div>

          <div className={styles.filterGroup}>
            {["all", "active", "suspended", "inactive"].map((s) => (
              <button
                key={s}
                className={`${styles.filterBtn} ${filterStatus === s ? styles.filterActive : ""}`}
                onClick={() => setFilterStatus(s)}
              >
                {{ all: "Tất cả", active: "Hoạt động", suspended: "Tạm khóa", inactive: "Đã nghỉ" }[s]}
              </button>
            ))}
          </div>

          <div className={styles.filterGroup}>
            {["all", ...RANKS].map((r) => (
              <button
                key={r}
                className={`${styles.filterBtn} ${filterRank === r ? styles.filterActive : ""}`}
                onClick={() => setFilterRank(r)}
              >
                {r === "all" ? "Mọi hạng" : r}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>PT</th>
                <th>Trạng thái</th>
                <th>Hạng</th>
                <th>Chuyên môn</th>
                <th>Hội viên quản lý</th>
                <th>Hiệu suất</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 18, color: "#858796" }}>
                    Không có dữ liệu
                  </td>
                </tr>
              )}
              {filtered.map((t) => {
                const meta = STATUS_META[t.status] || STATUS_META.active;
                const assigned = t.assignedMembers?.length || 0;
                const perf = t.performance || {};
                const sessionRate =
                  perf.sessionsPlanned ? pct((perf.sessionsCompleted || 0) / perf.sessionsPlanned) : "—";
                return (
                  <tr key={t.id}>
                    <td>
                      <div className={styles.personCell}>
                        <div className={styles.avatar}>
                          {t.avatarUrl ? <img src={t.avatarUrl} alt={t.hoTen} /> : initialsOf(t.hoTen)}
                        </div>
                        <div>
                          <div className={styles.name}>{t.hoTen}</div>
                          <div className={styles.muted}>
                            {t.email} · {t.sdt} · {t.tuoi} tuổi · {t.gioiTinh}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.pill} ${styles[meta.cls]}`}>
                        {meta.icon} {meta.label}
                      </span>
                    </td>
                    <td>
                      <div className={styles.name} style={{ fontWeight: 700 }}>{t.rank}</div>
                      <div className={styles.muted}>{t.expYears} năm kinh nghiệm</div>
                    </td>
                    <td>
                      <div className={styles.chipWrap}>
                        {(t.specialties || []).slice(0, 4).map((s) => (
                          <span key={s} className={styles.chip}>{s}</span>
                        ))}
                        {(t.specialties || []).length > 4 && (
                          <span className={styles.muted}>+{(t.specialties || []).length - 4}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className={styles.name}>{assigned}</div>
                      <div className={styles.muted}>đang chăm sóc</div>
                    </td>
                    <td>
                      <div className={styles.name}>AI duyệt: {pct(perf.aiApprovalRate)}</div>
                      <div className={styles.muted}>Ca dạy: {sessionRate}</div>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.btnIcon} title="Xem chi tiết" onClick={() => openDetail(t)}>
                          <Eye size={15} />
                        </button>
                        <button className={styles.btnIcon} title="Sửa" onClick={() => openEdit(t)}>
                          <Pencil size={15} />
                        </button>
                        <button
                          className={`${styles.btnIcon} ${styles.btnWarn}`}
                          title={t.status === "suspended" ? "Mở khóa" : "Tạm khóa"}
                          onClick={() => toggleSuspend(t)}
                        >
                          <Ban size={15} />
                        </button>
                        <button className={`${styles.btnIcon} ${styles.btnDanger}`} title="Xóa" onClick={() => removeTrainer(t)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      <Modal
        isOpen={!!selectedFull}
        onRequestClose={() => setSelected(null)}
        title="Chi tiết Huấn luyện viên"
      >
        {selectedFull && (
          <div>
            <div className={styles.detailHeader}>
              <div>
                <h3 className={styles.detailTitle}>{selectedFull.hoTen}</h3>
                <div className={styles.muted}>{selectedFull.email} · {selectedFull.sdt}</div>
              </div>
              <div className={styles.detailMeta}>
                <span className={`${styles.pill} ${styles[(STATUS_META[selectedFull.status] || STATUS_META.active).cls]}`}>
                  {(STATUS_META[selectedFull.status] || STATUS_META.active).icon}{" "}
                  {(STATUS_META[selectedFull.status] || STATUS_META.active).label}
                </span>
                <span className={styles.chip}>{selectedFull.rank}</span>
                <button className={styles.btnGhost} onClick={() => openEdit(selectedFull)}>
                  <Pencil size={16} /> Sửa
                </button>
              </div>
            </div>

            <div className={styles.tabs}>
              {[
                { key: "auth", label: "Định danh & Bảo mật", icon: <Shield size={14} /> },
                { key: "spec", label: "Chuyên môn", icon: <GraduationCap size={14} /> },
                { key: "ops", label: "Lịch & Requests", icon: <CalendarDays size={14} /> },
                { key: "perf", label: "Hiệu suất & AI", icon: <Activity size={14} /> },
                { key: "track", label: "Tracking vị trí", icon: <MapPin size={14} /> },
              ].map((t) => (
                <button
                  key={t.key}
                  className={`${styles.tabBtn} ${activeTab === t.key ? styles.tabActive : ""}`}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {activeTab === "auth" && (
              <div className={styles.grid2}>
                <div className={styles.card}>
                  <div className={styles.cardTitle}>Thông tin định danh</div>
                  <div className={styles.kv}>
                    <div className={styles.k}>Họ tên</div><div className={styles.v}>{selectedFull.hoTen}</div>
                    <div className={styles.k}>Tuổi</div><div className={styles.v}>{selectedFull.tuoi || "—"}</div>
                    <div className={styles.k}>Giới tính</div><div className={styles.v}>{selectedFull.gioiTinh || "—"}</div>
                    <div className={styles.k}>Email</div><div className={styles.v}>{selectedFull.email}</div>
                    <div className={styles.k}>SĐT</div><div className={styles.v}>{selectedFull.sdt}</div>
                    <div className={styles.k}>Role</div><div className={styles.v}>{selectedFull.role || "PT"}</div>
                    <div className={styles.k}>Trạng thái</div><div className={styles.v}>{(STATUS_META[selectedFull.status] || STATUS_META.active).label}</div>
                  </div>
                </div>

                <div className={styles.card}>
                  <div className={styles.cardTitle}>Xác thực & Lịch sử đăng nhập</div>
                  <div className={styles.kv} style={{ marginBottom: 10 }}>
                    <div className={styles.k}>Mật khẩu</div><div className={styles.v}>Đã mã hóa</div>
                    <div className={styles.k}>Login gần nhất</div><div className={styles.v}>{selectedFull.auth?.lastLoginAt || "—"}</div>
                  </div>
                  <div className={styles.list}>
                    {(selectedFull.auth?.loginHistory || []).slice(0, 6).map((h, i) => (
                      <div key={i} className={styles.listItem}>
                        <div className={styles.liTitle}>{h.at}</div>
                        <div className={styles.liSub}>{h.device} · IP {h.ip}</div>
                      </div>
                    ))}
                    {(selectedFull.auth?.loginHistory || []).length === 0 && (
                      <div className={styles.muted}>Chưa có dữ liệu đăng nhập.</div>
                    )}
                  </div>
                </div>

                <div className={styles.card} style={{ gridColumn: "1 / -1" }}>
                  <div className={styles.cardTitle}>Audit Log (minh bạch thao tác)</div>
                  <div className={styles.list}>
                    {(selectedFull.auditLog || []).slice(0, 10).map((a, i) => (
                      <div key={i} className={styles.listItem}>
                        <div className={styles.liTitle}>{a.action}</div>
                        <div className={styles.liSub}>{a.at} · {a.object}</div>
                      </div>
                    ))}
                    {(selectedFull.auditLog || []).length === 0 && (
                      <div className={styles.muted}>Chưa có audit log.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "spec" && (
              <div className={styles.grid2}>
                <div className={styles.card}>
                  <div className={styles.cardTitle}>Danh mục chuyên môn</div>
                  <div className={styles.chipWrap}>
                    {(selectedFull.specialties || []).map((s) => (
                      <span key={s} className={styles.chip}>{s}</span>
                    ))}
                    {(selectedFull.specialties || []).length === 0 && <div className={styles.muted}>Chưa khai báo.</div>}
                  </div>
                </div>
                <div className={styles.card}>
                  <div className={styles.cardTitle}>Kinh nghiệm & Hạng</div>
                  <div className={styles.kv}>
                    <div className={styles.k}>Kinh nghiệm</div><div className={styles.v}>{selectedFull.expYears} năm</div>
                    <div className={styles.k}>Hạng PT</div><div className={styles.v}>{selectedFull.rank}</div>
                  </div>
                </div>
                <div className={styles.card} style={{ gridColumn: "1 / -1" }}>
                  <div className={styles.cardTitle}>Tiểu sử</div>
                  <div className={styles.v}>{selectedFull.bio || "—"}</div>
                </div>
              </div>
            )}

            {activeTab === "ops" && (
              <div className={styles.grid2}>
                <div className={styles.card}>
                  <div className={styles.cardTitle}>PT_Schedules</div>
                  <div className={styles.kv} style={{ marginBottom: 8 }}>
                    <div className={styles.k}>Khung cố định</div>
                    <div className={styles.v}>{(selectedFull.schedules?.fixedSlots || []).join(" · ") || "—"}</div>
                    <div className={styles.k}>Đã đặt</div>
                    <div className={styles.v}>{(selectedFull.schedules?.bookedSlots || []).join(" · ") || "—"}</div>
                  </div>
                  <div className={styles.muted}>Mục tiêu: chống đụng độ (concurrency) khi đặt lịch.</div>
                </div>

                <div className={styles.card}>
                  <div className={styles.cardTitle}>PT_Requests</div>
                  <div className={styles.list}>
                    {(selectedFull.requests || []).map((r) => (
                      <div key={r.id} className={styles.listItem}>
                        <div className={styles.liTitle}>{r.member}</div>
                        <div className={styles.liSub}>{r.id} · {r.createdAt} · {r.status}</div>
                      </div>
                    ))}
                    {(selectedFull.requests || []).length === 0 && <div className={styles.muted}>Không có request.</div>}
                  </div>
                </div>

                <div className={styles.card} style={{ gridColumn: "1 / -1" }}>
                  <div className={styles.cardTitle}>Danh sách Member quản lý</div>
                  <div className={styles.chipWrap}>
                    {(selectedFull.assignedMembers || []).map((m) => (
                      <span key={m.id} className={styles.chip}>{m.name} · {m.tier}</span>
                    ))}
                    {(selectedFull.assignedMembers || []).length === 0 && <div className={styles.muted}>Chưa được phân công.</div>}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "perf" && (
              <div className={styles.grid2}>
                <div className={styles.card}>
                  <div className={styles.cardTitle}>Tương tác AI</div>
                  <div className={styles.kv}>
                    <div className={styles.k}>Tỷ lệ phê duyệt</div><div className={styles.v}>{pct(selectedFull.performance?.aiApprovalRate)}</div>
                    <div className={styles.k}>Lộ trình đã review</div><div className={styles.v}>{selectedFull.performance?.aiPlansReviewed ?? 0}</div>
                  </div>
                </div>
                <div className={styles.card}>
                  <div className={styles.cardTitle}>RPE Notes</div>
                  <div className={styles.kv}>
                    <div className={styles.k}>Số ghi chú</div><div className={styles.v}>{selectedFull.performance?.rpeNotesCount ?? 0}</div>
                    <div className={styles.k}>Gợi ý</div><div className={styles.v}>Đánh giá tiến độ & mệt mỏi học viên</div>
                  </div>
                </div>
                <div className={styles.card} style={{ gridColumn: "1 / -1" }}>
                  <div className={styles.cardTitle}>Thống kê ca dạy</div>
                  <div className={styles.kv}>
                    <div className={styles.k}>Hoàn thành</div><div className={styles.v}>{selectedFull.performance?.sessionsCompleted ?? 0}</div>
                    <div className={styles.k}>Đăng ký</div><div className={styles.v}>{selectedFull.performance?.sessionsPlanned ?? 0}</div>
                    <div className={styles.k}>Tỷ lệ</div>
                    <div className={styles.v}>
                      {selectedFull.performance?.sessionsPlanned
                        ? pct((selectedFull.performance?.sessionsCompleted ?? 0) / selectedFull.performance.sessionsPlanned)
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "track" && (
              <div className={styles.grid2}>
                <div className={styles.card}>
                  <div className={styles.cardTitle}>Vị trí Check-in/Check-out</div>
                  <div className={styles.list}>
                    {(selectedFull.tracking?.checkins || []).map((c, i) => (
                      <div key={i} className={styles.listItem}>
                        <div className={styles.liTitle}>{c.type} · {c.member}</div>
                        <div className={styles.liSub}>{c.at} · ({c.lat}, {c.lng})</div>
                      </div>
                    ))}
                    {(selectedFull.tracking?.checkins || []).length === 0 && <div className={styles.muted}>Chưa có check-in/out.</div>}
                  </div>
                </div>
                <div className={styles.card}>
                  <div className={styles.cardTitle}>Tỷ lệ hoàn thành buổi tập</div>
                  <div className={styles.kv}>
                    <div className={styles.k}>Completion rate</div><div className={styles.v}>{pct(selectedFull.tracking?.completionRate)}</div>
                    <div className={styles.k}>Mục tiêu</div><div className={styles.v}>Bằng chứng làm việc thực tế theo vị trí</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create/Edit modal */}
      <Modal
        isOpen={!!editing}
        onRequestClose={() => setEditing(null)}
        title={editing?.id ? "Sửa Huấn luyện viên" : "Thêm Huấn luyện viên"}
      >
        <form className={styles.form} onSubmit={saveTrainer}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Họ tên *</label>
              <input value={form.hoTen} onChange={(e) => setForm((f) => ({ ...f, hoTen: e.target.value }))} required />
            </div>
            <div className={styles.formGroup}>
              <label>Tuổi</label>
              <input
                type="number"
                min={0}
                value={form.tuoi}
                onChange={(e) => setForm((f) => ({ ...f, tuoi: e.target.value }))}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Giới tính</label>
              <select value={form.gioiTinh} onChange={(e) => setForm((f) => ({ ...f, gioiTinh: e.target.value }))}>
                <option>Nam</option>
                <option>Nữ</option>
                <option>Khác</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className={styles.formGroup}>
              <label>Số điện thoại</label>
              <input value={form.sdt} onChange={(e) => setForm((f) => ({ ...f, sdt: e.target.value }))} />
            </div>
            <div className={styles.formGroup}>
              <label>Ảnh đại diện (URL)</label>
              <input value={form.avatarUrl} onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))} placeholder="https://..." />
            </div>
            <div className={styles.formGroup}>
              <label>Trạng thái</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                <option value="active">Hoạt động</option>
                <option value="suspended">Tạm khóa</option>
                <option value="inactive">Đã nghỉ</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Hạng PT</label>
              <select value={form.rank} onChange={(e) => setForm((f) => ({ ...f, rank: e.target.value }))}>
                {RANKS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Số năm kinh nghiệm</label>
              <input
                type="number"
                min={0}
                value={form.expYears}
                onChange={(e) => setForm((f) => ({ ...f, expYears: e.target.value }))} 
              />
            </div>
            <div className={`${styles.formGroup} ${styles.spanFull}`}>
              <label>Chuyên môn (cách nhau bởi dấu phẩy)</label>
              <input value={form.specialtiesText} onChange={(e) => setForm((f) => ({ ...f, specialtiesText: e.target.value }))} placeholder="Giảm mỡ, Tăng cơ, Yoga" />
            </div>
            <div className={`${styles.formGroup} ${styles.spanFull}`}>
              <label>Tiểu sử / Kinh nghiệm tóm tắt</label>
              <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} placeholder="Mô tả ngắn để hiển thị cho hội viên..." />
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="button" className={styles.btnGhost} onClick={() => setEditing(null)}>
              Hủy
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
