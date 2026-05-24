import { useState, useEffect } from "react";
import api from "../../api/axiosClient";
import { Plus, Edit, Trash2, Cpu, Search } from "lucide-react";
import Modal from "../../components/Modal";
import styles from "./AiPackageManagement.module.scss";

export default function AiPackageManagement() {
  const [packages, setPackages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [formData, setFormData] = useState({
    Name: "", Price: 0, Credits: 10, Description: "", IsVisible: true
  });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterSt, setFilterSt] = useState("all");

  const fetchPackages = async () => {
    try {
      const res = await api.get("/packages/ai/all");
      setPackages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleOpenModal = (pkg = null) => {
    if (pkg) {
      setEditingPkg(pkg);
      setFormData({
        Name: pkg.Name,
        Price: pkg.Price,
        Credits: pkg.Credits,
        Description: pkg.Description || "",
        IsVisible: pkg.IsVisible
      });
    } else {
      setEditingPkg(null);
      setFormData({
        Name: "", Price: 0, Credits: 50, Description: "", IsVisible: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.Name.trim()) { alert("Vui lòng nhập tên gói."); return; }
    setSaving(true);
    try {
      if (editingPkg) {
        await api.put(`/packages/ai/${editingPkg.PackageID}`, formData);
      } else {
        await api.post("/packages/ai", formData);
      }
      setIsModalOpen(false);
      fetchPackages();
    } catch (err) {
      alert("Lỗi khi lưu gói AI.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa gói AI này?")) {
      try {
        await api.delete(`/packages/ai/${id}`);
        fetchPackages();
      } catch (err) {
        alert("Lỗi khi xóa gói AI.");
      }
    }
  };

  const displayedPackages = packages.filter(p => {
    const matchSearch = !search || p.Name?.toLowerCase().includes(search.toLowerCase());
    const matchSt = filterSt === "all" || (filterSt === "active" ? p.IsVisible : !p.IsVisible);
    return matchSearch && matchSt;
  });

  return (
    <>
      <div className={styles.tab} />
      <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <Cpu size={26} color="var(--theme-primary)" /> Cấu Hình Gói AI
          </h1>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className={styles.btnPrimary}
        >
          <Plus size={18} /> Thêm Gói Mới
        </button>
      </div>

      <div className={styles.statGrid}>
        <div className={styles.statCard} style={{ borderLeftColor: "#4e73df" }}>
          <div className={styles.statLabel}>Tổng số gói AI</div>
          <div className={styles.statVal} style={{ color: "#4e73df" }}>{packages.length}</div>
        </div>
        <div className={styles.statCard} style={{ borderLeftColor: "#1cc88a" }}>
          <div className={styles.statLabel}>Đang hiển thị</div>
          <div className={styles.statVal} style={{ color: "#1cc88a" }}>{packages.filter(p => p.IsVisible).length}</div>
        </div>
      </div>

      <div className={styles.tools}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm gói AI..." />
          {search && <button className={styles.clear} onClick={() => setSearch("")}>×</button>}
        </div>

        <div className={styles.filterGroup}>
          {["all", "active", "inactive"].map((s) => (
            <button
              key={s}
              className={`${styles.filterBtn} ${filterSt === s ? styles.filterActive : ""}`}
              onClick={() => setFilterSt(s)}
            >
              {{ all: "Tất cả", active: "Hiển thị", inactive: "Ẩn" }[s]}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tên Gói</th>
              <th>Giá (VNĐ)</th>
              <th>Số Lượt</th>
              <th>Trạng Thái</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {displayedPackages.map((pkg) => (
              <tr key={pkg.PackageID}>
                <td style={{ fontWeight: 800, color: "var(--theme-primary)" }}>{pkg.Name}</td>
                <td style={{ fontWeight: 700 }}>{pkg.Price.toLocaleString()} đ</td>
                <td style={{ fontWeight: 700 }}>{pkg.Credits} lượt</td>
                <td>
                  {pkg.IsVisible ? <span className={`${styles.pill} ${styles.pillActive}`}>Hiển thị</span> : <span className={`${styles.pill} ${styles.pillInactive}`}>Ẩn</span>}
                </td>
                <td>
                  <div className={styles.actions}>
                    <button onClick={() => handleOpenModal(pkg)} className={`${styles.btnIcon} ${styles.btnEdit}`}>
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(pkg.PackageID)} className={`${styles.btnIcon} ${styles.btnDanger}`}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {displayedPackages.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: "20px", color: "var(--theme-text)" }}>Không có dữ liệu</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        title={editingPkg ? "✏️ Sửa Gói AI" : "➕ Thêm Gói AI"}
      >
        <div className={styles.modalBody}>
          <div className={styles.formGrid}>
            <div className={`${styles.field} ${styles.span2}`}>
              <label>Tên Gói <span className={styles.required}>*</span></label>
              <input type="text" className={styles.input} value={formData.Name} onChange={e => setFormData({...formData, Name: e.target.value})} />
            </div>
            <div className={styles.field}>
              <label>Giá Tiền (VNĐ) <span className={styles.required}>*</span></label>
              <input type="number" className={styles.input} value={formData.Price} onChange={e => setFormData({...formData, Price: e.target.value})} />
            </div>
            <div className={styles.field}>
              <label>Số Lượt AI <span className={styles.required}>*</span></label>
              <input type="number" className={styles.input} value={formData.Credits} onChange={e => setFormData({...formData, Credits: e.target.value})} />
            </div>
            <div className={`${styles.field} ${styles.span2}`}>
              <label>Mô Tả Ngắn</label>
              <textarea rows={2} className={styles.input} value={formData.Description} onChange={e => setFormData({...formData, Description: e.target.value})} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label className={styles.checkboxGroup}>
              <input type="checkbox" checked={formData.IsVisible} onChange={e => setFormData({...formData, IsVisible: e.target.checked})} />
              Hiển thị trên mục Mua Lượt AI
            </label>
          </div>
        </div>
        <div className={styles.formActions}>
          <button type="button" onClick={() => setIsModalOpen(false)} className={styles.btnCancel}>Hủy</button>
          <button type="button" onClick={handleSave} className={styles.btnSave} disabled={saving}>{saving ? "Đang lưu..." : "💾 Lưu Lại"}</button>
        </div>
      </Modal>
      </div>
    </>
  );
}
