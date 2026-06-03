import { UserCog } from "lucide-react";
import Modal from "../../components/Modal";

const DAYS = [
  { v: 0, l: "T2" }, { v: 1, l: "T3" }, { v: 2, l: "T4" },
  { v: 3, l: "T5" }, { v: 4, l: "T6" }, { v: 5, l: "T7" }, { v: 6, l: "CN" }
];
const INTENSITIES = [
  { val: "high",   label: "Cao",   color: "#e74a3b", icon: "🔴", gap: "30 phút" },
  { val: "medium", label: "Trung bình", color: "#f6c23e", icon: "🟡", gap: "20 phút" },
  { val: "low",    label: "Thấp",  color: "#1cc88a", icon: "🟢", gap: "15 phút" },
];

const inputSt = {
  width: "100%", padding: "9px 12px", background: "var(--theme-bg)",
  border: "1px solid var(--theme-border)", borderRadius: 8,
  color: "var(--theme-text-dark)", outline: "none", boxSizing: "border-box",
};
const sectionSt = {
  background: "var(--theme-bg)", borderRadius: 12, padding: "16px 18px",
  border: "1px solid var(--theme-border)",
};
const sectionTitle = (num, text) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
    <span style={{ background: "linear-gradient(135deg,#4e73df,#36b9cc)", color: "#fff", width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", fontWeight: 800, flexShrink: 0 }}>{num}</span>
    <span style={{ fontWeight: 700, color: "var(--theme-text-dark)", fontSize: "1.4rem" }}>{text}</span>
  </div>
);

export default function ClassFormModal({ form, setForm, editing, instructors, saving, conflictWarnings, onSave, onClose }) {
  const selectedDays = form.RecurringDays ? form.RecurringDays.split(",").filter(Boolean) : [];
  const toggleDay = (v) => {
    const s = String(v);
    let days = [...selectedDays];
    if (days.includes(s)) days = days.filter(x => x !== s);
    else days.push(s);
    setForm(p => ({ ...p, RecurringDays: days.sort().join(",") }));
  };

  return (
    <Modal
      isOpen={true}
      onRequestClose={onClose}
      title={editing ? "✏️ Sửa lớp học" : "➕ Tạo lớp học mới"}
    >
      <div style={{ padding: "0 10px" }}>

        {}
        {conflictWarnings.length > 0 && (
          <div style={{ padding: "10px 14px", background: "#e74a3b11", border: "1px solid #e74a3b55", borderRadius: 8, color: "#e74a3b", fontSize: "1.3rem", marginBottom: 14 }}>
            <strong>⚠️ Xung đột lịch HLV:</strong>
            <ul style={{ margin: "5px 0 0", paddingLeft: 20 }}>
              {conflictWarnings.map((w, i) => <li key={i}>{w.detail}</li>)}
            </ul>
          </div>
        )}

        <form onSubmit={onSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {}
          <div style={sectionSt}>
            {sectionTitle("1", "Thông tin cơ bản")}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ color: "var(--theme-text)", fontSize: "1.3rem", display: "block", marginBottom: 4 }}>Tên lớp học *</label>
                <input required value={form.Name} onChange={e => setForm(p => ({ ...p, Name: e.target.value }))} placeholder="Yoga, Zumba, HIIT, Pilates..." style={inputSt} />
              </div>
              {}
              <div>
                <label style={{ color: "var(--theme-text)", fontSize: "1.3rem", display: "block", marginBottom: 4 }}>
                  <UserCog size={13} style={{ display: "inline", marginRight: 4 }} />Huấn luyện viên (PT)
                </label>
                <select value={form.InstructorID} onChange={e => setForm(p => ({ ...p, InstructorID: e.target.value, InstructorName: "" }))} style={inputSt}>
                  <option value="">-- Chưa phân công --</option>
                  {instructors.map(pt => (
                    <option key={pt.UserID} value={pt.UserID}>
                      {pt.FullName}{pt.Specialty ? ` — ${pt.Specialty}` : ""} ({pt.Score}đ)
                    </option>
                  ))}
                </select>
                {form.InstructorID && (() => {
                  const sel = instructors.find(i => String(i.UserID) === String(form.InstructorID));
                  if (!sel) return null;
                  return (
                    <div style={{ marginTop: 8, padding: "8px 12px", background: "linear-gradient(135deg,#4e73df11,#1cc88a11)", border: "1px solid #4e73df33", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
                      <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(sel.FullName)}&background=4e73df&color=fff&size=32`} alt="" style={{ width: 32, height: 32, borderRadius: "50%" }} />
                      <div style={{ fontSize: "1.2rem", color: "var(--theme-text)" }}>
                        <strong style={{ color: "var(--theme-text-dark)" }}>{sel.FullName}</strong>
                        {sel.Specialty && <span> · 🏋️ {sel.Specialty}</span>}
                        {sel.ExperienceYears > 0 && <span> · {sel.ExperienceYears} năm</span>}
                      </div>
                    </div>
                  );
                })()}
                {!form.InstructorID && (
                  <input value={form.InstructorName} onChange={e => setForm(p => ({ ...p, InstructorName: e.target.value }))} placeholder="Hoặc nhập tên HLV ngoài hệ thống..." style={{ ...inputSt, marginTop: 6, borderStyle: "dashed" }} />
                )}
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ color: "var(--theme-text)", fontSize: "1.3rem", display: "block", marginBottom: 4 }}>Phòng tập</label>
                  <input value={form.StudioRoom} placeholder="Studio 1..." onChange={e => setForm(p => ({ ...p, StudioRoom: e.target.value }))} style={inputSt} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ color: "var(--theme-text)", fontSize: "1.3rem", display: "block", marginBottom: 4 }}>Sức chứa</label>
                  <input type="number" min="1" value={form.MaxCapacity} onChange={e => setForm(p => ({ ...p, MaxCapacity: e.target.value }))} style={inputSt} />
                </div>
              </div>
            </div>
          </div>

          {}
          <div style={sectionSt}>
            {sectionTitle("2", "Cường độ lớp học")}
            <div style={{ display: "flex", gap: 10 }}>
              {INTENSITIES.map(i => {
                const active = form.Intensity === i.val;
                return (
                  <label key={i.val} onClick={() => setForm(p => ({ ...p, Intensity: i.val }))}
                    style={{ flex: 1, cursor: "pointer", padding: "12px 10px", borderRadius: 10, border: `2px solid ${active ? i.color : "var(--theme-border)"}`, background: active ? `${i.color}11` : "transparent", textAlign: "center", transition: "all 0.2s" }}>
                    <input type="radio" name="intensity" value={i.val} checked={active} onChange={() => {}} style={{ display: "none" }} />
                    <div style={{ fontSize: "1.8rem" }}>{i.icon}</div>
                    <div style={{ fontWeight: 700, color: active ? i.color : "var(--theme-text-dark)", fontSize: "1.3rem", marginTop: 4 }}>{i.label}</div>
                    <div style={{ fontSize: "1.1rem", color: "var(--theme-text)", marginTop: 2 }}>Nghỉ tối thiểu: {i.gap}</div>
                  </label>
                );
              })}
            </div>
          </div>

          {}
          {!editing && (
            <div style={sectionSt}>
              {sectionTitle("3", "Lịch học trong tuần")}
              <div style={{ color: "var(--theme-text)", fontSize: "1.25rem", marginBottom: 10 }}>Chọn các ngày lớp học diễn ra:</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                {DAYS.map(d => {
                  const active = selectedDays.includes(String(d.v));
                  return (
                    <button key={d.v} type="button" onClick={() => toggleDay(d.v)}
                      style={{ padding: "8px 16px", borderRadius: 20, border: `2px solid ${active ? "#36b9cc" : "var(--theme-border)"}`, background: active ? "#36b9cc" : "transparent", color: active ? "#fff" : "var(--theme-text)", fontWeight: 700, cursor: "pointer", fontSize: "1.3rem", transition: "all 0.2s", minWidth: 44 }}>
                      {d.l}
                    </button>
                  );
                })}
              </div>
              {selectedDays.length > 0 && (
                <div style={{ fontSize: "1.2rem", color: "#36b9cc", fontWeight: 600, marginBottom: 6 }}>
                  ✓ Đã chọn {selectedDays.length} ngày/tuần
                </div>
              )}
            </div>
          )}

          {}
          {!editing && selectedDays.length > 0 && (
            <div style={sectionSt}>
              {sectionTitle("4", "Phạm vi ngày & Giờ học")}
              <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ color: "var(--theme-text)", fontSize: "1.3rem", display: "block", marginBottom: 4 }}>Từ ngày *</label>
                  <input required type="date" value={form.RecurringStartDate} onChange={e => setForm(p => ({ ...p, RecurringStartDate: e.target.value }))} style={{ ...inputSt, colorScheme: "auto" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ color: "var(--theme-text)", fontSize: "1.3rem", display: "block", marginBottom: 4 }}>Đến ngày *</label>
                  <input required type="date" value={form.RecurringEndDate} onChange={e => setForm(p => ({ ...p, RecurringEndDate: e.target.value }))} style={{ ...inputSt, colorScheme: "auto" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ color: "var(--theme-text)", fontSize: "1.3rem", display: "block", marginBottom: 4 }}>Giờ bắt đầu *</label>
                  <input required type="time" value={form.TimeStart} onChange={e => setForm(p => ({ ...p, TimeStart: e.target.value }))} style={{ ...inputSt, colorScheme: "auto" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ color: "var(--theme-text)", fontSize: "1.3rem", display: "block", marginBottom: 4 }}>Giờ kết thúc *</label>
                  <input required type="time" value={form.TimeEnd} onChange={e => setForm(p => ({ ...p, TimeEnd: e.target.value }))} style={{ ...inputSt, colorScheme: "auto" }} />
                </div>
              </div>
            </div>
          )}

          {}
          {editing && (
            <div style={sectionSt}>
              {sectionTitle("3", "Giờ học")}
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ color: "var(--theme-text)", fontSize: "1.3rem", display: "block", marginBottom: 4 }}>Bắt đầu *</label>
                  <input required type="datetime-local" value={form.StartTime} onChange={e => setForm(p => ({ ...p, StartTime: e.target.value }))} style={{ ...inputSt, colorScheme: "auto" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ color: "var(--theme-text)", fontSize: "1.3rem", display: "block", marginBottom: 4 }}>Kết thúc *</label>
                  <input required type="datetime-local" value={form.EndTime} onChange={e => setForm(p => ({ ...p, EndTime: e.target.value }))} style={{ ...inputSt, colorScheme: "auto" }} />
                </div>
              </div>
            </div>
          )}

          {}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ padding: "10px 22px", background: "var(--theme-bg)", color: "var(--theme-text-dark)", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 600 }}>Hủy</button>
            <button type="submit" disabled={saving} style={{ padding: "10px 24px", background: "linear-gradient(135deg,#f6c23e,#d4a017)", color: "var(--theme-text-dark)", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 700 }}>
              {saving ? "Đang lưu..." : "💾 Lưu"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
