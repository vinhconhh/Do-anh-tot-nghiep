import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Pencil, Trash2, Eye, RefreshCw } from "lucide-react";
import Modal from "../../components/Modal";
import styles from "./Members.module.scss";
import { useMembersApi } from "../../api/membersApi";

const TIER_COLORS = { Gold: "tier-gold", Platinum: "tier-platinum", Silver: "tier-silver" };
const STATUS_META = {
  active:   { label: "Hoạt động",    color: "#1cc88a" },
  pending:  { label: "Chờ PT",       color: "#f6c23e" },
  expiring: { label: "Sắp hết hạn",  color: "#f6c23e" },
  expired:  { label: "Hết hạn",      color: "#858796" },
};

const EMPTY_FORM = { hoTen: "", tuoi: 0, gioiTinh: "Nam", nhuCauTap: "", email: "", sdt: "", tier: "Silver", pt: "" };

export default function Members() {
  const nav = useNavigate();
  const api = useMembersApi();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTier, setFilterTier] = useState("all");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load members from API
  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.list()
      .then((data) => { if (alive) setRows(data); })
      .catch((err) => { if (alive) setError(err.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => ({
    total:    rows.length,
    active:   rows.filter((r) => r.status === "active").length,
    expiring: rows.filter((r) => r.status === "expiring").length,
    expired:  rows.filter((r) => r.status === "expired").length,
  }), [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchQ = !q || r.hoTen.toLowerCase().includes(q.toLowerCase()) || r.email.toLowerCase().includes(q.toLowerCase());
      const matchStatus = filterStatus === "all" || r.status === filterStatus;
      const matchTier = filterTier === "all" || r.tier === filterTier;
      return matchQ && matchStatus && matchTier;
    });
  }, [rows, q, filterStatus, filterTier]);

  const openCreate = () => { setForm(EMPTY_FORM); setEditing({}); };
  const openEdit = (row) => {
    setForm({
      hoTen: row.hoTen,
      tuoi: row.tuoi ?? 0,
      gioiTinh: row.gioiTinh || "Nam",
      nhuCauTap: row.nhuCauTap || "",
      email: row.email,
      sdt: row.sdt,
      tier: row.tier,
      pt: row.pt,
    });
    setEditing(row);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.hoTen) return alert("Vui lòng nhập họ tên");
    setSaving(true);
    try {
      if (editing?.UserID) {
        const updated = await api.update(editing.UserID, {
          hoTen: form.hoTen,
          email: form.email,
          goal: form.nhuCauTap,
        });
        setRows((prev) => prev.map((r) => r.UserID === editing.UserID ? { ...r, ...updated } : r));
      } else {
        const created = await api.create({
          hoTen: form.hoTen,
          email: form.email,
          matKhau: "Gym@1234",
          goal: form.nhuCauTap,
        });
        const initials = form.hoTen.split(" ").map((w) => w[0]).slice(-2).join("").toUpperCase();
        setRows((prev) => [...prev, { ...created, initials, status: "active" }]);
      }
    } catch (err) {
      alert(err.message || "Lưu thất bại");
    } finally {
      setSaving(false);
      setEditing(null);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Xóa hội viên "${row.hoTen}"?`)) return;
    try {
      await api.remove(row.UserID);
      setRows((prev) => prev.filter((r) => r.UserID !== row.UserID));
    } catch (err) {
      alert(err.message || "Xóa thất bại");
    }
  };

  return (
    <>
      <div className={styles.tab} />
      <div className={styles.page}>
        {/* Heading */}
        <div className={styles.header}>
          <h2 className={styles.title}>Quản lý Hội viên</h2>
          <button className={styles.btnPrimary} onClick={openCreate}>
            <Plus size={16} /> Thêm hội viên
          </button>
        </div>

        {/* Stat Cards */}
        <div className={styles.statGrid}>
          {[
            { label: "Tổng hội viên",    val: stats.total,    color: "#4e73df" },
            { label: "Đang hoạt động",   val: stats.active,   color: "#1cc88a" },
            { label: "Sắp hết hạn",      val: stats.expiring, color: "#f6c23e" },
            { label: "Đã hết hạn",       val: stats.expired,  color: "#e74a3b" },
          ].map((s) => (
            <div key={s.label} className={styles.statCard} style={{ borderLeftColor: s.color }}>
              <div className={styles.statLabel}>{s.label}</div>
              <div className={styles.statVal} style={{ color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Filter & Search */}
        <div className={styles.tools}>
          <div className={styles.searchBox}>
            <Search className={styles.searchIcon} size={16} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên, email…"
            />
            {q && <button className={styles.clear} onClick={() => setQ("")}>×</button>}
          </div>

          <div className={styles.filterGroup}>
            {["all", "active", "expiring", "expired"].map((s) => (
              <button
                key={s}
                className={`${styles.filterBtn} ${filterStatus === s ? styles.filterActive : ""}`}
                onClick={() => setFilterStatus(s)}
              >
                {{ all: "Tất cả", active: "Hoạt động", expiring: "Sắp hết hạn", expired: "Hết hạn" }[s]}
              </button>
            ))}
          </div>

          <div className={styles.filterGroup}>
            {["all", "Silver", "Gold", "Platinum"].map((t) => (
              <button
                key={t}
                className={`${styles.filterBtn} ${filterTier === t ? styles.filterActive : ""}`}
                onClick={() => setFilterTier(t)}
              >
                {t === "all" ? "Mọi gói" : t}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Hội viên</th>
                <th>Nhu cầu tập</th>
                <th>Gói thẻ</th>
                <th>Ngày đăng ký</th>
                <th>Hết hạn</th>
                <th>PT phụ trách</th>
                <th>AI đã dùng</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={9} style={{ textAlign: "center", padding: "20px", color: "#858796" }}>Đang tải...</td></tr>
              )}
              {error && (
                <tr><td colSpan={9} style={{ textAlign: "center", padding: "20px", color: "#e74a3b" }}>{error}</td></tr>
              )}
              {!loading && !error && filtered.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: "center", padding: "20px", color: "#858796" }}>Không có dữ liệu</td></tr>
              )}
              {!loading && filtered.map((m) => {
                const isActive = m.isActive !== false;
                const sm = STATUS_META[isActive ? "active" : "expired"] || STATUS_META.active;
                const initials = (m.hoTen || "").split(" ").map((w) => w[0]).slice(-2).join("").toUpperCase() || "--";
                return (
                  <tr key={m.UserID}>
                    <td>
                      <div className={styles.memberCell}>
                        <div className={styles.initials}>{initials}</div>
                        <div>
                          <div className={styles.memberName}>{m.hoTen}</div>
                          <div className={styles.memberEmail}>{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={styles.dateText}>{m.goal || "—"}</span></td>
                    <td><span className={styles.tierBadge}>Active</span></td>
                    <td><span className={styles.dateText}>{m.createdAt ? new Date(m.createdAt).toLocaleDateString("vi-VN") : "—"}</span></td>
                    <td><span className={styles.dateText}>—</span></td>
                    <td><span className={styles.ptName}>—</span></td>
                    <td><span className={styles.aiUsed}>{m.aiQuota ?? 0}</span></td>
                    <td>
                      <span className={styles.statusBadge} style={{ background: sm.color + "22", color: sm.color }}>
                        {sm.label}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.btnIcon} title="Xem chi tiết" onClick={() => nav(`/members/${m.UserID}`)}>
                          <Eye size={15} />
                        </button>
                        {m.status === "expired" || m.status === "expiring" ? (
                          <button className={`${styles.btnIcon} ${styles.btnSuccess}`} title="Gia hạn">
                            <RefreshCw size={15} />
                          </button>
                        ) : (
                          <button className={`${styles.btnIcon} ${styles.btnEdit}`} title="Sửa" onClick={() => openEdit(m)}>
                            <Pencil size={15} />
                          </button>
                        )}
                        <button className={`${styles.btnIcon} ${styles.btnDelete}`} title="Xóa" onClick={() => handleDelete(m)}>
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={!!editing}
        onRequestClose={() => setEditing(null)}
        title={editing?.id ? "Sửa hội viên" : "Thêm hội viên mới"}
      >
        <form onSubmit={handleSave} className={styles.form}>
          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label>Họ và tên *</label>
              <input value={form.hoTen} onChange={(e) => setForm((f) => ({ ...f, hoTen: e.target.value }))} placeholder="Nguyễn Văn A" required />
            </div>
            <div className={styles.formGroup}>
              <label>Tuổi</label>
              <input type="number" min={0} value={form.tuoi} onChange={(e) => setForm((f) => ({ ...f, tuoi: e.target.value }))} />
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
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@gmail.com" required />
            </div>
            <div className={styles.formGroup}>
              <label>Số điện thoại</label>
              <input value={form.sdt} onChange={(e) => setForm((f) => ({ ...f, sdt: e.target.value }))} placeholder="0912345678" />
            </div>
            <div className={`${styles.formGroup} ${styles.spanFull}`}>
              <label>Nhu cầu tập</label>
              <input value={form.nhuCauTap} onChange={(e) => setForm((f) => ({ ...f, nhuCauTap: e.target.value }))} placeholder="VD: Giảm mỡ, Tăng cơ, Yoga..." />
            </div>
            <div className={styles.formGroup}>
              <label>Gói thẻ *</label>
              <select value={form.tier} onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))}>
                <option>Silver</option>
                <option>Gold</option>
                <option>Platinum</option>
              </select>
            </div>
            <div className={`${styles.formGroup} ${styles.spanFull}`}>
              <label>Phân công PT</label>
              <select value={form.pt} onChange={(e) => setForm((f) => ({ ...f, pt: e.target.value }))}>
                <option value="">— Chưa phân công —</option>
              </select>
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="button" className={styles.btnGhost} onClick={() => setEditing(null)}>Hủy</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
