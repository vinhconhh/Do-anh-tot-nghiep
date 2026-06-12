import React, { useState, useEffect } from "react";
import { Users, Search, PlusCircle, CheckCircle, Calendar, Lock, Unlock, CalendarPlus } from "lucide-react";
import api from "../../api/axiosClient";
import Modal from "../../components/Modal";
import styles from "./ReceptionistDashboard.module.scss";

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

const ReceptionistDashboard = () => {
  const [activeTab, setActiveTab] = useState("checkin"); // 'checkin' | 'members' | 'bookings'
  const [checkinSubTab, setCheckinSubTab] = useState("MEMBER"); // 'MANAGER' | 'PT' | 'MEMBER'
  
  // All Users State (for Checkin)
  const [allUsers, setAllUsers] = useState([]);
  const [checkinSearch, setCheckinSearch] = useState("");
  const [checkedInUsers, setCheckedInUsers] = useState([]);
  
  // Members State
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  
  // PT Relations State (for Booking)
  const [ptRelations, setPtRelations] = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedRelation, setSelectedRelation] = useState(null);
  const [bookingData, setBookingData] = useState({
    startDate: "",
    endDate: "",
    daysOfWeek: [],
    startTime: "",
    endTime: ""
  });
  
  // Create Member State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({
    FullName: "",
    PhoneNumber: "",
    Email: "",
    Password: "",
    Gender: "Nam"
  });

  const fetchMembers = async () => {
    try {
      const res = await api.get("/accounts?role=MEMBER&page=1&page_size=100");
      if (res.data && res.data.items) {
        setMembers(res.data.items);
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
    }
  };

  const fetchPTRelations = async () => {
    try {
      const res = await api.get("/bookings/pt-relations");
      if (res.data) {
        setPtRelations(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch PT relations:", error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await api.get("/accounts?page=1&page_size=100");
      if (res.data && res.data.items) {
        setAllUsers(res.data.items);
      }
      
      const checkinRes = await api.get("/checkins/today");
      if (checkinRes.data) {
        setCheckedInUsers(checkinRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch all users:", error);
    }
  };

  useEffect(() => {
    if (activeTab === "members") {
      fetchMembers();
    } else if (activeTab === "bookings") {
      fetchPTRelations();
    } else if (activeTab === "checkin") {
      fetchAllUsers();
    }
  }, [activeTab]);

  const handleToggleStatus = async (userId) => {
    try {
      await api.put(`/accounts/${userId}/toggle-status`);
      fetchMembers();
    } catch (error) {
      alert("Lỗi khi thay đổi trạng thái!");
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    const { startDate, endDate, daysOfWeek, startTime, endTime } = bookingData;
    if (!startDate || !endDate || daysOfWeek.length === 0 || !startTime || !endTime) {
      alert("Vui lòng nhập đầy đủ thông tin (chọn khoảng thời gian, thứ trong tuần, và giờ).");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      alert("Ngày kết thúc phải sau ngày bắt đầu!");
      return;
    }

    const payload = [];
    const current = new Date(start);

    while (current <= end) {
      const day = current.getDay().toString();
      if (daysOfWeek.includes(day)) {
        const dateStr = current.toISOString().slice(0, 10);
        payload.push({
          memberId: selectedRelation.MemberID,
          ptId: selectedRelation.PTID,
          startTime: `${dateStr}T${startTime}:00`,
          endTime: `${dateStr}T${endTime}:00`
        });
      }
      current.setDate(current.getDate() + 1);
    }

    if (payload.length === 0) {
      alert("Không có ngày nào trong khoảng thời gian trùng với các thứ đã chọn.");
      return;
    }

    try {
      await api.post("/bookings/batch", payload);
      alert(`Đã tạo thành công ${payload.length} buổi tập PT!`);
      setShowBookingModal(false);
      setBookingData({ startDate: "", endDate: "", daysOfWeek: [], startTime: "", endTime: "" });
    } catch (error) {
      alert("Lỗi khi tạo lịch hẹn!");
    }
  };

  const handleToggleDay = (dayStr) => {
    setBookingData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(dayStr) 
        ? prev.daysOfWeek.filter(d => d !== dayStr) 
        : [...prev.daysOfWeek, dayStr]
    }));
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    try {
      await api.post("/accounts", {
        ...newMember,
        RoleCode: "MEMBER",
        IsActive: 1
      });
      alert("Tạo hội viên thành công!");
      setShowAddModal(false);
      setNewMember({ FullName: "", PhoneNumber: "", Email: "", Password: "", Gender: "Nam" });
      fetchMembers();
    } catch (error) {
      alert("Lỗi khi tạo hội viên! Có thể email đã tồn tại.");
    }
  };

  const handleCheckIn = async (userId, name) => {
    try {
      await api.post(`/checkins/user/${userId}`);
      alert(`Đã điểm danh thành công cho: ${name}`);
      setCheckedInUsers(prev => [...prev, userId]);
    } catch (error) {
      alert(error.response?.data?.detail || "Lỗi khi điểm danh!");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            {activeTab === "members" ? <Users size={28} color="#4e73df" /> : activeTab === "bookings" ? <Calendar size={28} color="#4e73df" /> : <CheckCircle size={28} color="#1cc88a" />}
            {activeTab === "members" ? "Lễ Tân - Quản lý Hội Viên" : activeTab === "bookings" ? "Lễ Tân - Lên Lịch PT" : "Lễ Tân - Điểm Danh"}
          </h1>
          <p className={styles.subtitle}>Quản lý dữ liệu người dùng và xếp lịch</p>
        </div>
        <div className={styles.tools} style={{ marginBottom: 0 }}>
          <button 
            className={activeTab === "checkin" ? styles.btnPrimary : styles.btnGhost}
            onClick={() => setActiveTab("checkin")}
          >
            Điểm Danh
          </button>
          <button 
            className={activeTab === "members" ? styles.btnPrimary : styles.btnGhost}
            onClick={() => setActiveTab("members")}
          >
            Hội Viên
          </button>
          <button 
            className={activeTab === "bookings" ? styles.btnPrimary : styles.btnGhost}
            onClick={() => setActiveTab("bookings")}
          >
            Lên Lịch PT
          </button>
        </div>
      </div>
      
      {activeTab === "checkin" && (
        <>
          <div className={styles.tools}>
            <div className={styles.searchBox}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Tìm tên hoặc SĐT để điểm danh..."
                value={checkinSearch}
                onChange={(e) => setCheckinSearch(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button 
                className={checkinSubTab === "MANAGER" ? styles.btnPrimary : styles.btnGhost}
                onClick={() => setCheckinSubTab("MANAGER")}
                style={{ padding: "6px 12px", borderRadius: "8px", fontWeight: "500" }}
              >
                Manager
              </button>
              <button 
                className={checkinSubTab === "PT" ? styles.btnPrimary : styles.btnGhost}
                onClick={() => setCheckinSubTab("PT")}
                style={{ padding: "6px 12px", borderRadius: "8px", fontWeight: "500" }}
              >
                PT
              </button>
              <button 
                className={checkinSubTab === "MEMBER" ? styles.btnPrimary : styles.btnGhost}
                onClick={() => setCheckinSubTab("MEMBER")}
                style={{ padding: "6px 12px", borderRadius: "8px", fontWeight: "500" }}
              >
                Hội viên
              </button>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Họ Tên</th>
                  <th>Vai Trò</th>
                  <th>SĐT</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {allUsers
                  .filter(u => u.RoleCode !== 'ADMIN')
                  .filter(u => u.RoleCode === checkinSubTab)
                  .filter(u => u.FullName?.toLowerCase().includes(checkinSearch.toLowerCase()) || (u.PhoneNumber && u.PhoneNumber.includes(checkinSearch)))
                  .map((u) => (
                  <tr key={u.UserID}>
                    <td>#{u.UserID}</td>
                    <td style={{ fontWeight: 600 }}>{u.FullName}</td>
                    <td>
                      <span className={u.RoleCode === 'MEMBER' ? styles.pillLow : styles.pillHigh}>
                        {u.RoleName}
                      </span>
                    </td>
                    <td>{u.PhoneNumber || "N/A"}</td>
                    <td>
                      <div className={styles.actions}>
                        {checkedInUsers.includes(u.UserID) ? (
                          <button 
                            className={styles.btnPrimary} 
                            disabled
                            style={{ backgroundColor: "#858796", color: "white", padding: "8px 16px", borderRadius: "8px", opacity: 0.7, cursor: "not-allowed" }}
                          >
                            <CheckCircle size={16} style={{display: "inline", marginRight: "4px"}}/>
                            Đã điểm danh
                          </button>
                        ) : (
                          <button 
                            className={styles.btnPrimary} 
                            title="Điểm danh"
                            style={{ backgroundColor: "#1cc88a", color: "white", padding: "8px 16px", borderRadius: "8px" }}
                            onClick={() => handleCheckIn(u.UserID, u.FullName)}
                          >
                            <CheckCircle size={16} style={{display: "inline", marginRight: "4px"}}/>
                            Check-in
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "members" && (
        <>
          <div className={styles.tools}>
            <div className={styles.searchBox}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Tìm theo tên hoặc SĐT..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className={styles.btnPrimary}
            >
              <PlusCircle size={18} />
              Tạo Khách Hàng
            </button>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Họ Tên</th>
                  <th>SĐT</th>
                  <th>Trạng Thái</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {members.filter(m => m.FullName.toLowerCase().includes(search.toLowerCase()) || (m.PhoneNumber && m.PhoneNumber.includes(search))).map((m) => (
                  <tr key={m.UserID}>
                    <td>#{m.UserID}</td>
                    <td style={{ fontWeight: 600 }}>{m.FullName}</td>
                    <td>{m.PhoneNumber || "N/A"}</td>
                    <td>
                      <span className={m.IsActive ? styles.pillLow : styles.pillHigh}>
                        {m.IsActive ? "Hoạt động" : "Bị khóa"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button 
                          onClick={() => handleToggleStatus(m.UserID)}
                          className={m.IsActive ? styles.btnDanger : styles.btnView}
                          style={{ padding: "8px 16px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "6px", fontWeight: "500" }}
                        >
                          {m.IsActive ? <Lock size={18}/> : <Unlock size={18}/>}
                          {m.IsActive ? "Khóa" : "Mở Khóa"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "bookings" && (
        <>
          <div className={styles.tools}>
            <div className={styles.searchBox}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Tìm hội viên..."
                readOnly
              />
            </div>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Hội viên</th>
                  <th>PT Phụ Trách</th>
                  <th>Trạng Thái</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {ptRelations.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "30px 0", color: "var(--theme-text)" }}>
                      Không có hội viên nào đang có PT phụ trách.
                    </td>
                  </tr>
                )}
                {ptRelations.map(rel => (
                  <tr key={rel.RelationID}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{rel.MemberName}</div>
                      <div style={{ fontSize: "1.3rem", color: "var(--theme-text)" }}>Mã HV: #{rel.MemberID}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{rel.PTName}</td>
                    <td>
                      <span className={styles.pillLow}>Đang học PT</span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button 
                          className={styles.btnPrimary} 
                          style={{ padding: "8px 16px", fontSize: "1.4rem" }}
                          onClick={() => {
                            setSelectedRelation(rel);
                            setShowBookingModal(true);
                          }}
                        >
                          <CalendarPlus size={16} /> Lên lịch
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showBookingModal && selectedRelation && (
        <Modal
          isOpen={true}
          onRequestClose={() => setShowBookingModal(false)}
          title="📅 Lên lịch tập PT định kỳ"
        >
          <div style={{ padding: "0 10px" }}>
            <div style={{ padding: "12px 14px", background: "linear-gradient(135deg,#4e73df11,#1cc88a11)", border: "1px solid #4e73df33", borderRadius: 10, display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ fontSize: "1.3rem", color: "var(--theme-text)" }}>
                <strong style={{ color: "var(--theme-text-dark)", fontSize: "1.5rem" }}>Hội viên: {selectedRelation.MemberName}</strong>
                <span> · PT: {selectedRelation.PTName}</span>
              </div>
            </div>
            
            <form onSubmit={handleCreateBooking} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              
              <div style={sectionSt}>
                {sectionTitle("1", "Phạm vi ngày")}
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: "var(--theme-text)", fontSize: "1.3rem", display: "block", marginBottom: 4 }}>Từ ngày *</label>
                    <input 
                      type="date" 
                      style={{ ...inputSt, colorScheme: "auto" }}
                      required
                      value={bookingData.startDate}
                      onChange={e => setBookingData({...bookingData, startDate: e.target.value})}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: "var(--theme-text)", fontSize: "1.3rem", display: "block", marginBottom: 4 }}>Đến ngày *</label>
                    <input 
                      type="date" 
                      style={{ ...inputSt, colorScheme: "auto" }}
                      required
                      value={bookingData.endDate}
                      onChange={e => setBookingData({...bookingData, endDate: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div style={sectionSt}>
                {sectionTitle("2", "Lịch học trong tuần")}
                <div style={{ color: "var(--theme-text)", fontSize: "1.25rem", marginBottom: 10 }}>Chọn các ngày lịch lặp lại:</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    { val: "1", label: "T2" },
                    { val: "2", label: "T3" },
                    { val: "3", label: "T4" },
                    { val: "4", label: "T5" },
                    { val: "5", label: "T6" },
                    { val: "6", label: "T7" },
                    { val: "0", label: "CN" }
                  ].map(day => {
                    const active = bookingData.daysOfWeek.includes(day.val);
                    return (
                      <button
                        key={day.val}
                        type="button"
                        onClick={() => handleToggleDay(day.val)}
                        style={{ padding: "8px 16px", borderRadius: 20, border: `2px solid ${active ? "#36b9cc" : "var(--theme-border)"}`, background: active ? "#36b9cc" : "transparent", color: active ? "#fff" : "var(--theme-text)", fontWeight: 700, cursor: "pointer", fontSize: "1.3rem", transition: "all 0.2s", minWidth: 44 }}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={sectionSt}>
                {sectionTitle("3", "Giờ tập")}
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: "var(--theme-text)", fontSize: "1.3rem", display: "block", marginBottom: 4 }}>Giờ bắt đầu *</label>
                    <input 
                      type="time" 
                      style={{ ...inputSt, colorScheme: "auto" }}
                      required
                      value={bookingData.startTime}
                      onChange={e => setBookingData({...bookingData, startTime: e.target.value})}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: "var(--theme-text)", fontSize: "1.3rem", display: "block", marginBottom: 4 }}>Giờ kết thúc *</label>
                    <input 
                      type="time" 
                      style={{ ...inputSt, colorScheme: "auto" }}
                      required
                      value={bookingData.endTime}
                      onChange={e => setBookingData({...bookingData, endTime: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
                <button 
                  type="button" 
                  onClick={() => setShowBookingModal(false)}
                  style={{ padding: "10px 22px", background: "var(--theme-bg)", color: "var(--theme-text-dark)", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 600 }}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  style={{ padding: "10px 24px", background: "linear-gradient(135deg,#f6c23e,#d4a017)", color: "var(--theme-text-dark)", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 700 }}
                >
                  💾 Xác nhận lịch
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Tạo Hội viên mới</h3>
            <form onSubmit={handleCreateMember}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                <input 
                  type="text" 
                  className="w-full border p-2 rounded" 
                  required
                  value={newMember.FullName}
                  onChange={e => setNewMember({...newMember, FullName: e.target.value})}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Đăng nhập)</label>
                <input 
                  type="email" 
                  className="w-full border p-2 rounded" 
                  required
                  value={newMember.Email}
                  onChange={e => setNewMember({...newMember, Email: e.target.value})}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                <input 
                  type="password" 
                  className="w-full border p-2 rounded" 
                  required
                  minLength={6}
                  value={newMember.Password}
                  onChange={e => setNewMember({...newMember, Password: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SĐT</label>
                  <input 
                    type="text" 
                    className="w-full border p-2 rounded"
                    value={newMember.PhoneNumber}
                    onChange={e => setNewMember({...newMember, PhoneNumber: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                  <select 
                    className="w-full border p-2 rounded"
                    value={newMember.Gender}
                    onChange={e => setNewMember({...newMember, Gender: e.target.value})}
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className={styles.btnGhost}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className={styles.btnPrimary}
                >
                  Tạo mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReceptionistDashboard;
