import { useState } from "react";
import { Check, Shield, Star, Crown, Info } from "lucide-react";
import styles from "./Billing.module.scss";
import Modal from "../../components/Modal";

const TIERS = [
  {
    key: "silver",
    name: "Silver",
    displayName: "Phổ thông",
    price: "499k",
    icon: <Shield size={40} color="#bdc3c7" />,
    color: "#bdc3c7",
    features: ["10 lượt AI / tháng", "Tracking cơ bản", "Hỗ trợ chuẩn (Email)"],
    benefits: [
      { label: "Quota AI", text: "10 lượt/tháng." },
      { label: "Tư vấn PT", text: "Không hỗ trợ." },
      { label: "Lịch sử tracking", text: "Lưu trữ 1 tháng gần nhất." },
      { label: "Phân tích", text: "Hiển thị biểu đồ cơ bản." },
      { label: "Hỗ trợ khách hàng", text: "Tiêu chuẩn (qua Email)." },
    ],
  },
  {
    key: "gold",
    name: "Gold",
    displayName: "Tiêu chuẩn",
    price: "999k",
    icon: <Star size={40} color="#f6c23e" />,
    color: "#f6c23e",
    features: ["50 lượt AI / tháng", "1 lần tư vấn PT", "Tracking 6 tháng"],
    benefits: [
      { label: "Quota AI", text: "50 lượt/tháng." },
      { label: "Tư vấn PT", text: "1 lần/tháng." },
      { label: "Lịch sử tracking", text: "Lưu trữ 6 tháng." },
      { label: "Phân tích", text: "Biểu đồ biến thiên chỉ số." },
      { label: "Hỗ trợ khách hàng", text: "Ưu tiên (qua Chat/Ticket)." },
    ],
  },
  {
    key: "platinum",
    name: "Platinum",
    displayName: "Cao cấp",
    price: "2.49M",
    icon: <Crown size={40} color="#4e73df" />,
    color: "#4e73df",
    features: ["Lượt AI không giới hạn", "Hỗ trợ PT 24/7", "Dự báo mục tiêu AI"],
    benefits: [
      { label: "Quota AI", text: "Không giới hạn." },
      { label: "Tư vấn PT", text: "Hỗ trợ 24/7 (Ưu tiên cao nhất)." },
      { label: "Lịch sử tracking", text: "Lưu trữ trọn đời." },
      { label: "Phân tích", text: "Dự báo mục tiêu (AI phân tích sâu)." },
      { label: "Hỗ trợ khách hàng", text: "Chuyên trách (1-1)." },
    ],
  },
];

export default function Billing() {
  const [selectedTier, setSelectedTier] = useState(null);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Gói tập & Hạng thành viên</h1>
        <p className={styles.subtitle}>Chọn gói hội viên phù hợp để tối ưu trải nghiệm tập luyện của bạn</p>
      </div>

      <div className={styles.tierGrid}>
        {TIERS.map((t) => (
          <div 
            key={t.key} 
            className={`${styles.tierCard} ${styles[t.key]}`}
            onClick={() => setSelectedTier(t)}
          >
            <div className={styles.tierHeader}>
              <div className={styles.tierIcon}>{t.icon}</div>
              <h3 className={styles.tierName}>{t.name}</h3>
              <div className={styles.tierDisplayName}>{t.displayName}</div>
              <div className={styles.price}>{t.price}<span>/tháng</span></div>
            </div>

            <ul className={styles.featureList}>
              {t.features.map((f, i) => (
                <li key={i} className={styles.featureItem}>
                  <Check size={16} className={styles.icon} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <button className={styles.selectBtn}>
              <Info size={16} style={{ marginRight: 6 }} /> Xem chi tiết
            </button>
          </div>
        ))}
      </div>

      {selectedTier && (
        <Modal 
          isOpen={!!selectedTier} 
          onRequestClose={() => setSelectedTier(null)}
          title={`Quyền lợi hạng ${selectedTier.name} (${selectedTier.displayName})`}
        >
          <div className={styles.modalContent}>
            <ul className={styles.benefitList}>
              {selectedTier.benefits.map((b, i) => (
                <li key={i} className={styles.benefitItem}>
                  <strong>{b.label}</strong>
                  <span>{b.text}</span>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 24, textAlign: "right" }}>
              <button 
                className={styles.selectBtn} 
                style={{ width: "auto", padding: "10px 24px", background: selectedTier.color, color: "#fff", borderColor: selectedTier.color }}
                onClick={() => setSelectedTier(null)}
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
