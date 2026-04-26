import { Link } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/axiosClient";
import AuthModal from "../../components/AuthModal";
import styles from "./LandingPage.module.scss";

const FEATURES = [
  {
    icon: "🏋️",
    title: "Trang Thiết Bị Hiện Đại",
    desc: "Máy tập cardio và tạ hiện đại, không gian sạch sẽ giúp bạn bứt phá mọi giới hạn.",
  },
  {
    icon: "⏰",
    title: "Mở Cửa 24/7",
    desc: "Tập luyện bất kỳ lúc nào bạn muốn — sáng sớm, trưa hay khuya. The Pro Gym luôn mở cửa.",
  },
  {
    icon: "🧘",
    title: "Lớp Tập Nhóm Miễn Phí",
    desc: "Yoga, Zumba, và nhiều lớp nhóm miễn phí cho hội viên đăng ký.",
  },
  {
    icon: "🤝",
    title: "Môi Trường Không Phán Xét",
    desc: "Không gian thân thiện, chào đón mọi người ở mọi trình độ — bạn luôn thuộc về nơi đây.",
  },
  {
    icon: "💪",
    title: "Hướng Dẫn Tập Miễn Phí",
    desc: "Huấn luyện viên sẵn sàng hỗ trợ bạn sử dụng thiết bị và xây dựng kế hoạch tập.",
  },
  {
    icon: "📱",
    title: "Ứng Dụng Thông Minh",
    desc: "Quản lý gói tập, điểm danh, đặt lịch lớp học và theo dõi tiến độ trên App.",
  },
];

const TICKER_ITEMS = [
  "GYM CHO MỌI NGƯỜI",
  "NO JUDGMENT ZONE",
  "OPEN 24/7",
  "AI HỖ TRỢ",
  "TỪ 299.000Đ/THÁNG",
  "GYM CHO MỌI NGƯỜI",
  "NO JUDGMENT ZONE",
  "OPEN 24/7",
  "AI HỖ TRỢ",
  "TỪ 299.000Đ/THÁNG",
];

