import { useState, useEffect } from "react";
import api from "../../api/axiosClient";
import { Plus, Edit, Trash2, Tag } from "lucide-react";
import styles from "./PromotionManagement.module.scss";

export default function PromotionManagement() {
  const [promotions, setPromotions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [formData, setFormData] = useState({
    PromoCode: "", DiscountType: "PERCENT", DiscountValue: 0, ExpiryDate: "", IsActive: true, Description: ""
  });

  const fetchPromotions = async () => {
    try {
      const res = await api.get("/packages/promotions");
      setPromotions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleOpenModal = (promo = null) => {
    if (promo) {
      setEditingPromo(promo);
      setFormData({
        PromoCode: promo.PromoCode,
        DiscountType: promo.DiscountType,
        DiscountValue: promo.DiscountValue,
        ExpiryDate: promo.ExpiryDate ? new Date(new Date(promo.ExpiryDate).getTime() - (new Date(promo.ExpiryDate).getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : "",
        IsActive: promo.IsActive,
        Description: promo.Description || ""
      });
    } else {
      setEditingPromo(null);
      setFormData({
        PromoCode: "", DiscountType: "PERCENT", DiscountValue: 0, ExpiryDate: "", IsActive: true, Description: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.ExpiryDate) payload.ExpiryDate = null;
      else payload.ExpiryDate = new Date(payload.ExpiryDate).toISOString();

      if (editingPromo) {
        await api.put(`/packages/promotions/${editingPromo.PromotionID}`, payload);
      } else {
        await api.post("/packages/promotions", payload);
      }
      setIsModalOpen(false);
      fetchPromotions();
    } catch (err) {
      alert("Lỗi khi lưu mã khuyến mãi.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa mã này?")) {
      try {
        await api.delete(`/packages/promotions/${id}`);
        fetchPromotions();
      } catch (err) {
        alert("Lỗi khi xóa mã.");
      }
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <Tag size={26} color="var(--theme-primary)" /> Chương Trình Khuyến Mãi
          </h1>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className={styles.btnPrimary}
        >
          <Plus size={18} /> Thêm Mã Mới
        </button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Mã Khuyến Mãi</th>
              <th>Loại Giảm</th>
              <th>Mức Giảm</th>
              <th>Hạn Sử Dụng</th>
              <th>Trạng Thái</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {promotions.map((promo) => (
              <tr key={promo.PromotionID}>
                <td style={{ fontWeight: 800, color: "var(--theme-primary)" }}>{promo.PromoCode}</td>
                <td>{promo.DiscountType === "PERCENT" ? "Phần Trăm (%)" : "Tiền Mặt (VNĐ)"}</td>
                <td style={{ fontWeight: 700 }}>
                  {promo.DiscountType === "PERCENT" ? `${promo.DiscountValue}%` : `${promo.DiscountValue.toLocaleString()} đ`}
                </td>
                <td>{promo.ExpiryDate ? new Date(promo.ExpiryDate).toLocaleString('vi-VN', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit'}) : "Không thời hạn"}</td>
                <td>
                  {promo.IsActive ? <span className={`${styles.pill} ${styles.pillActive}`}>Đang kích hoạt</span> : <span className={`${styles.pill} ${styles.pillInactive}`}>Vô hiệu hóa</span>}
                </td>
                <td>
                  <div className={styles.actions}>
                    <button onClick={() => handleOpenModal(promo)} className={`${styles.btnIcon} ${styles.btnEdit}`}>
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(promo.PromotionID)} className={`${styles.btnIcon} ${styles.btnDanger}`}>
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
            <h2 className={styles.modalTitle}>{editingPromo ? "✏️ Sửa Mã" : "➕ Thêm Mã Khuyến Mãi"}</h2>
            <form onSubmit={handleSave} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Mã Code (Chữ in hoa viết liền)</label>
                <input required type="text" value={formData.PromoCode} onChange={e => setFormData({...formData, PromoCode: e.target.value.toUpperCase()})} />
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Loại Giảm Giá</label>
                  <select value={formData.DiscountType} onChange={e => setFormData({...formData, DiscountType: e.target.value})}>
                    <option value="PERCENT">Theo phần trăm (%)</option>
                    <option value="AMOUNT">Theo tiền mặt (VNĐ)</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Mức Giảm</label>
                  <input required type="number" value={formData.DiscountValue} onChange={e => setFormData({...formData, DiscountValue: e.target.value})} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Hạn Sử Dụng (Để trống nếu không hết hạn)</label>
                <input type="datetime-local" value={formData.ExpiryDate} onChange={e => setFormData({...formData, ExpiryDate: e.target.value})} />
              </div>
              <div className={styles.formGroup}>
                <label>Mô Tả Ngắn</label>
                <textarea rows={2} value={formData.Description} onChange={e => setFormData({...formData, Description: e.target.value})} />
              </div>
              <div>
                <label className={styles.checkboxGroup}>
                  <input type="checkbox" checked={formData.IsActive} onChange={e => setFormData({...formData, IsActive: e.target.checked})} />
                  Kích hoạt mã này
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
