import { useState, useEffect } from "react";
import api from "../../api/axiosClient";
import { Plus, Edit, Trash2 } from "lucide-react";

export default function AiPackageManagement() {
  const [packages, setPackages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [formData, setFormData] = useState({
    TenGoi: "", Gia: 0, SoLuot: 10, MoTa: "", HienThi: true
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
        TenGoi: pkg.TenGoi,
        Gia: pkg.Gia,
        SoLuot: pkg.SoLuot,
        MoTa: pkg.MoTa || "",
        HienThi: pkg.HienThi
      });
    } else {
      setEditingPkg(null);
      setFormData({
        TenGoi: "", Gia: 0, SoLuot: 50, MoTa: "", HienThi: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingPkg) {
        await api.put(`/packages/ai/${editingPkg.MaGoiAi}`, formData);
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-50">Cấu Hình Gói AI</h1>
        <button 
          onClick={() => handleOpenModal()} 
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg"
        >
          <Plus size={20} /> Thêm Gói Mới
        </button>
      </div>

      <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
        <table className="w-full text-left text-slate-300">
          <thead className="bg-slate-900 border-b border-slate-700">
            <tr>
              <th className="p-4 font-semibold text-slate-50">Tên Gói</th>
              <th className="p-4 font-semibold text-slate-50">Giá (VNĐ)</th>
              <th className="p-4 font-semibold text-slate-50">Số Lượt</th>
              <th className="p-4 font-semibold text-slate-50">Trạng Thái</th>
              <th className="p-4 font-semibold text-slate-50">Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {packages.map((pkg) => (
              <tr key={pkg.MaGoiAi} className="border-b border-slate-700 hover:bg-slate-700/50">
                <td className="p-4">{pkg.TenGoi}</td>
                <td className="p-4">{pkg.Gia.toLocaleString()} đ</td>
                <td className="p-4">{pkg.SoLuot} lượt</td>
                <td className="p-4">
                  {pkg.HienThi ? <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-sm">Hiển thị</span> : <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-sm">Ẩn</span>}
                </td>
                <td className="p-4 flex items-center gap-3">
                  <button onClick={() => handleOpenModal(pkg)} className="text-sky-400 hover:text-sky-300">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDelete(pkg.MaGoiAi)} className="text-red-400 hover:text-red-300">
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
            <h2 className="text-xl font-bold text-slate-50 mb-4">{editingPkg ? "Sửa Gói AI" : "Thêm Gói AI"}</h2>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Tên Gói</label>
                <input required type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-50 outline-none focus:border-sky-500" value={formData.TenGoi} onChange={e => setFormData({...formData, TenGoi: e.target.value})} />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-slate-400 mb-1">Giá Tiền</label>
                  <input required type="number" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-50 outline-none focus:border-sky-500" value={formData.Gia} onChange={e => setFormData({...formData, Gia: e.target.value})} />
                </div>
                <div className="flex-1">
                  <label className="block text-slate-400 mb-1">Số Lượt AI</label>
                  <input required type="number" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-50 outline-none focus:border-sky-500" value={formData.SoLuot} onChange={e => setFormData({...formData, SoLuot: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Mô Tả Ngắn</label>
                <textarea rows={2} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-50 outline-none focus:border-sky-500" value={formData.MoTa} onChange={e => setFormData({...formData, MoTa: e.target.value})} />
              </div>
              <div>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={formData.HienThi} onChange={e => setFormData({...formData, HienThi: e.target.checked})} className="accent-sky-500 w-4 h-4" />
                  Hiển thị trên mục Mua Lượt AI
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
