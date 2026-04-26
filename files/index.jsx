import { Link } from "react-router-dom";
import styles from "./LandingPage.module.scss";

/* ── Data ── */
const BRANCHES = [
  { name: "Lê Hồng Phong", city: "Quận 5" },
  { name: "Lý Thường Kiệt", city: "Quận 11" },
  { name: "Nam Kỳ Khởi Nghĩa", city: "Quận 3" },
  { name: "Hoàng Văn Thụ", city: "Tân Bình" },
  { name: "Quang Trung", city: "Gò Vấp" },
  { name: "Phan Đăng Lưu", city: "Phú Nhuận" },
  { name: "Điện Biên Phủ", city: "Quận 10" },
  { name: "Ung Văn Khiêm", city: "Bình Thạnh" },
  { name: "Hậu Giang", city: "Quận 6" },
  { name: "Âu Cơ", city: "Tân Phú" },
  { name: "Nguyễn Chí Thanh", city: "Quận 10" },
  { name: "Nguyễn Thị Thập", city: "Quận 7" },
  { name: "Cần Thơ", city: "Ninh Kiều" },
  { name: "Đồng Nai", city: "Biên Hòa" },
  { name: "Đà Nẵng", city: "Hải Châu" },
];

const FEATURES = [
  {
    icon: "🏋️",
    title: "Trang Thiết Bị Hiện Đại",
    desc: "Máy tập cardio và tạ hiện đại, không gian sạch sẽ giúp bạn bứt phá mọi giới hạn.",
  },
  {
    icon: "⏰",
    title: "Mở Cửa 24/7",
    desc: "Tập luyện bất kỳ lúc nào bạn muốn — sáng sớm, trưa hay khuya. The New Gym luôn mở cửa.",
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
  "15+ CHI NHÁNH",
  "TỪ 299.000Đ/THÁNG",
  "GYM CHO MỌI NGƯỜI",
  "NO JUDGMENT ZONE",
  "OPEN 24/7",
  "15+ CHI NHÁNH",
  "TỪ 299.000Đ/THÁNG",
];

/* ── Component ── */
function LandingPage() {
  return (
    <div className={styles.landing}>
      {/* NAVBAR */}
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          THE <span>NEW</span> GYM
        </div>

        <ul className={styles.navLinks}>
          <li><a href="#pricing">Giá Hội Viên</a></li>
          <li><a href="#branches">Tìm Phòng Tập</a></li>
          <li><a href="#features">Tiện Ích</a></li>
          <li><a href="#app">Ứng Dụng</a></li>
        </ul>

        <div className={styles.navActions}>
          <Link to="/login" className={styles.btnLogin}>Đăng nhập</Link>
          <Link to="/register" className={styles.btnJoin}>Tham gia</Link>
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
              The New Gym được xây dựng trên triết lý &quot;Gym cho mọi người&quot;
              trong một môi trường không phán xét. Bắt đầu hành trình sức khỏe
              ngay hôm nay với mức giá tối ưu nhất.
            </p>
            <div className={styles.heroButtons}>
              <Link to="/register" className={styles.btnPrimary}>
                🎁 Tập miễn phí 7 ngày
              </Link>
              <a href="#pricing" className={styles.btnSecondary}>
                Xem bảng giá
              </a>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.heroStats}>
              {[
                { num: "15+", label: "Chi Nhánh" },
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
          <div className={styles.sectionLabel}>Hội Viên The New Gym</div>
          <h2 className={styles.sectionTitle}>Chọn Gói Phù Hợp Với Bạn</h2>
          <p className={styles.sectionDesc}>
            Hai gói tập linh hoạt, phù hợp với mọi nhu cầu và lịch trình.
            Tất cả đều bao gồm quyền truy cập không giới hạn vào tiện ích phòng tập.
          </p>
        </div>

        <div className={styles.pricingGrid}>
          {/* Card 1 */}
          <div className={styles.pricingCard}>
            <div className={styles.planDuration}>1 Tháng</div>
            <div className={styles.planName}>1 CHI NHÁNH</div>
            <div className={styles.planPrice}>
              <span className={styles.amount}>299.000</span>
              <span className={styles.currency}>VNĐ</span>
            </div>
            <div className={styles.planPeriod}>/ Tháng</div>
            <div className={styles.planDivider} />
            <p className={styles.planDesc}>
              Lựa chọn tiết kiệm nhất, dành cho hội viên có nhu cầu tập luyện
              cố định tại một địa điểm gần nhà hoặc nơi làm việc.
            </p>
            <ul className={styles.planFeatures}>
              <li>Tập không giới hạn tại 1 chi nhánh đăng ký</li>
              <li>Sử dụng toàn bộ thiết bị hiện đại</li>
              <li>Tham gia lớp nhóm miễn phí</li>
              <li>Hướng dẫn tập luyện ban đầu</li>
              <li>Ứng dụng The New Gym</li>
            </ul>
            <Link to="/register" className={styles.planCta}>
              Tham gia gói này
            </Link>
          </div>

          {/* Card 2 - Featured */}
          <div className={`${styles.pricingCard} ${styles.featured}`}>
            <div className={styles.featuredBadge}>PHỔ BIẾN NHẤT</div>
            <div className={styles.planDuration}>1 Tháng</div>
            <div className={styles.planName}>TẤT CẢ CHI NHÁNH</div>
            <div className={styles.planPrice}>
              <span className={styles.amount}>399.000</span>
              <span className={styles.currency}>VNĐ</span>
            </div>
            <div className={styles.planPeriod}>/ Tháng</div>
            <div className={styles.planDivider} />
            <p className={styles.planDesc}>
              Tập luyện tại toàn hệ thống 15+ chi nhánh trên toàn quốc,
              kèm theo nhiều đặc quyền bổ sung.
            </p>
            <ul className={styles.planFeatures}>
              <li>Truy cập tất cả 15+ chi nhánh</li>
              <li>Kiểm tra sức khỏe & tư thế miễn phí</li>
              <li>Sử dụng toàn bộ thiết bị hiện đại</li>
              <li>Tham gia lớp nhóm miễn phí</li>
              <li>Hướng dẫn tập luyện ban đầu</li>
              <li>Ứng dụng The New Gym đầy đủ tính năng</li>
            </ul>
            <Link to="/register" className={styles.planCta}>
              Tham gia gói này
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className={styles.features}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionLabel}>Tiện Ích</div>
          <h2 className={styles.sectionTitle}>Nơi Bạn Cảm Thấy Thuộc Về</h2>
          <p className={styles.sectionDesc}>
            The New Gym cung cấp đầy đủ mọi thứ bạn cần để bắt đầu và
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

      {/* BRANCHES */}
      <section id="branches" className={styles.branches}>
        <div className={styles.branchesLayout}>
          <div className={styles.branchesInfo}>
            <div className={styles.sectionLabel}>Hệ Thống Phòng Tập</div>
            <h2 className={styles.sectionTitle}>15+ Chi Nhánh Toàn Quốc</h2>
            <p className={styles.sectionDesc} style={{ marginBottom: "32px" }}>
              Từ TP. HCM đến Đà Nẵng, Cần Thơ và Đồng Nai — The New Gym
              luôn ở gần bạn, sẵn sàng đồng hành trên mọi hành trình.
            </p>
            <div className={styles.bigNumber}>15+</div>
          </div>

          <div className={styles.branchesList}>
            {BRANCHES.map((b) => (
              <div key={b.name} className={styles.branchItem}>
                <div className={styles.branchDot} />
                <span className={styles.branchName}>The New Gym {b.name}</span>
                <span className={styles.branchCity}>{b.city}</span>
              </div>
            ))}
          </div>
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
            <p>Mở 24/7, nhiều chi nhánh, app quản lý thông minh — tập luyện theo lịch của bạn.</p>
          </div>
        </div>
      </section>

      {/* APP SECTION */}
      <section id="app" className={styles.appSection}>
        <div className={styles.appLayout}>
          <div>
            <div className={styles.sectionLabel}>Ứng Dụng</div>
            <h2 className={styles.sectionTitle}>The New Gym App</h2>
            <ul className={styles.appFeatureList}>
              {[
                { icon: "📲", text: "Ra/vào phòng tập 24/7 không cần thẻ cứng" },
                { icon: "💳", text: "Quản lý & gia hạn gói tập chỉ trong 30 giây" },
                { icon: "📅", text: "Đặt lịch lớp học nhóm dễ dàng" },
                { icon: "📊", text: "Theo dõi tiến độ & chỉ số sức khỏe" },
                { icon: "🎯", text: "Video hướng dẫn bài tập cho người mới" },
                { icon: "🎁", text: "Chương trình giới thiệu bạn bè, nhận quà" },
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
            Trải nghiệm The New Gym 7 ngày miễn phí — không cần thẻ ngân hàng,
            không điều kiện ràng buộc. Bước vào hành trình sức khỏe ngay hôm nay.
          </p>
          <div className={styles.ctaButtons}>
            <Link to="/register" className={styles.btnPrimary}>
              🎁 Nhận 7 Ngày Miễn Phí
            </Link>
            <Link to="/login" className={styles.btnSecondary}>
              Đã có tài khoản
            </Link>
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
              <a href="https://facebook.com/thenewgymvietnam" target="_blank" rel="noopener noreferrer" title="Facebook">📘</a>
              <a href="https://instagram.com/thenewgymvietnam" target="_blank" rel="noopener noreferrer" title="Instagram">📸</a>
              <a href="https://tiktok.com/@thenewgym" target="_blank" rel="noopener noreferrer" title="TikTok">🎵</a>
              <a href="https://youtube.com/@thenewgymvn" target="_blank" rel="noopener noreferrer" title="YouTube">▶️</a>
            </div>
          </div>

          <div className={styles.footerCol}>
            <h4>Thông Tin</h4>
            <ul>
              <li><a href="#features">Về Chúng Tôi</a></li>
              <li><a href="#branches">Hệ Thống Phòng Tập</a></li>
              <li><Link to="/login">Đăng Nhập</Link></li>
              <li><Link to="/register">Đăng Ký</Link></li>
            </ul>
          </div>

          <div className={styles.footerCol}>
            <h4>Phòng Tập</h4>
            <ul>
              <li><a href="#branches">Tìm Chi Nhánh</a></li>
              <li><a href="#pricing">Giá Hội Viên</a></li>
              <li><a href="#features">Tiện Ích</a></li>
              <li><a href="#app">Ứng Dụng</a></li>
            </ul>
          </div>

          <div className={styles.footerCol}>
            <h4>Liên Hệ</h4>
            <ul>
              <li><a href="tel:1900636920">📞 1900 63 69 20</a></li>
              <li><a href="mailto:cskh@thenewgym.vn">✉️ cskh@thenewgym.vn</a></li>
              <li><a href="https://zalo.me/thenewgym" target="_blank" rel="noopener noreferrer">💬 Zalo</a></li>
            </ul>
          </div>
        </div>

        <div className={styles.footerDivider} />

        <div className={styles.footerBottom}>
          <p>© 2025 The New Gym. Hệ thống phòng tập cho mọi người.</p>
          <div className={styles.hotline}>
            Hotline: <span>1900 63 69 20</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
