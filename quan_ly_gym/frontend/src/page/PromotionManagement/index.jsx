import { useState, useEffect } from "react";
import api from "../../api/axiosClient";
import { Plus, Edit, Trash2 } from "lucide-react";

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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-50">Chương Trình Khuyến Mãi</h1>
        <button 
          onClick={() => handleOpenModal()} 
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg"
        >
          <Plus size={20} /> Thêm Mã Mới
        </button>
      </div>

      <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
        <table className="w-full text-left text-slate-300">
          <thead className="bg-slate-900 border-b border-slate-700">
            <tr>
              <th className="p-4 font-semibold text-slate-50">Mã Khuyến Mãi</th>
              <th className="p-4 font-semibold text-slate-50">Loại Giảm</th>
              <th className="p-4 font-semibold text-slate-50">Mức Giảm</th>
              <th className="p-4 font-semibold text-slate-50">Hạn Sử Dụng</th>
              <th className="p-4 font-semibold text-slate-50">Trạng Thái</th>
              <th className="p-4 font-semibold text-slate-50">Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {promotions.map((promo) => (
              <tr key={promo.PromotionID} className="border-b border-slate-700 hover:bg-slate-700/50">
                <td className="p-4 font-bold text-sky-400">{promo.PromoCode}</td>
                <td className="p-4">{promo.DiscountType === "PERCENT" ? "Phần Trăm (%)" : "Tiền Mặt (VNĐ)"}</td>
                <td className="p-4">
                  {promo.DiscountType === "PERCENT" ? `${promo.DiscountValue}%` : `${promo.DiscountValue.toLocaleString()} đ`}
                </td>
                <td className="p-4">{promo.ExpiryDate ? new Date(promo.ExpiryDate).toLocaleString('vi-VN', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit'}) : "Không thời hạn"}</td>
                <td className="p-4">
                  {promo.IsActive ? <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-sm">Đang kích hoạt</span> : <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-sm">Vô hiệu hóa</span>}
                </td>
                <td className="p-4 flex items-center gap-3">
                  <button onClick={() => handleOpenModal(promo)} className="text-sky-400 hover:text-sky-300">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDelete(promo.PromotionID)} className="text-red-400 hover:text-red-300">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-xl w-full max-w-lg border border-slate-700">
            <h2 className="text-xl font-bold text-slate-50 mb-4">{editingPromo ? "Sửa Mã" : "Thêm Mã Khuyến Mãi"}</h2>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Mã Code (Chữ in hoa viết liền)</label>
                <input required type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-50 outline-none focus:border-sky-500 uppercase" value={formData.PromoCode} onChange={e => setFormData({...formData, PromoCode: e.target.value.toUpperCase()})} />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-slate-400 mb-1">Loại Giảm Giá</label>
                  <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-50 outline-none focus:border-sky-500" value={formData.DiscountType} onChange={e => setFormData({...formData, DiscountType: e.target.value})}>
                    <option value="PERCENT">Theo phần trăm (%)</option>
                    <option value="AMOUNT">Theo tiền mặt (VNĐ)</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-slate-400 mb-1">Mức Giảm</label>
                  <input required type="number" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-50 outline-none focus:border-sky-500" value={formData.DiscountValue} onChange={e => setFormData({...formData, DiscountValue: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Hạn Sử Dụng (Để trống nếu không hết hạn)</label>
                <input type="datetime-local" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-50 outline-none focus:border-sky-500" value={formData.ExpiryDate} onChange={e => setFormData({...formData, ExpiryDate: e.target.value})} />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Mô Tả Ngắn</label>
                <textarea rows={2} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-50 outline-none focus:border-sky-500" value={formData.Description} onChange={e => setFormData({...formData, Description: e.target.value})} />
              </div>
              <div>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={formData.IsActive} onChange={e => setFormData({...formData, IsActive: e.target.checked})} className="accent-sky-500 w-4 h-4" />
                  Kích hoạt mã này
                </label>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg">Lưu Lại</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
