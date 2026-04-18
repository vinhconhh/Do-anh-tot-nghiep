import { useState, useMemo } from "react";
import { Bot, Coins, Receipt, Download, ShoppingCart } from "lucide-react";
import styles from "./AiPurchase.module.scss";

const PACKAGES = [
  { id: 1, label: "Gói nhỏ",    qty: 20,  price: 240000,  savings: "12,000đ/lượt",  desc: "30 ngày hỗ trợ",       color: "#4e73df" },
  { id: 2, label: "Gói phổ biến", qty: 50, price: 600000, savings: "Ưu đãi 5%",    desc: "60 ngày hỗ trợ",       color: "#1cc88a", popular: true },
];

const STATUS_META = {
  success: { label: "Thành công", color: "#1cc88a" },
  pending: { label: "Chờ xử lý", color: "#f6c23e" },
  failed:  { label: "Thất bại",  color: "#e74a3b" },
};

export default function AiPurchase() {
  const [history] = useState([]);
  const [q, setQ] = useState("");
  const [buying, setBuying] = useState(null);

  const filtered = useMemo(() =>
    history.filter((r) => !q || r.date.includes(q) || r.status.includes(q)),
    [history, q]
  );

  const handleBuy = async (pkg) => {
    setBuying(pkg.id);
    await new Promise((r) => setTimeout(r, 800));
    alert(`✅ Mua thành công gói ${pkg.label} — ${pkg.qty} lượt AI!\nSố dư đã được cập nhật.`);
    setBuying(null);
  };

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
            Số lượt hiện tại: <strong>0</strong>
          </span>
        </div>

        {/* Summary cards */}
        <div className={styles.statGrid}>
          {[
            { label: "Lượt AI còn lại", val: "0",     icon: <Bot size={28} color="#d1d3e2" />,     border: "#4e73df" },
            { label: "Giá mỗi lượt",    val: "12,000đ", icon: <Coins size={28} color="#d1d3e2" />,   border: "#1cc88a" },
            { label: "Gói mua gần đây", val: "—", icon: <Receipt size={28} color="#d1d3e2" />, border: "#36b9cc" },
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
          {PACKAGES.map((pkg) => (
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
            <button className={styles.exportBtn}>
              <Download size={14} /> Xuất báo cáo
            </button>
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
                  const sm = STATUS_META[r.status];
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
      </div>
    </>
  );
}
