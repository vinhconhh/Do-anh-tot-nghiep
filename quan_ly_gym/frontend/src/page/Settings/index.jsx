import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useUsersApi } from "../../api/usersApi";
import { Loader2, Save } from "lucide-react";
import styles from "./Settings.module.scss";

export default function Settings() {
  const { user: authUser, updateUser } = useContext(AuthContext) ?? {};
  const { getMe, updateMe } = useUsersApi();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  const [formData, setFormData] = useState({
    FullName: "",
    PhoneNumber: "",
    Gender: "",
    Birthday: "",
    
    Height: "",
    Weight: "",
    Goal: "",
    
    ExperienceYears: "",
    Certifications: "",
    Specialty: "",
  });

  const vaiTro = authUser?.vaiTro;

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getMe();
      
      setFormData({
        FullName: data.hoTen || "",
        PhoneNumber: data.phoneNumber || "",
        Gender: data.gender || "",
        Birthday: data.birthday ? data.birthday.split("T")[0] : "",
        
        Height: data.height || "",
        Weight: data.weight || "",
        Goal: data.goal || "",
        
        ExperienceYears: data.experienceYears || "",
        Certifications: data.certifications || "",
        Specialty: data.specialty || "",
      });
    } catch (err) {
      console.error("Failed to load profile", err);
      setMessage({ type: "error", text: "Không thể tải thông tin cá nhân." });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage({ type: "", text: "" });
      
      const payload = { ...formData };
      if (!payload.Birthday) payload.Birthday = null;
      if (payload.Height === "") payload.Height = null;
      if (payload.Weight === "") payload.Weight = null;
      if (payload.ExperienceYears === "") payload.ExperienceYears = null;

      await updateMe(payload);
      
      setMessage({ type: "success", text: "Cập nhật thông tin thành công!" });
      
      if (updateUser) {
        updateUser({ 
          hoTen: payload.FullName,
          gender: payload.Gender,
          birthday: payload.Birthday,
          phoneNumber: payload.PhoneNumber
        });
      }

      await fetchProfile();
    } catch (err) {
      console.error("Failed to update profile", err);
      setMessage({ type: "error", text: "Có lỗi xảy ra khi cập nhật thông tin." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <Loader2 size={40} className={styles.spinner} />
        <p>Đang tải thông tin...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Cài đặt tài khoản</h2>
        <p className={styles.subtitle}>Quản lý thông tin cá nhân của bạn</p>
      </div>

      {message.text && (
        <div className={message.type === "success" ? styles.alertSuccess : styles.alertError}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <h3 className={styles.sectionTitle}>Thông tin chung</h3>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Họ và tên</label>
            <input
              type="text"
              name="FullName"
              value={formData.FullName}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Số điện thoại</label>
            <input
              type="tel"
              name="PhoneNumber"
              value={formData.PhoneNumber}
              onChange={handleChange}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Giới tính</label>
            <select
              name="Gender"
              value={formData.Gender}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="">Chọn giới tính</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Ngày sinh</label>
            <input
              type="date"
              name="Birthday"
              value={formData.Birthday}
              onChange={handleChange}
              className={styles.input}
            />
          </div>
        </div>

        {vaiTro === "MEMBER" && (
          <>
            <h3 className={styles.sectionTitle}>Chỉ số cơ thể</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Chiều cao (cm)</label>
                <input
                  type="number"
                  name="Height"
                  value={formData.Height}
                  onChange={handleChange}
                  className={styles.input}
                  min="0"
                  step="0.1"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Cân nặng (kg)</label>
                <input
                  type="number"
                  name="Weight"
                  value={formData.Weight}
                  onChange={handleChange}
                  className={styles.input}
                  min="0"
                  step="0.1"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Mục tiêu tập luyện</label>
                <input
                  type="text"
                  name="Goal"
                  value={formData.Goal}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="VD: Tăng cơ, giảm mỡ..."
                />
              </div>
            </div>
          </>
        )}

        {vaiTro === "PT" && (
          <>
            <h3 className={styles.sectionTitle}>Hồ sơ Huấn luyện viên</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Kinh nghiệm (năm)</label>
                <input
                  type="number"
                  name="ExperienceYears"
                  value={formData.ExperienceYears}
                  onChange={handleChange}
                  className={styles.input}
                  min="0"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Chuyên môn</label>
                <input
                  type="text"
                  name="Specialty"
                  value={formData.Specialty}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="VD: Giảm cân, Thể hình..."
                />
              </div>

              <div className={styles.formGroup} style={{ gridColumn: "1 / -1" }}>
                <label className={styles.label}>Chứng chỉ</label>
                <input
                  type="text"
                  name="Certifications"
                  value={formData.Certifications}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="VD: NASM, ACE..."
                />
              </div>
            </div>
          </>
        )}

        <div className={styles.actions}>
          <button type="submit" className={styles.btnSave} disabled={saving}>
            {saving ? <Loader2 size={20} className={styles.spinner} /> : <Save size={20} />}
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </div>
  );
}
