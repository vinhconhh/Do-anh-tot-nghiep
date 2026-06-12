import { useState, useEffect } from "react";
import api from "../../api/axiosClient";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Modal from "../../components/Modal";
import styles from "./PackageManagement.module.scss";

export default function PackageManagement() {
  const [packages, setPackages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [formData, setFormData] = useState({
    Name: "", Price: 0, DurationMonths: 1, Description: "", Benefits: "", IsVisible: true, IsFeatured: false
  });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterSt, setFilterSt] = useState("all");

  const fetchPackages = async () => {
    try {
      const res = await api.get("/packages/membership/all");
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
        DurationMonths: pkg.DurationMonths,
        Description: pkg.Description || "",
        Benefits: pkg.Benefits || "",
        IsVisible: pkg.IsVisible,
        IsFeatured: pkg.IsFeatured
      });
    } else {
      setEditingPkg(null);
      setFormData({
        Name: "", Price: 0, DurationMonths: 1, Description: "", Benefits: '["Tập không giới hạn 24/7", "Sử dụng toàn bộ thiết bị hiện đại"]', IsVisible: true, IsFeatured: false
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.Name.trim()) { alert("Vui lòng nhập tên gói tập."); return; }
    setSaving(true);
    try {
      if (editingPkg) {
        await api.put(`/packages/membership/${editingPkg.PackageID}`, formData);
      } else {
        await api.post("/packages/membership", formData);
      }
      setIsModalOpen(false);
      fetchPackages();
    } catch (err) {
      alert("Lỗi khi lưu gói tập.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa gói này?")) {
      try {
        await api.delete(`/packages/membership/${id}`);
        fetchPackages();
      } catch (err) {
        alert("Lỗi khi xóa gói tập.");
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
          <h1 className={styles.title}>Quản Lý Gói Tập</h1>
          <button 
            onClick={() => handleOpenModal()} 
            className={styles.btnPrimary}
          >
            <Plus size={20} /> Thêm Gói Mới
          </button>
        </div>

        <div className={styles.statGrid}>
          <div className={styles.statCard} style={{ borderLeftColor: "#4e73df" }}>
            <div className={styles.statLabel}>Tổng số gói</div>
            <div className={styles.statVal} style={{ color: "#4e73df" }}>{packages.length}</div>
          </div>
          <div className={styles.statCard} style={{ borderLeftColor: "#1cc88a" }}>
            <div className={styles.statLabel}>Đang hiển thị</div>
            <div className={styles.statVal} style={{ color: "#1cc88a" }}>{packages.filter(p => p.IsVisible).length}</div>
          </div>
          <div className={styles.statCard} style={{ borderLeftColor: "#f6c23e" }}>
            <div className={styles.statLabel}>Nổi bật</div>
            <div className={styles.statVal} style={{ color: "#f6c23e" }}>{packages.filter(p => p.IsFeatured).length}</div>
          </div>
        </div>

        <div className={styles.tools}>
          <div className={styles.searchBox}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm gói tập..." />
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
                <th>Thời Hạn</th>
                <th>Nổi Bật</th>
                <th>Trạng Thái</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {displayedPackages.map((pkg) => (
                <tr key={pkg.PackageID}>
                  <td><div style={{fontWeight: 700, color: "var(--theme-text-dark)"}}>{pkg.Name}</div></td>
                  <td>{pkg.Price.toLocaleString()} đ</td>
                  <td>{pkg.DurationMonths} Tháng</td>
                  <td>
                    {pkg.IsFeatured ? <span className={`${styles.pill} ${styles.pillSky}`}>Có</span> : <span className={`${styles.pill} ${styles.pillMuted}`}>Không</span>}
                  </td>
                  <td>
                    {pkg.IsVisible ? <span className={`${styles.pill} ${styles.pillActive}`}>Hiển thị</span> : <span className={`${styles.pill} ${styles.pillInactive}`}>Ẩn</span>}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button onClick={() => handleOpenModal(pkg)} className={styles.btnIcon} title="Sửa">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(pkg.PackageID)} className={`${styles.btnIcon} ${styles.btnDanger}`} title="Xóa">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {displayedPackages.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: "20px", color: "var(--theme-text)" }}>Không có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        title={editingPkg ? "✏️ Sửa Gói Tập" : "➕ Thêm Gói Tập"}
      >
        <div className={styles.modalBody}>
          <div className={styles.formGrid}>
            <div className={`${styles.field} ${styles.span2}`}>
              <label>Tên Gói <span className={styles.required}>*</span></label>
              <input type="text" className={styles.input} value={formData.Name} onChange={e => setFormData({...formData, Name: e.target.value})} placeholder="VD: Gói Tập 1 Năm..." />
            </div>
            
            <div className={styles.field}>
              <label>Giá Tiền (VNĐ) <span className={styles.required}>*</span></label>
              <input type="number" min={0} className={styles.input} value={formData.Price} onChange={e => setFormData({...formData, Price: e.target.value})} />
            </div>
            
            <div className={styles.field}>
              <label>Thời Hạn (Tháng) <span className={styles.required}>*</span></label>
              <input type="number" min={1} className={styles.input} value={formData.DurationMonths} onChange={e => setFormData({...formData, DurationMonths: e.target.value})} />
            </div>

            <div className={`${styles.field} ${styles.span2}`}>
              <label>Quyền Lợi (Chuỗi JSON Array)</label>
              <textarea rows={3} className={styles.input} value={formData.Benefits} onChange={e => setFormData({...formData, Benefits: e.target.value})} placeholder='["Quyền lợi 1", "Quyền lợi 2"]' />
            </div>

            <div className={`${styles.field} ${styles.span2}`}>
              <label>Mô Tả Ngắn</label>
              <textarea rows={2} className={styles.input} value={formData.Description} onChange={e => setFormData({...formData, Description: e.target.value})} />
            </div>

            <div className={styles.span2} style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
              <label className={styles.checkboxGroup}>
                <input type="checkbox" checked={formData.IsVisible} onChange={e => setFormData({...formData, IsVisible: e.target.checked})} />
                Hiển thị trên Landing Page
              </label>
              <label className={styles.checkboxGroup}>
                <input type="checkbox" checked={formData.IsFeatured} onChange={e => setFormData({...formData, IsFeatured: e.target.checked})} />
                Gói Nổi Bật (Phổ biến nhất)
              </label>
            </div>
          </div>
          
          <div className={styles.formActions}>
            <button type="button" onClick={() => setIsModalOpen(false)} className={styles.btnCancel}>Hủy</button>
            <button type="button" onClick={handleSave} className={styles.btnSave} disabled={saving}>{saving ? "Đang lưu..." : "💾 Lưu Lại"}</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
