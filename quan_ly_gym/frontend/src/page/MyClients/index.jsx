import { useMemo, useState, useEffect, useCallback, useContext } from "react";
import { Search, UserRound, Loader2, Mail, Target, Calendar } from "lucide-react";
import styles from "./MyClients.module.scss";
import { usePtRequestsApi } from "../../api/ptRequestsApi";
import { AuthContext } from "../../context/AuthContext";

export default function MyClients() {
  const api = usePtRequestsApi();
  const { user } = useContext(AuthContext) ?? {};
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientProfile, setClientProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const cls = await api.getMyClients();
      setClients(cls);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [api]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const loadClientProfile = useCallback(async (memberId) => {
    setClientProfile(null);
    try {
      const p = await api.getClientProfile(memberId);
      setClientProfile(p);
    } catch (e) { console.error(e); }
  }, [api]);

  useEffect(() => {
    if (selectedClient) loadClientProfile(selectedClient.memberId);
  }, [selectedClient, loadClientProfile]);

  const filtered = useMemo(() => {
    if (!q) return clients;
    const lq = q.toLowerCase();
    return clients.filter(c => [c.memberName, c.memberEmail, c.goal].filter(Boolean).join(" ").toLowerCase().includes(lq));
  }, [clients, q]);

  if (loading) return <div className={styles.loadingState}><Loader2 className={styles.spinner} /><span>Đang tải...</span></div>;

  return (
    <>
      <div className={styles.tab} />
      <div className={styles.page}>
        {/* Heading */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Khách hàng của tôi</h2>
            <p className={styles.subtitle}>Quản lý các hội viên đã thuê bạn làm huấn luyện viên</p>
          </div>
          <div className={styles.badge}>
            Tổng: <strong>{clients.length}</strong>
          </div>
        </div>

        {clients.length === 0 ? (
          <div className={styles.emptyState}>
            <UserRound size={48} />
            <p>Bạn chưa có khách hàng nào</p>
            <small>Chờ hội viên gửi yêu cầu thuê PT và bạn phê duyệt.</small>
          </div>
        ) : (
          <div className={styles.mainGrid}>
            {/* Left: Client list */}
            <div className={styles.clientListCard}>
              <div className={styles.searchWrap}>
                <Search size={18} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Tìm kiếm khách hàng..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              <div className={styles.clientList}>
                {filtered.map((c) => (
                  <div
                    key={c.requestId}
                    className={`${styles.clientItem} ${selectedClient?.requestId === c.requestId ? styles.clientItemActive : ""}`}
                    onClick={() => setSelectedClient(c)}
                  >
                    <div className={styles.clientAvatar}>
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(c.memberName)}&background=4e73df&color=fff&size=40`}
                        alt={c.memberName}
                      />
                    </div>
                    <div className={styles.clientInfo}>
                      <div className={styles.clientName}>{c.memberName}</div>
                      <div className={styles.clientGoal}>{c.goal || "Chưa có nhu cầu"}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Client profile */}
            {selectedClient && (
              <div className={styles.profileCard}>
                <div className={styles.profileHeader}>
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedClient.memberName)}&background=4e73df&color=fff&size=80`}
                    alt={selectedClient.memberName}
                    className={styles.profileAvatar}
                  />
                  <div>
                    <h3 className={styles.profileName}>{selectedClient.memberName}</h3>
                    <p className={styles.profileEmail}>{selectedClient.memberEmail}</p>
                  </div>
                </div>

                <div className={styles.profileSection}>
                  <h4 className={styles.sectionTitle}>Thông tin</h4>
                  <div className={styles.infoRows}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>
                        <Target size={16} /> Nhu cầu tập
                      </span>
                      <span className={styles.infoVal}>{selectedClient.goal || "—"}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>
                        <Calendar size={16} /> Kết nối từ
                      </span>
                      <span className={styles.infoVal}>{selectedClient.connectedSince}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>
                        <Mail size={16} /> Email
                      </span>
                      <span className={styles.infoVal}>{selectedClient.memberEmail}</span>
                    </div>
                  </div>
                </div>

                {clientProfile && (
                  <div className={styles.profileSection}>
                    <h4 className={styles.sectionTitle}>Tiến độ tập luyện</h4>
                    <div className={styles.statsGrid}>
                      <div className={styles.stat}>
                        <div className={styles.statLabel}>Buổi hoàn thành</div>
                        <div className={styles.statVal}>{clientProfile.sessionsCompleted || 0}</div>
                      </div>
                      <div className={styles.stat}>
                        <div className={styles.statLabel}>Lịch tập</div>
                        <div className={styles.statVal}>{clientProfile.totalSchedules || 0}</div>
                      </div>
                      <div className={styles.stat}>
                        <div className={styles.statLabel}>Chuỗi ngày</div>
                        <div className={styles.statVal}>{clientProfile.streak || 0}</div>
                      </div>
                      <div className={styles.stat}>
                        <div className={styles.statLabel}>Điểm</div>
                        <div className={styles.statVal}>{clientProfile.totalPoints || 0}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
