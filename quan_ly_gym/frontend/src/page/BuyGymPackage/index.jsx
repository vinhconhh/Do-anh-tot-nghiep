import { useState, useEffect, useCallback, useContext } from "react";
import { Check, Loader2, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from "./BuyGymPackage.module.scss";
import { AuthContext } from "../../context/AuthContext";
import { authedRequestJson, requestJson } from "../../api/client";

export default function BuyGymPackage() {
  const { token, user, logout, updateUser } = useContext(AuthContext) ?? {};
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);
  const navigate = useNavigate();

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    try {
      // Dùng requestJson nếu endpoint không yêu cầu auth, hoặc authedRequestJson nếu cần.
      // Endpoint /api/packages/membership hiện tại không check auth gắt (vì ai cũng xem được).
      const data = await authedRequestJson("/api/packages/membership", token);
      setPackages(data || []);
    } catch (e) {
      console.error(e);
      alert("Không thể tải danh sách gói tập.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // Nếu user đã có gói tập, chuyển thẳng vào dashboard
    if (user?.packageId) {
      navigate("/my-dashboard");
    } else {
      fetchPackages();
    }
  }, [user, navigate, fetchPackages]);

  const handleBuy = async (pkg) => {
    if (!window.confirm(`Xác nhận mua ${pkg.Name} với giá ${pkg.Price.toLocaleString("vi-VN")}đ?`)) return;
    
    setBuying(pkg.PackageID);
    try {
      const result = await authedRequestJson("/api/packages/membership/purchase", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package_id: pkg.PackageID }),
      });
      
      alert(`✅ Mua thành công gói ${result.gymPackageName}!`);
      
      // Cập nhật AuthContext, AppRoutes sẽ tự động cho phép vào trang chính
      updateUser({
        packageId: result.packageId,
        gymPackageName: result.gymPackageName,
      });
      navigate("/my-dashboard");

    } catch (e) {
      alert("❌ Mua thất bại: " + (e.data?.detail || e.message));
    } finally {
      setBuying(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.loadingWrapper}>
          <Loader2 size={40} style={{ animation: "spin 1s linear infinite" }} />
          <h2>Đang tải danh sách gói tập...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <button className={styles.logoutBtn} onClick={handleLogout}>
        <LogOut size={18} /> Đăng xuất
      </button>

      <div className={styles.header}>
        <h1>Chọn Gói Tập Của Bạn</h1>
        <p>Để bắt đầu hành trình tập luyện tại The Pro Gym, vui lòng chọn một trong các gói hội viên dưới đây.</p>
      </div>

      <div className={styles.packagesGrid}>
        {packages.map((pkg, idx) => {
          // Highlight the package in the middle or marked as Featured
          const isPopular = pkg.IsFeatured || idx === 1;
          
          let features = [];
          try {
            features = pkg.Benefits ? JSON.parse(pkg.Benefits) : [pkg.Description || "Quyền lợi cơ bản"];
          } catch {
            features = [pkg.Benefits || pkg.Description || "Quyền lợi cơ bản"];
          }

          return (
            <div key={pkg.PackageID} className={`${styles.packageCard} ${isPopular ? styles.popular : ""}`}>
              {isPopular && <div className={styles.popularBadge}>Phổ biến</div>}
              
              <div className={styles.pkgName}>{pkg.Name}</div>
              <div className={styles.pkgPrice}>
                {pkg.Price.toLocaleString("vi-VN")}đ <span>/ {pkg.DurationMonths} tháng</span>
              </div>
              <div className={styles.pkgDuration}>Thời hạn: {pkg.DurationMonths} tháng</div>
              
              <ul className={styles.pkgFeatures}>
                {features.map((feat, i) => (
                  <li key={i}>
                    <Check size={18} /> {feat}
                  </li>
                ))}
              </ul>
              
              <button 
                className={styles.buyBtn} 
                onClick={() => handleBuy(pkg)}
                disabled={buying === pkg.PackageID}
              >
                {buying === pkg.PackageID ? "Đang xử lý..." : "Mua Gói Này"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
