import { useState, useEffect } from "react";
import api from "../../api/axiosClient";
import { Plus, Edit, Trash2, Tag, Search } from "lucide-react";
import Modal from "../../components/Modal";
import styles from "./PromotionManagement.module.scss";

export default function PromotionManagement() {
  const [promotions, setPromotions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [formData, setFormData] = useState({
    PromoCode: "", DiscountType: "PERCENT", DiscountValue: 0, ExpiryDate: "", IsActive: true, Description: ""
  });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterSt, setFilterSt] = useState("all");

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
    if (!formData.PromoCode.trim()) { alert("Vui lòng nhập mã code."); return; }
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
    } finally {
      setSaving(false);
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

  const displayedPromos = promotions.filter(p => {
    const matchSearch = !search || p.PromoCode?.toLowerCase().includes(search.toLowerCase());
    const matchSt = filterSt === "all" || (filterSt === "active" ? p.IsActive : !p.IsActive);
    return matchSearch && matchSt;
  });

  return (
    <>
      <div className={styles.tab} />
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

      <div className={styles.statGrid}>
        <div className={styles.statCard} style={{ borderLeftColor: "#4e73df" }}>
          <div className={styles.statLabel}>Tổng mã</div>
          <div className={styles.statVal} style={{ color: "#4e73df" }}>{promotions.length}</div>
        </div>
        <div className={styles.statCard} style={{ borderLeftColor: "#1cc88a" }}>
          <div className={styles.statLabel}>Đang kích hoạt</div>
          <div className={styles.statVal} style={{ color: "#1cc88a" }}>{promotions.filter(p => p.IsActive).length}</div>
        </div>
      </div>

      <div className={styles.tools}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm mã khuyến mãi..." />
          {search && <button className={styles.clear} onClick={() => setSearch("")}>×</button>}
        </div>

        <div className={styles.filterGroup}>
          {["all", "active", "inactive"].map((s) => (
            <button
              key={s}
              className={`${styles.filterBtn} ${filterSt === s ? styles.filterActive : ""}`}
              onClick={() => setFilterSt(s)}
            >
              {{ all: "Tất cả", active: "Kích hoạt", inactive: "Vô hiệu hóa" }[s]}
            </button>
          ))}
        </div>
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
            {displayedPromos.map((promo) => (
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
            {displayedPromos.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: "20px", color: "var(--theme-text)" }}>Không có dữ liệu</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        title={editingPromo ? "✏️ Sửa Mã Khuyến Mãi" : "➕ Thêm Mã Khuyến Mãi"}
      >
        <div className={styles.modalBody}>
          <div className={styles.formGrid}>
            <div className={`${styles.field} ${styles.span2}`}>
              <label>Mã Code (Chữ in hoa viết liền) <span className={styles.required}>*</span></label>
              <input type="text" className={styles.input} value={formData.PromoCode} onChange={e => setFormData({...formData, PromoCode: e.target.value.toUpperCase()})} />
            </div>
            <div className={styles.field}>
              <label>Loại Giảm Giá <span className={styles.required}>*</span></label>
              <select className={styles.input} value={formData.DiscountType} onChange={e => setFormData({...formData, DiscountType: e.target.value})}>
                <option value="PERCENT">Theo phần trăm (%)</option>
                <option value="AMOUNT">Theo tiền mặt (VNĐ)</option>
              </select>
            </div>
            <div className={styles.field}>
              <label>Mức Giảm <span className={styles.required}>*</span></label>
              <input type="number" className={styles.input} value={formData.DiscountValue} onChange={e => setFormData({...formData, DiscountValue: e.target.value})} />
            </div>
            <div className={`${styles.field} ${styles.span2}`}>
              <label>Hạn Sử Dụng (Để trống nếu không hết hạn)</label>
              <input type="datetime-local" className={styles.input} value={formData.ExpiryDate} onChange={e => setFormData({...formData, ExpiryDate: e.target.value})} />
            </div>
            <div className={`${styles.field} ${styles.span2}`}>
              <label>Mô Tả Ngắn</label>
              <textarea rows={2} className={styles.input} value={formData.Description} onChange={e => setFormData({...formData, Description: e.target.value})} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label className={styles.checkboxGroup}>
              <input type="checkbox" checked={formData.IsActive} onChange={e => setFormData({...formData, IsActive: e.target.checked})} />
              Kích hoạt mã này
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
