import { useState, useEffect, useCallback } from "react";
import {
  Plus, Pencil, Trash2, Flame, ChevronDown, ChevronUp, X, Save, Loader2, Search
} from "lucide-react";
import Modal from "../../components/Modal";
import styles from "./MealPlanManagement.module.scss";

const CATEGORIES = ["Bữa sáng", "Bữa trưa", "Bữa phụ", "Bữa tối"];
const GOALS = ["tăng cơ", "giảm mỡ", "duy trì", "phục hồi"];

const EMPTY_FORM = {
  name: "",
  category: "Bữa trưa",
  goal: "",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
  description: "",
  image_url: "",
};

export default function MealPlanManagement() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");

  const fetchMeals = useCallback(async () => {
    setLoading(true);
    try {
      const { default: api } = await import("../../api/axiosClient");
      const res = await api.get("/meal-plans");
      setMeals(res.data);
    } catch {
      setMeals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMeals(); }, [fetchMeals]);

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (meal) => {
    setEditId(meal.id);
    setForm({
      name: meal.name || "",
      category: meal.category || "Bữa trưa",
      goal: meal.goal || "",
      calories: meal.calories ?? "",
      protein: meal.protein ?? "",
      carbs: meal.carbs ?? "",
      fat: meal.fat ?? "",
      description: meal.description || "",
      image_url: meal.imageUrl || "",
    });
    setFormError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError("Vui lòng nhập tên bữa ăn."); return; }
    if (!form.category) { setFormError("Vui lòng chọn loại bữa."); return; }
    setSaving(true);
    setFormError("");
    try {
      const { default: api } = await import("../../api/axiosClient");
      const body = {
        name: form.name.trim(),
        category: form.category,
        goal: form.goal || null,
        calories: parseInt(form.calories) || 0,
        protein: parseFloat(form.protein) || 0,
        carbs: parseFloat(form.carbs) || 0,
        fat: parseFloat(form.fat) || 0,
        description: form.description.trim() || null,
        image_url: form.image_url.trim() || null,
      };
      if (editId) {
        await api.put(`/meal-plans/${editId}`, body);
      } else {
        await api.post("/meal-plans", body);
      }
      setShowModal(false);
      fetchMeals();
    } catch (e) {
      setFormError(e?.response?.data?.detail || "Lỗi khi lưu thực đơn.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bữa ăn này sẽ bị xóa vĩnh viễn khỏi danh sách. Xác nhận xóa?")) return;
    try {
      const { default: api } = await import("../../api/axiosClient");
      await api.delete(`/meal-plans/${id}`);
      fetchMeals();
    } catch (e) {
      alert(e?.response?.data?.detail || "Lỗi khi xóa thực đơn.");
    }
  };

  const f = (v) => e => setForm(prev => ({ ...prev, [v]: e.target.value }));

  const displayedMeals = meals.filter(m => {
    const matchSearch = !search || m.name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || m.category === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <>
      <div className={styles.tab} />
      <div className={styles.page}>
        {}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}><Flame size={22} /> Quản lý Thực đơn</h2>
            <p className={styles.subtitle}>Thêm, sửa, xóa các bữa ăn hiển thị cho hội viên</p>
          </div>
          <button className={styles.btnAdd} onClick={openCreate}>
            <Plus size={16} /> Thêm bữa ăn
          </button>
        </div>

        {}
        <div className={styles.statGrid}>
          <div className={styles.statCard} style={{ borderLeftColor: "#4e73df" }}>
            <div className={styles.statLabel}>Tổng cộng</div>
            <div className={styles.statVal} style={{ color: "#4e73df" }}>{meals.length}</div>
          </div>
          {CATEGORIES.map((cat, idx) => {
            const count = meals.filter(m => m.category === cat).length;
            const colors = ["#1cc88a", "#f6c23e", "#36b9cc", "#e74a3b"];
            const color = colors[idx % colors.length];
            return (
              <div key={cat} className={styles.statCard} style={{ borderLeftColor: color }}>
                <div className={styles.statLabel}>{cat}</div>
                <div className={styles.statVal} style={{ color: color }}>{count}</div>
              </div>
            );
          })}
        </div>

        <div className={styles.tools}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm bữa ăn..." />
            {search && <button className={styles.clear} onClick={() => setSearch("")}>×</button>}
          </div>

          <div className={styles.filterGroup}>
            {["all", ...CATEGORIES].map((c) => (
              <button
                key={c}
                className={`${styles.filterBtn} ${(filterCat || "all") === c ? styles.filterActive : ""}`}
                onClick={() => setFilterCat(c)}
              >
                {c === "all" ? "Tất cả" : c}
              </button>
            ))}
          </div>
        </div>

        {}
        <div className={styles.tableCard}>
          {loading ? (
            <div className={styles.emptyState}>
              <Loader2 size={32} className={styles.spinner} />
              <div>Đang tải thực đơn...</div>
            </div>
          ) : displayedMeals.length === 0 ? (
            <div className={styles.emptyState}>
              <div style={{ fontSize: "3rem", marginBottom: 12 }}>🍽️</div>
              <div style={{ fontSize: "1.3rem", marginBottom: 8 }}>Không tìm thấy bữa ăn nào</div>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Tên bữa ăn</th>
                    <th>Loại</th>
                    <th>Mục tiêu</th>
                    <th className={styles.center}>Calories</th>
                    <th className={styles.center}>Protein</th>
                    <th className={styles.center}>Carbs</th>
                    <th className={styles.center}>Fat</th>
                    <th className={styles.center}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedMeals.map((meal, idx) => {
                    const isExp = expandedId === meal.id;
                    return (
                      <>
                        <tr
                          key={meal.id}
                          className={styles.row}
                          onClick={() => setExpandedId(isExp ? null : meal.id)}
                          style={{ cursor: "pointer" }}
                        >
                          <td className={styles.idx}>{idx + 1}</td>
                          <td>
                            <strong className={styles.mealName}>{meal.name}</strong>
                          </td>
                          <td>
                            <span className={styles.catBadge}>{meal.category}</span>
                          </td>
                          <td>
                            {meal.goal ? (
                              <span className={styles.goalBadge}>{meal.goal}</span>
                            ) : (
                              <span className={styles.noGoal}>—</span>
                            )}
                          </td>
                          <td className={styles.center}>
                            <strong style={{ color: "#f6c23e" }}>{meal.calories}</strong>
                            <span style={{ color: "#64748b", fontSize: "0.8rem" }}> kcal</span>
                          </td>
                          <td className={styles.center} style={{ color: "#1cc88a" }}>{meal.protein}g</td>
                          <td className={styles.center} style={{ color: "#36b9cc" }}>{meal.carbs}g</td>
                          <td className={styles.center} style={{ color: "#e2a03f" }}>{meal.fat}g</td>
                          <td className={styles.center} onClick={e => e.stopPropagation()}>
                            <div className={styles.actions}>
                              <button
                                className={styles.btnEdit}
                                onClick={() => openEdit(meal)}
                                title="Sửa"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                className={styles.btnDanger}
                                onClick={() => handleDelete(meal.id)}
                                title="Xóa"
                              >
                                <Trash2 size={14} />
                              </button>
                              <button
                                className={styles.btnIcon}
                                onClick={() => setExpandedId(isExp ? null : meal.id)}
                                title="Chi tiết"
                              >
                                {isExp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExp && (
                          <tr key={`${meal.id}-detail`} className={styles.detailRow}>
                            <td colSpan={9}>
                              <div className={styles.detailBox}>
                                {meal.description ? (
                                  <div className={styles.detailDesc}>
                                    📝 <strong>Mô tả:</strong> {meal.description}
                                  </div>
                                ) : (
                                  <div className={styles.detailDesc} style={{ color: "#64748b" }}>
                                    Chưa có mô tả / hướng dẫn chế biến.
                                  </div>
                                )}
                                <div className={styles.macroBar}>
                                  {[
                                    { label: "Protein", val: meal.protein, unit: "g", color: "#1cc88a" },
                                    { label: "Carbs", val: meal.carbs, unit: "g", color: "#36b9cc" },
                                    { label: "Fat", val: meal.fat, unit: "g", color: "#f6c23e" },
                                    { label: "Calories", val: meal.calories, unit: "kcal", color: "#e74a3b" },
                                  ].map(m => (
                                    <div key={m.label} className={styles.macroItem}>
                                      <div className={styles.macroVal} style={{ color: m.color }}>{m.val}{m.unit}</div>
                                      <div className={styles.macroLabel}>{m.label}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Modal
          isOpen={showModal}
          onRequestClose={() => setShowModal(false)}
          title={editId ? "✏️ Sửa bữa ăn" : "➕ Thêm bữa ăn mới"}
        >
          <div className={styles.modalBody}>
            <div className={styles.formGrid}>
              {}
              <div className={`${styles.field} ${styles.span2}`}>
                <label>Tên bữa ăn <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={f("name")}
                  placeholder="VD: Ức gà áp chảo & Khoai lang"
                  className={styles.input}
                />
              </div>

              {}
              <div className={styles.field}>
                <label>Loại bữa <span className={styles.required}>*</span></label>
                <select value={form.category} onChange={f("category")} className={styles.input}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {}
              <div className={styles.field}>
                <label>Mục tiêu</label>
                <select value={form.goal} onChange={f("goal")} className={styles.input}>
                  <option value="">-- Không chỉ định --</option>
                  {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              {}
              <div className={styles.field}>
                <label>🔥 Calories (kcal)</label>
                <input type="number" min="0" value={form.calories} onChange={f("calories")} className={styles.input} placeholder="350" />
              </div>
              <div className={styles.field}>
                <label>🥩 Protein (g)</label>
                <input type="number" min="0" step="0.1" value={form.protein} onChange={f("protein")} className={styles.input} placeholder="40" />
              </div>
              <div className={styles.field}>
                <label>🍚 Carbs (g)</label>
                <input type="number" min="0" step="0.1" value={form.carbs} onChange={f("carbs")} className={styles.input} placeholder="30" />
              </div>
              <div className={styles.field}>
                <label>🥑 Fat (g)</label>
                <input type="number" min="0" step="0.1" value={form.fat} onChange={f("fat")} className={styles.input} placeholder="5" />
              </div>

              {}
              <div className={`${styles.field} ${styles.span2}`}>
                <label>Mô tả / Hướng dẫn chế biến</label>
                <textarea
                  value={form.description}
                  onChange={f("description")}
                  rows={3}
                  className={styles.input}
                  placeholder="Hướng dẫn nấu ăn, lưu ý dinh dưỡng..."
                  style={{ resize: "vertical", minHeight: 80 }}
                />
              </div>
            </div>

            {formError && <div className={styles.formError}>{formError}</div>}
          </div>

          <div className={styles.formActions}>
            <button type="button" onClick={() => setShowModal(false)} className={styles.btnCancel}>Hủy</button>
            <button type="button" onClick={handleSave} className={styles.btnSave} disabled={saving}>{saving ? "Đang lưu..." : "💾 Lưu"}</button>
          </div>
        </Modal>
      </div>
    </>
  );
}
