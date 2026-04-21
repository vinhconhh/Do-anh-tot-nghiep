import { useState, useMemo, useEffect, useCallback, useContext } from "react";
import { Bot, Coins, Receipt, Download, ShoppingCart, Loader2 } from "lucide-react";
import styles from "./AiPurchase.module.scss";
import { AuthContext } from "../../context/AuthContext";
import { authedRequestJson } from "../../api/client";

const STATUS_META = {
  success: { label: "Thành công", color: "#1cc88a" },
  paid: { label: "Thành công", color: "#1cc88a" },
  pending: { label: "Chờ xử lý", color: "#f6c23e" },
  failed:  { label: "Thất bại",  color: "#e74a3b" },
};

const PACKAGES_UI = [
  { id: 1, label: "Gói nhỏ",    qty: 20,  price: 240000,  savings: "12,000đ/lượt",  desc: "30 ngày hỗ trợ",       color: "#4e73df" },
  { id: 2, label: "Gói phổ biến", qty: 50, price: 600000, savings: "Ưu đãi 5%",    desc: "60 ngày hỗ trợ",       color: "#1cc88a", popular: true },
];

export default function AiPurchase() {
  const { token, logout } = useContext(AuthContext) ?? {};
  const [quota, setQuota] = useState({ quota: 0, used: 0, remaining: 0 });
  const [history, setHistory] = useState([]);
  const [q, setQ] = useState("");
  const [buying, setBuying] = useState(null);
  const [loading, setLoading] = useState(true);

  const aj = useCallback(
    async (path, opt = {}) => {
      try {
        return await authedRequestJson(path, token, opt);
      } catch (e) {
        if (e?.status === 401) logout?.();
        throw e;
      }
    },
    [token, logout]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [q, h] = await Promise.all([
        aj("/api/ai/quota"),
        aj("/api/ai/purchase-history"),
      ]);
      setQuota(q);
      setHistory(h);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [aj]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() =>
    history.filter((r) => !q || r.date.includes(q) || r.status.includes(q)),
    [history, q]
  );

  const handleBuy = async (pkg) => {
    if (!window.confirm(`Xác nhận mua ${pkg.label} (${pkg.qty} lượt) với giá ${pkg.price.toLocaleString("vi-VN")}đ?`)) return;
    setBuying(pkg.id);
    try {
      const result = await aj("/api/ai/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id }),
      });
      alert(`✅ ${result.message}\nSố lượt mới: ${result.newQuota}`);
      fetchData(); // Refresh data
    } catch (e) {
      alert("❌ Mua thất bại: " + (e.data?.detail || e.message));
    } finally {
      setBuying(null);
    }
  };

  const lastPurchase = history.length > 0 ? history[0] : null;

  return (
    <>
      <div className={styles.tab} />
      <div className={styles.page}>
        {/* Heading */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            <ShoppingCart size={20} /> Mua thêm lượt AI
          </h2>
          <span className={styles.currentQuota}>
            Số lượt hiện tại: <strong>{loading ? "..." : quota.remaining}</strong>
          </span>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: 40, color: "#858796" }}>
            <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} /> Đang tải...
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className={styles.statGrid}>
              {[
                { label: "Lượt AI còn lại", val: String(quota.remaining), icon: <Bot size={28} color="#d1d3e2" />, border: "#4e73df" },
                { label: "Đã sử dụng",      val: String(quota.used),      icon: <Coins size={28} color="#d1d3e2" />, border: "#1cc88a" },
                { label: "Gói mua gần đây",  val: lastPurchase ? `${lastPurchase.qty} lượt` : "—", icon: <Receipt size={28} color="#d1d3e2" />, border: "#36b9cc" },
              ].map((s) => (
                <div key={s.label} className={styles.statCard} style={{ borderLeftColor: s.border }}>
                  <div className={styles.statInfo}>
                    <div className={styles.statLabel}>{s.label}</div>
                    <div className={styles.statVal}>{s.val}</div>
                  </div>
                  {s.icon}
                </div>
              ))}
            </div>

            {/* Packages */}
            <div className={styles.packagesGrid}>
              {PACKAGES_UI.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`${styles.packageCard} ${pkg.popular ? styles.popular : ""}`}
                  style={{ borderColor: pkg.popular ? pkg.color : undefined }}
                >
                  {pkg.popular && (
                    <div className={styles.popularBadge} style={{ background: pkg.color }}>
                      ⭐ Phổ biến nhất
                    </div>
                  )}
                  <div className={styles.pkgLabel} style={{ color: pkg.color }}>{pkg.label}</div>
                  <div className={styles.pkgQty}>{pkg.qty} lượt</div>
                  <div className={styles.pkgPrice}>{pkg.price.toLocaleString("vi-VN")}đ</div>
                  <ul className={styles.pkgFeatures}>
                    <li>✅ Thêm {pkg.qty} lượt AI</li>
                    <li>✅ {pkg.desc}</li>
                    <li>✅ {pkg.savings}</li>
                    <li>✅ Lượt không bao giờ hết hạn</li>
                  </ul>
                  <button
                    className={styles.buyBtn}
                    style={{ background: pkg.color }}
                    onClick={() => handleBuy(pkg)}
                    disabled={buying === pkg.id}
                  >
                    {buying === pkg.id ? "Đang xử lý..." : "Chọn gói này"}
                  </button>
                </div>
              ))}
            </div>

            {/* History table */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h6 className={styles.cardTitle}>Lịch sử mua lượt AI</h6>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Ngày</th>
                      <th>Số lượt</th>
                      <th>Giá</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr><td colSpan={4} style={{ textAlign: "center", padding: "20px", color: "#858796" }}>Không có dữ liệu</td></tr>
                    )}
                    {filtered.map((r, i) => {
                      const sm = STATUS_META[r.status] || STATUS_META.pending;
                      return (
                        <tr key={i}>
                          <td>{r.date}</td>
                          <td><strong>{r.qty} lượt</strong></td>
                          <td>{r.price}</td>
                          <td>
                            <span className={styles.statusBadge} style={{ background: sm.color + "22", color: sm.color }}>
                              {sm.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
