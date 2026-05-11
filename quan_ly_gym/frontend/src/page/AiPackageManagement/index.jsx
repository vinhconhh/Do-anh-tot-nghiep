import { useState, useEffect } from "react";
import api from "../../api/axiosClient";
import { Plus, Edit, Trash2, Cpu } from "lucide-react";
import styles from "./AiPackageManagement.module.scss";

export default function AiPackageManagement() {
  const [packages, setPackages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [formData, setFormData] = useState({
    Name: "", Price: 0, Credits: 10, Description: "", IsVisible: true
  });

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

  return (
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
            {packages.map((pkg) => (
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
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>{editingPkg ? "✏️ Sửa Gói AI" : "➕ Thêm Gói AI"}</h2>
            <form onSubmit={handleSave} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Tên Gói</label>
                <input required type="text" value={formData.Name} onChange={e => setFormData({...formData, Name: e.target.value})} />
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Giá Tiền (VNĐ)</label>
                  <input required type="number" value={formData.Price} onChange={e => setFormData({...formData, Price: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Số Lượt AI</label>
                  <input required type="number" value={formData.Credits} onChange={e => setFormData({...formData, Credits: e.target.value})} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Mô Tả Ngắn</label>
                <textarea rows={2} value={formData.Description} onChange={e => setFormData({...formData, Description: e.target.value})} />
              </div>
              <div>
                <label className={styles.checkboxGroup}>
                  <input type="checkbox" checked={formData.IsVisible} onChange={e => setFormData({...formData, IsVisible: e.target.checked})} />
                  Hiển thị trên mục Mua Lượt AI
                </label>
              </div>
              <div className={styles.formActions}>
                <button type="button" onClick={() => setIsModalOpen(false)} className={styles.btnGhost}>Hủy</button>
                <button type="submit" className={styles.btnPrimary}>Lưu Lại</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