/* ── Component ── */
function LandingPage() {
  const { token, user } = useContext(AuthContext) ?? {};
  const [authModalView, setAuthModalView] = useState(null); // 'login' | 'register' | null
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await api.get("/packages/membership");
        setPackages(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPackages();
  }, []);

  // Xác định link dashboard dựa trên role
  const dashboardLink = user?.vaiTro?.toUpperCase() === "MEMBER" ? "/my-dashboard" : "/dashboard";

  return (
    <div className={styles.landing}>
      {/* NAVBAR */}
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          THE <span>PRO</span> GYM
        </div>

        <ul className={styles.navLinks}>
          <li><a href="#pricing">Giá Hội Viên</a></li>
          <li><a href="#features">Tiện Ích</a></li>
          <li><a href="#app">Ứng Dụng</a></li>
        </ul>

        <div className={styles.navActions}>
          {token ? (
            <Link to={dashboardLink} className={styles.btnJoin}>Vào Dashboard</Link>
          ) : (
            <>
              <button onClick={() => setAuthModalView('login')} className={styles.btnLogin}>Đăng nhập</button>
              <button onClick={() => setAuthModalView('register')} className={styles.btnJoin}>Tham gia</button>
            </>
          )}
        </div>

        <div className={styles.menuToggle}>
          <span /><span /><span />
        </div>
      </nav>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />

        <div className={styles.heroSlider}>
          <div className={styles.heroContent}>
            <div className={styles.heroTag}>Gym cho mọi người</div>
            <h1>
              KHÔNG PHÁN XÉT.
              <span>KHÔNG GIỚI HẠN.</span>
            </h1>
            <p>
              The Pro Gym được xây dựng trên triết lý &quot;Gym cho mọi người&quot;
              trong một môi trường không phán xét. Bắt đầu hành trình sức khỏe
              ngay hôm nay với mức giá tối ưu nhất.
            </p>
            <div className={styles.heroButtons}>
              <button onClick={() => setAuthModalView('register')} className={styles.btnPrimary}>
                🎁 Tập miễn phí 7 ngày
              </button>
              <a href="#pricing" className={styles.btnSecondary}>
                Xem bảng giá
              </a>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.heroStats}>
              {[
                { num: "AI", label: "Hỗ Trợ" },
                { num: "24/7", label: "Mở Cửa" },
                { num: "299K", label: "Từ / Tháng" },
                { num: "100%", label: "No Judgment" },
              ].map((s) => (
                <div key={s.label} className={styles.statCard}>
                  <div className={styles.statNum}>{s.num}</div>
                  <div className={styles.statLabel}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.scrollIndicator}>
          <div className={styles.scrollLine} />
          scroll
        </div>
      </section>

      {/* TICKER */}
      <div className={styles.ticker}>
        <div className={styles.tickerInner}>
          {TICKER_ITEMS.map((item, i) => (
            <span key={i} className={styles.tickerItem}>
              <span>✦</span> {item}
            </span>
          ))}
        </div>
      </div>

      {/* PRICING */}
      <section id="pricing" className={styles.pricing}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionLabel}>Hội Viên The Pro Gym</div>
          <h2 className={styles.sectionTitle}>Chọn Gói Phù Hợp Với Bạn</h2>
          <p className={styles.sectionDesc}>
            Hai gói tập linh hoạt, phù hợp với mọi nhu cầu và lịch trình.
            Tất cả đều bao gồm quyền truy cập không giới hạn vào tiện ích phòng tập.
          </p>
        </div>

        <div className={styles.pricingGrid}>
          {packages.length > 0 ? packages.map((pkg) => {
            let features = [];
            try {
              features = JSON.parse(pkg.QuyenLoi || "[]");
            } catch (e) {
              features = [];
            }
            return (
              <div key={pkg.MaGoi} className={`${styles.pricingCard} ${pkg.NoiBat ? styles.featured : ""}`}>
                {pkg.NoiBat && <div className={styles.featuredBadge}>PHỔ BIẾN NHẤT</div>}
                <div className={styles.planDuration}>{pkg.ThoiHan} Tháng</div>
                <div className={styles.planName}>{pkg.TenGoi.toUpperCase()}</div>
                <div className={styles.planPrice}>
                  <span className={styles.amount}>{pkg.Gia.toLocaleString()}</span>
                  <span className={styles.currency}>VNĐ</span>
                </div>
                <div className={styles.planPeriod}>/ Tháng</div>
                <div className={styles.planDivider} />
                <p className={styles.planDesc}>{pkg.MoTa}</p>
                <ul className={styles.planFeatures}>
                  {features.map((feat, idx) => (
                    <li key={idx}>{feat}</li>
                  ))}
                </ul>
                <button onClick={() => setAuthModalView('register')} className={styles.planCta}>
                  Tham gia gói này
                </button>
              </div>
            );
          }) : (
            <p className="text-white text-center w-full col-span-2 py-8">Đang tải danh sách gói tập...</p>
          )}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className={styles.features}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionLabel}>Tiện Ích</div>
          <h2 className={styles.sectionTitle}>Nơi Bạn Cảm Thấy Thuộc Về</h2>
          <p className={styles.sectionDesc}>
            The Pro Gym cung cấp đầy đủ mọi thứ bạn cần để bắt đầu và
            duy trì hành trình sức khỏe của mình.
          </p>
        </div>

        <div className={styles.featuresGrid}>
          {FEATURES.map((f) => (
            <div key={f.title} className={styles.featureCard}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* VALUES */}
      <section className={styles.values}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionLabel}>Tại Sao Chọn Chúng Tôi</div>
          <h2 className={styles.sectionTitle}>Chi Phí Tối Ưu, Giá Trị Vượt Trội</h2>
        </div>

        <div className={styles.valuesGrid}>
          <div className={styles.valueItem}>
            <span className={styles.valueIcon}>🏷️</span>
            <h3>Giá Tốt Nhất</h3>
            <p>Trải nghiệm gym chất lượng cao với mức chi phí hợp lý nhất cho người Việt.</p>
          </div>
          <div className={styles.valueItem}>
            <span className={styles.valueIcon}>🛡️</span>
            <h3>Không Phán Xét</h3>
            <p>Môi trường thân thiện, chào đón mọi trình độ. Bạn luôn thuộc về nơi đây.</p>
          </div>
          <div className={styles.valueItem}>
            <span className={styles.valueIcon}>⚡</span>
            <h3>Tiện Lợi Tối Đa</h3>
            <p>Mở 24/7, app quản lý thông minh và AI hỗ trợ — tập luyện theo lịch của bạn.</p>
          </div>
        </div>
      </section>

      {/* APP SECTION */}
      <section id="app" className={styles.appSection}>
        <div className={styles.appLayout}>
          <div>
            <div className={styles.sectionLabel}>Ứng Dụng</div>
            <h2 className={styles.sectionTitle}>The Pro Gym App</h2>
            <ul className={styles.appFeatureList}>
              {[
                { icon: "📲", text: "AI hỗ trợ tập luyện 24/7" },
                { icon: "💳", text: "Quản lý & gia hạn gói tập chỉ trong 30 giây" },
                { icon: "📅", text: "Đặt lịch lớp học nhóm dễ dàng" },
                { icon: "📊", text: "Theo dõi tiến độ & chỉ số sức khỏe" },
              ].map((item) => (
                <li key={item.text}>
                  <span className={styles.appFeatureIcon}>{item.icon}</span>
                  {item.text}
                </li>
              ))}
            </ul>
            <a
              href="https://app.thenewgym.vn/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.btnPrimary}
            >
              Tải Ứng Dụng Ngay
            </a>
          </div>

          <div className={styles.appMockup}>
            <div className={styles.mockupPhone}>
              <div className={styles.mockupScreen}>TNG</div>
              <div className={styles.mockupLabel}>Dashboard</div>
            </div>
            <div className={styles.mockupPhone}>
              <div className={styles.mockupScreen}>💪</div>
              <div className={styles.mockupLabel}>Workout</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className={styles.ctaInner}>
          <div className={styles.ctaDays}>7</div>
          <div className={styles.ctaLabel}>Ngày Tập Hoàn Toàn Miễn Phí</div>
          <h2>SẴN SÀNG BẮT ĐẦU CHƯA?</h2>
          <p>
            Trải nghiệm The Pro Gym 7 ngày miễn phí — không cần thẻ ngân hàng,
            không điều kiện ràng buộc. Bước vào hành trình sức khỏe ngay hôm nay.
          </p>
          <div className={styles.ctaButtons}>
            <button onClick={() => setAuthModalView('register')} className={styles.btnPrimary}>
              🎁 Nhận 7 Ngày Miễn Phí
            </button>
            <button onClick={() => setAuthModalView('login')} className={styles.btnSecondary}>
              Đã có tài khoản
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>
              THE <span>NEW</span> GYM
            </div>
            <p>
              Hệ thống phòng tập chuyên nghiệp với môi trường không phán xét,
              mở cửa 24/7 trên toàn quốc.
            </p>
            <div className={styles.socialLinks}>
              <a title="Facebook">📘</a>
              <a title="Instagram">📸</a>
              <a title="TikTok">🎵</a>
              <a title="YouTube">▶️</a>
            </div>
          </div>

          <div className={styles.footerCol}>
            <h4>Thông Tin</h4>
            <ul>
              <li><a href="#features">Về Chúng Tôi</a></li>
            </ul>
          </div>

          <div className={styles.footerCol}>
            <h4>Phòng Tập</h4>
            <ul>
              <li><a href="#pricing">Giá Hội Viên</a></li>
              <li><a href="#features">Tiện Ích</a></li>
              <li><a href="#app">Ứng Dụng</a></li>
            </ul>
          </div>

          <div className={styles.footerCol}>
            <h4>Liên Hệ</h4>
            <ul>
              <li><a >📞 1900 63 69 20</a></li>
              <li><a>✉️ cskh@theprogym.vn</a></li>
              <li><a>💬 Zalo</a></li>
            </ul>
          </div>
        </div>

        <div className={styles.footerDivider} />

        <div className={styles.footerBottom}>
          <p>© 2026 The Pro Gym. Hệ thống tập cho mọi người.</p>
          <div className={styles.hotline}>
            Hotline: <span>1900 69 69 69</span>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={!!authModalView}
        onClose={() => setAuthModalView(null)}
        initialView={authModalView || 'login'}
      />
    </div>
  );
}

export default LandingPage;
