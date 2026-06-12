import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Shield,
  UserCog,
  Dumbbell,
  UserCircle,
  Search,
  Plus,
  Pencil,
  Trash2,
  Lock,
  Unlock,
  X,
  ChevronLeft,
  ChevronRight,
  UserPlus,
} from "lucide-react";
import accountsApi from "../../api/accountsApi";
import styles from "./AccountManagement.module.scss";

const ROLE_TABS = [
  { code: null, label: "Tất cả", icon: Users },
  { code: "ADMIN", label: "Admin", icon: Shield },
  { code: "MANAGER", label: "Manager", icon: UserCog },
  { code: "PT", label: "Huấn luyện viên", icon: Dumbbell },
  { code: "MEMBER", label: "Hội viên", icon: UserCircle },
];

const ROLE_STYLES = {
  ADMIN: styles.roleAdmin,
  MANAGER: styles.roleManager,
  PT: styles.rolePT,
  MEMBER: styles.roleMember,
};

const ROLE_LABELS = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  PT: "HLV",
  MEMBER: "Hội viên",
};

const GENDERS = [
  { value: "", label: "-- Chọn --" },
  { value: "Nam", label: "Nam" },
  { value: "Nữ", label: "Nữ" },
  { value: "Khác", label: "Khác" },
];

const INITIAL_FORM = {
  FullName: "",
  Email: "",
  Password: "",
  RoleCode: "MEMBER",
  PhoneNumber: "",
  Gender: "",
  Birthday: "",
  IsActive: 1,
};

