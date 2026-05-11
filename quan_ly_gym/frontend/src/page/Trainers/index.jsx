import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Ban,
  CheckCircle2,
  Trash2,
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
  gioiTinh: "Nam",
  email: "",
  sdt: "",
  status: "active",
  rank: "Junior PT",
  expYears: 0,
  specialtiesText: "",
  ngaySinh: "",
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
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRank, setFilterRank] = useState("all");
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
        setRows(data.map((t) => ({
          ...t,
          id: t.UserID,
          hoTen: t.hoTen,
          email: t.email,
          status: t.isActive !== false ? "active" : "inactive",
          rank: t.certifications || "Junior PT",
          expYears: t.experienceYears || 0,
          specialties: t.specialty ? t.specialty.split(",").map((s) => s.trim()) : [],
          sdt: t.sdt || "",
          gioiTinh: t.gioiTinh || "Nam",
          performance: t.performance || { aiApprovalRate: 0, sessionsCompleted: 0, sessionsPlanned: 0 },
        })));
      })
      .catch((err) => console.error("Trainers fetch error:", err))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [api]);

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
    setForm(EMPTY_FORM);
    setEditing({});
  };

  const openEdit = (t) => {
    setForm({
      hoTen: t.hoTen || "",
      gioiTinh: t.gioiTinh || "Nam",
      email: t.email || "",
      sdt: t.sdt || "",
      status: t.status || "active",
      rank: t.rank || "Junior PT",
      expYears: t.expYears ?? 0,
      specialtiesText: (t.specialties || []).join(", "),
      ngaySinh: t.ngaySinh ? t.ngaySinh.split("T")[0] : "",
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
      const calcAge = form.ngaySinh ? new Date().getFullYear() - new Date(form.ngaySinh).getFullYear() : null;
      const payload = {
        hoTen: form.hoTen.trim(),
        email: form.email.trim(),
        isActive: form.status === "active" ? 1 : 0,
        experienceYears: Number(form.expYears) || 0,
        certifications: form.rank,
        specialty: specialties.join(", "),
        phoneNumber: form.sdt.trim(),
        age: calcAge,
        gender: form.gioiTinh,
        birthday: form.ngaySinh || null,
      };

      if (editing?.UserID) {
        await api.update(editing.UserID, payload);
        setRows((prev) => prev.map((x) => x.id === editing.id ? { ...x, ...payload, id: x.id, specialties, status: form.status } : x));
      } else {
        const created = await api.create({ ...payload, matKhau: "PT@1234" });
        setRows((prev) => [...prev, {
          ...created,
          id: created.UserID,
          status: "active",
          rank: form.rank,
          expYears: Number(form.expYears),
          specialties,
        }]);
      }
    } catch (err) {
      alert(err.message || "Lưu thất bại");
    } finally {
      setSaving(false);
      setEditing(null);
    }
  };

  const toggleSuspend = async (t) => {
    const nextStatus = t.status === "suspended" ? "active" : "suspended";
    try {
      await api.update(t.UserID, { isActive: nextStatus === "active" ? 1 : 0 });
      setRows((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: nextStatus } : x)));
    } catch (err) {
      alert("Cập nhật trạng thái thất bại");
    }
  };

  const removeTrainer = async (t) => {
    if (!window.confirm(`Xóa PT "${t.hoTen}"?`)) return;
    try {
      await api.remove(t.UserID);
      setRows((prev) => prev.filter((x) => x.id !== t.id));
    } catch (err) {
      alert(err.message || "Xóa thất bại");
    }
  };

  const openDetail = (t) => {
    nav(`/trainers/${t.id}`);
  };

  return (
    <>
      <div className={styles.tab} />
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Quản lý Huấn luyện viên</h2>
            <p className={styles.subtitle}>Thiết lập tài khoản, chuyên môn, lịch trình và hiệu suất giảng dạy.</p>
          </div>
          <button className={styles.btnPrimary} onClick={openCreate}>
            <Plus size={16} /> Thêm PT
          </button>
        </div>

        <div className={styles.statGrid}>
          {[
            { label: "Tổng PT", val: stats.total, color: "#4e73df" },
            { label: "Hoạt động", val: stats.active, color: "#1cc88a" },
            { label: "Tạm khóa", val: stats.suspended, color: "#f6c23e" },
            { label: "Đã nghỉ", val: stats.inactive, color: "#858796" },
          ].map((s) => (
            <div key={s.label} className={styles.statCard} style={{ borderLeftColor: s.color }}>
              <div className={styles.statLabel}>{s.label}</div>
              <div className={styles.statVal}>{s.val}</div>
            </div>
          ))}
        </div>

        <div className={styles.tools}>
          <div className={styles.searchBox}>
            <Search className={styles.searchIcon} size={16} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên, email, SĐT…" />
            {q && <button className={styles.clear} onClick={() => setQ("")}>×</button>}
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
                <th>Hiệu suất</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 18, color: "#858796" }}>
                    Không có dữ liệu
                  </td>
                </tr>
              )}
              {filtered.map((t) => {
                const meta = STATUS_META[t.status] || STATUS_META.active;
                const perf = t.performance || {};
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
                            {t.email} · {t.sdt}
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
                        {(t.specialties || []).slice(0, 3).map((s) => (
                          <span key={s} className={styles.chip}>{s}</span>
                        ))}
                        {(t.specialties || []).length > 3 && (
                          <span className={styles.muted}>+{(t.specialties || []).length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className={styles.name}>AI duyệt: {pct(perf.aiApprovalRate)}</div>
                      <div className={styles.muted}>Ca dạy: {perf.sessionsCompleted || 0}</div>
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

      <Modal
        isOpen={!!editing}
        onRequestClose={() => setEditing(null)}
        title={editing?.UserID ? "Sửa Huấn luyện viên" : "Thêm Huấn luyện viên"}
      >
        <form className={styles.form} onSubmit={saveTrainer}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Họ tên *</label>
              <input value={form.hoTen || ""} onChange={(e) => setForm((f) => ({ ...f, hoTen: e.target.value }))} required />
            </div>
            <div className={styles.formGroup}>
              <label>Email *</label>
              <input type="email" value={form.email || ""} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className={styles.formGroup}>
              <label>Số điện thoại</label>
              <input value={form.sdt || ""} onChange={(e) => setForm((f) => ({ ...f, sdt: e.target.value }))} />
            </div>
            <div className={styles.formGroup}>
              <label>Ngày sinh</label>
              <input type="date" value={form.ngaySinh || ""} onChange={(e) => setForm((f) => ({ ...f, ngaySinh: e.target.value }))} />
            </div>

            <div className={styles.formGroup}>
              <label>Giới tính</label>
              <select value={form.gioiTinh || "Nam"} onChange={(e) => setForm((f) => ({ ...f, gioiTinh: e.target.value }))}>
                <option>Nam</option>
                <option>Nữ</option>
                <option>Khác</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Trạng thái</label>
              <select value={form.status || "active"} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                <option value="active">Hoạt động</option>
                <option value="suspended">Tạm khóa</option>
                <option value="inactive">Đã nghỉ</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Hạng PT</label>
              <select value={form.rank || "Junior PT"} onChange={(e) => setForm((f) => ({ ...f, rank: e.target.value }))}>
                {RANKS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Số năm kinh nghiệm</label>
              <input type="number" min={0} value={form.expYears ?? 0} onChange={(e) => setForm((f) => ({ ...f, expYears: e.target.value }))} />
            </div>
            <div className={`${styles.formGroup} ${styles.spanFull}`}>
              <label>Chuyên môn (cách nhau bởi dấu phẩy)</label>
              <input value={form.specialtiesText || ""} onChange={(e) => setForm((f) => ({ ...f, specialtiesText: e.target.value }))} placeholder="Giảm mỡ, Tăng cơ, Yoga" />
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="button" className={styles.btnGhost} onClick={() => setEditing(null)}>Hủy</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