export default function AccountManagement() {
  const [accounts, setAccounts] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState(null);
  const [search, setSearch] = useState("");
  const [searchDebounce, setSearchDebounce] = useState("");
  const [loading, setLoading] = useState(true);
  const [roleCounts, setRoleCounts] = useState({});

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState("");

  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounce(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: 15 };
      if (roleFilter) params.role = roleFilter;
      if (searchDebounce) params.search = searchDebounce;

      const res = await accountsApi.getAccounts(params);
      const data = res.data;
      setAccounts(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      console.error("Fetch accounts error:", err);
      showToast("Lỗi tải danh sách tài khoản", "error");
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, searchDebounce]);

  const fetchCounts = useCallback(async () => {
    try {
      const promises = ["ADMIN", "MANAGER", "PT", "MEMBER"].map((r) =>
        accountsApi.getAccounts({ role: r, page: 1, page_size: 1 })
      );
      const results = await Promise.all(promises);
      const counts = {};
      ["ADMIN", "MANAGER", "PT", "MEMBER"].forEach((r, i) => {
        counts[r] = results[i].data.total || 0;
      });
      setRoleCounts(counts);
    } catch {
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  useEffect(() => {
    setPage(1);
  }, [roleFilter, searchDebounce]);

  const handleTabChange = (code) => {
    setRoleFilter(code);
  };

  const openCreate = () => {
    setForm({ ...INITIAL_FORM });
    setModalMode("create");
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (acc) => {
    setForm({
      FullName: acc.FullName || "",
      Email: acc.Email || "",
      Password: "",
      RoleCode: acc.RoleCode || "MEMBER",
      PhoneNumber: acc.PhoneNumber || "",
      Gender: acc.Gender || "",
      Birthday: acc.Birthday ? acc.Birthday.split("T")[0] : "",
      IsActive: acc.IsActive,
    });
    setModalMode("edit");
    setEditId(acc.UserID);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.FullName.trim() || !form.Email.trim()) {
      showToast("Vui lòng nhập đầy đủ họ tên và email", "error");
      return;
    }
    if (modalMode === "create" && !form.Password) {
      showToast("Vui lòng nhập mật khẩu", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.Birthday) {
        payload.Birthday = new Date(payload.Birthday).toISOString();
      } else {
        delete payload.Birthday;
      }
      if (modalMode === "edit" && !payload.Password) {
        delete payload.Password;
      }

      if (modalMode === "create") {
        await accountsApi.createAccount(payload);
        showToast("Tạo tài khoản thành công!");
      } else {
        await accountsApi.updateAccount(editId, payload);
        showToast("Cập nhật tài khoản thành công!");
      }

      setShowModal(false);
      fetchAccounts();
      fetchCounts();
    } catch (err) {
      const msg = err.response?.data?.detail || "Có lỗi xảy ra";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await accountsApi.deleteAccount(deleteId);
      showToast("Đã xóa tài khoản thành công!");
      setDeleteId(null);
      fetchAccounts();
      fetchCounts();
    } catch (err) {
      const msg = err.response?.data?.detail || "Có lỗi xảy ra";
      showToast(msg, "error");
    }
  };

  const handleToggleStatus = async (acc) => {
    try {
      await accountsApi.toggleStatus(acc.UserID);
      showToast(
        acc.IsActive
          ? `Đã khóa tài khoản ${acc.FullName}`
          : `Đã kích hoạt tài khoản ${acc.FullName}`
      );
      fetchAccounts();
    } catch (err) {
      const msg = err.response?.data?.detail || "Có lỗi xảy ra";
      showToast(msg, "error");
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("vi-VN");
    } catch {
      return "—";
    }
  };

  const getAvatarUrl = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "U")}&background=4e73df&color=fff&size=80`;

  const totalAll =
    (roleCounts.ADMIN || 0) +
    (roleCounts.MANAGER || 0) +
    (roleCounts.PT || 0) +
    (roleCounts.MEMBER || 0);

  return (
    <div className={styles.page}>
      {}
      {toast && (
        <div
          className={`${styles.toast} ${
            toast.type === "error" ? styles.toastError : styles.toastSuccess
          }`}
        >
          {toast.msg}
        </div>
      )}

      {}
      <div className={styles.pageHeading}>
        <h1 className={styles.title}>Quản lý tài khoản</h1>
        <div className={styles.headActions}>
          <button className={styles.btnPrimary} onClick={openCreate}>
            <UserPlus size={16} /> Thêm tài khoản
          </button>
        </div>
      </div>

      {}
      <div className={styles.statGrid}>
        <div className={`${styles.statCard} ${styles.borderBlue}`}>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Admin</div>
            <div className={styles.statValue}>{roleCounts.ADMIN || 0}</div>
          </div>
          <Shield size={28} className={styles.statIcon} />
        </div>
        <div className={`${styles.statCard} ${styles.borderGreen}`}>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Manager</div>
            <div className={styles.statValue}>{roleCounts.MANAGER || 0}</div>
          </div>
          <UserCog size={28} className={styles.statIcon} />
        </div>
        <div className={`${styles.statCard} ${styles.borderOrange}`}>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Huấn luyện viên</div>
            <div className={styles.statValue}>{roleCounts.PT || 0}</div>
          </div>
          <Dumbbell size={28} className={styles.statIcon} />
        </div>
        <div className={`${styles.statCard} ${styles.borderPurple}`}>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Hội viên</div>
            <div className={styles.statValue}>{roleCounts.MEMBER || 0}</div>
          </div>
          <UserCircle size={28} className={styles.statIcon} />
        </div>
      </div>

      {}
      <div className={styles.tabs}>
        {ROLE_TABS.map((tab) => {
          const Icon = tab.icon;
          const count = tab.code ? roleCounts[tab.code] || 0 : totalAll;
          return (
            <button
              key={tab.code || "all"}
              className={`${styles.tab} ${
                roleFilter === tab.code ? styles.tabActive : ""
              }`}
              onClick={() => handleTabChange(tab.code)}
            >
              <Icon size={15} />
              {tab.label}
              <span className={styles.tabBadge}>{count}</span>
            </button>
          );
        })}
      </div>

      {}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Tìm kiếm theo tên, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h6 className={styles.cardTitle}>
            <Users size={16} /> Danh sách tài khoản
            <span style={{ fontWeight: 400, fontSize: "1.2rem", marginLeft: 8, color: "var(--theme-text)" }}>
              ({total} tài khoản)
            </span>
          </h6>
        </div>
        <div className={styles.tableWrap}>
          {loading ? (
            <div className={styles.loading}>Đang tải...</div>
          ) : accounts.length === 0 ? (
            <div className={styles.emptyState}>
              <Users size={48} className={styles.emptyIcon} />
              <div className={styles.emptyText}>Không có tài khoản nào</div>
              <div className={styles.emptySub}>Thử thay đổi bộ lọc hoặc tìm kiếm</div>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tài khoản</th>
                  <th>Vai trò</th>
                  <th>Điện thoại</th>
                  <th>Giới tính</th>
                  <th>Ngày tạo</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <tr key={acc.UserID}>
                    <td>
                      <div className={styles.userCell}>
                        <img
                          className={styles.avatar}
                          src={getAvatarUrl(acc.FullName)}
                          alt={acc.FullName}
                        />
                        <div>
                          <div className={styles.userName}>{acc.FullName}</div>
                          <div className={styles.userEmail}>{acc.Email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`${styles.roleBadge} ${
                          ROLE_STYLES[acc.RoleCode] || ""
                        }`}
                      >
                        {ROLE_LABELS[acc.RoleCode] || acc.RoleCode}
                      </span>
                    </td>
                    <td>{acc.PhoneNumber || "—"}</td>
                    <td>{acc.Gender || "—"}</td>
                    <td className={styles.dateText}>
                      {formatDate(acc.CreatedAt)}
                    </td>
                    <td>
                      {acc.IsActive ? (
                        <span className={styles.statusActive}>
                          Hoạt động
                        </span>
                      ) : (
                        <span className={styles.statusInactive}>
                          Đã khóa
                        </span>
                      )}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.btnIcon}
                          title="Sửa"
                          onClick={() => openEdit(acc)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className={`${styles.btnIcon} ${styles.btnIconWarning}`}
                          title={acc.IsActive ? "Khóa" : "Mở khóa"}
                          onClick={() => handleToggleStatus(acc)}
                        >
                          {acc.IsActive ? <Lock size={14} /> : <Unlock size={14} />}
                        </button>
                        <button
                          className={`${styles.btnIcon} ${styles.btnIconDanger}`}
                          title="Xóa"
                          onClick={() => {
                            setDeleteId(acc.UserID);
                            setDeleteName(acc.FullName);
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - page) <= 2
              )
              .reduce((acc, p, i, arr) => {
                if (i > 0 && p - arr[i - 1] > 1) {
                  acc.push("...");
                }
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`dot-${i}`} className={styles.pageInfo}>
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    className={`${styles.pageBtn} ${
                      p === page ? styles.pageBtnActive : ""
                    }`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              className={styles.pageBtn}
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {}
      {showModal && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {modalMode === "create"
                  ? "Thêm tài khoản mới"
                  : "Chỉnh sửa tài khoản"}
              </h3>
              <button
                className={styles.modalClose}
                onClick={() => setShowModal(false)}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Họ và tên *</label>
                  <input
                    className={styles.formInput}
                    value={form.FullName}
                    onChange={(e) =>
                      setForm({ ...form, FullName: e.target.value })
                    }
                    placeholder="Nhập họ và tên"
                    required
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Email *</label>
                    <input
                      className={styles.formInput}
                      type="email"
                      value={form.Email}
                      onChange={(e) =>
                        setForm({ ...form, Email: e.target.value })
                      }
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      {modalMode === "create"
                        ? "Mật khẩu *"
                        : "Mật khẩu mới (để trống nếu không đổi)"}
                    </label>
                    <input
                      className={styles.formInput}
                      type="password"
                      value={form.Password}
                      onChange={(e) =>
                        setForm({ ...form, Password: e.target.value })
                      }
                      placeholder={
                        modalMode === "create"
                          ? "Nhập mật khẩu"
                          : "Để trống nếu không đổi"
                      }
                      required={modalMode === "create"}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Vai trò *</label>
                    <select
                      className={styles.formSelect}
                      value={form.RoleCode}
                      onChange={(e) =>
                        setForm({ ...form, RoleCode: e.target.value })
                      }
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="MANAGER">Manager</option>
                      <option value="PT">Huấn luyện viên</option>
                      <option value="MEMBER">Hội viên</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Điện thoại</label>
                    <input
                      className={styles.formInput}
                      value={form.PhoneNumber}
                      onChange={(e) =>
                        setForm({ ...form, PhoneNumber: e.target.value })
                      }
                      placeholder="0901234567"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Giới tính</label>
                    <select
                      className={styles.formSelect}
                      value={form.Gender}
                      onChange={(e) =>
                        setForm({ ...form, Gender: e.target.value })
                      }
                    >
                      {GENDERS.map((g) => (
                        <option key={g.value} value={g.value}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Ngày sinh</label>
                    <input
                      className={styles.formInput}
                      type="date"
                      value={form.Birthday}
                      onChange={(e) =>
                        setForm({ ...form, Birthday: e.target.value })
                      }
                    />
                  </div>
                </div>

                {modalMode === "edit" && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Trạng thái</label>
                    <select
                      className={styles.formSelect}
                      value={form.IsActive}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          IsActive: parseInt(e.target.value),
                        })
                      }
                    >
                      <option value={1}>Hoạt động</option>
                      <option value={0}>Đã khóa</option>
                    </select>
                  </div>
                )}
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => setShowModal(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={styles.btnSubmit}
                  disabled={saving}
                >
                  {saving
                    ? "Đang lưu..."
                    : modalMode === "create"
                    ? "Tạo tài khoản"
                    : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {deleteId && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteId(null);
          }}
        >
          <div className={styles.modal} style={{ width: 420 }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Xác nhận xóa</h3>
              <button
                className={styles.modalClose}
                onClick={() => setDeleteId(null)}
              >
                <X size={16} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ fontSize: "1.3rem", color: "var(--theme-text-dark)", lineHeight: 1.6 }}>
                Bạn có chắc chắn muốn xóa tài khoản{" "}
                <strong>{deleteName}</strong>? Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.btnCancel}
                onClick={() => setDeleteId(null)}
              >
                Hủy
              </button>
              <button
                className={`${styles.btnSubmit} ${styles.btnDanger}`}
                onClick={handleDelete}
              >
                <Trash2 size={14} /> Xóa tài khoản
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
