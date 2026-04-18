import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Check, X, UserRound, UserCog } from "lucide-react";
import styles from "./PtRequests.module.scss";

const MEMBERS = [];

const TRAINERS = [];

const STATUS_META = {
  pending: { label: "Chờ duyệt", cls: "pillPending" },
  approved: { label: "Đã duyệt", cls: "pillApproved" },
  rejected: { label: "Từ chối", cls: "pillRejected" },
};

export default function PtRequests() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [rows, setRows] = useState([]);

  const byMember = useMemo(() => Object.fromEntries(MEMBERS.map((m) => [m.id, m])), []);
  const byTrainer = useMemo(() => Object.fromEntries(TRAINERS.map((t) => [t.id, t])), []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const m = byMember[r.memberId];
      const pref = r.preferredTrainerId ? byTrainer[r.preferredTrainerId] : null;
      const assign = r.assignedTrainerId ? byTrainer[r.assignedTrainerId] : null;
      const text = [
        r.id,
        r.note,
        m?.hoTen,
        m?.nhuCauTap,
        pref?.hoTen,
        assign?.hoTen,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchQ = !q || text.includes(q.toLowerCase());
      const matchStatus = filterStatus === "all" || r.status === filterStatus;
      return matchQ && matchStatus;
    });
  }, [rows, q, filterStatus, byMember, byTrainer]);

  const approve = (r) => {
    const trainerId = r.assignedTrainerId || r.preferredTrainerId;
    setRows((prev) =>
      prev.map((x) =>
        x.id === r.id
          ? { ...x, status: "approved", assignedTrainerId: trainerId || x.assignedTrainerId }
          : x
      )
    );
  };

  const reject = (r) => {
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: "rejected" } : x)));
  };

  const openMember = (id) => nav(`/members/${id}`);
  const openTrainer = (id) => nav(`/trainers?selected=${id}`);

  return (
    <>
      <div className={styles.tab} />
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Yêu cầu thuê PT</h2>
            <p className={styles.subtitle}>
              Liên kết trực tiếp sang <strong>Hội viên</strong> (tên/tuổi/giới tính/nhu cầu tập) và{" "}
              <strong>Huấn luyện viên</strong> (tên/tuổi/giới tính/chuyên môn).
            </p>
          </div>
        </div>

        <div className={styles.tools}>
          <div className={styles.searchBox}>
            <Search className={styles.searchIcon} size={16} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo mã request, hội viên, PT, nhu cầu…" />
            {q && (
              <button className={styles.clear} onClick={() => setQ("")}>
                ×
              </button>
            )}
          </div>

          <div className={styles.filterGroup}>
            {["all", "pending", "approved", "rejected"].map((s) => (
              <button
                key={s}
                className={`${styles.filterBtn} ${filterStatus === s ? styles.filterActive : ""}`}
                onClick={() => setFilterStatus(s)}
              >
                {{ all: "Tất cả", pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Từ chối" }[s]}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Request</th>
                <th>Hội viên</th>
                <th>Nhu cầu tập</th>
                <th>PT đề xuất / gán</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 18, color: "#858796" }}>
                    Không có dữ liệu
                  </td>
                </tr>
              )}
              {filtered.map((r) => {
                const m = byMember[r.memberId];
                const pref = r.preferredTrainerId ? byTrainer[r.preferredTrainerId] : null;
                const assign = r.assignedTrainerId ? byTrainer[r.assignedTrainerId] : null;
                const meta = STATUS_META[r.status] || STATUS_META.pending;
                return (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 900, color: "#5a5c69" }}>{r.id}</div>
                      <div className={styles.muted}>{r.createdAt}</div>
                      {r.note && <div className={styles.muted} style={{ marginTop: 6 }}>{r.note}</div>}
                    </td>
                    <td>
                      <button className={styles.linkBtn} onClick={() => openMember(r.memberId)}>
                        <UserRound size={14} style={{ marginRight: 6 }} />
                        {m?.hoTen || `Member#${r.memberId}`}
                      </button>
                      <div className={styles.muted}>{m?.tuoi || "—"} tuổi · {m?.gioiTinh || "—"}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, color: "#5a5c69" }}>{m?.nhuCauTap || "—"}</div>
                    </td>
                    <td>
                      {assign ? (
                        <>
                          <button className={styles.linkBtn} onClick={() => openTrainer(assign.id)}>
                            <UserCog size={14} style={{ marginRight: 6 }} />
                            {assign.hoTen} (đã gán)
                          </button>
                          <div className={styles.muted}>{assign.tuoi} tuổi · {assign.gioiTinh}</div>
                          <div className={styles.chipWrap}>
                            {(assign.specialties || []).slice(0, 3).map((s) => (
                              <span key={s} className={styles.chip}>{s}</span>
                            ))}
                          </div>
                        </>
                      ) : pref ? (
                        <>
                          <button className={styles.linkBtn} onClick={() => openTrainer(pref.id)}>
                            <UserCog size={14} style={{ marginRight: 6 }} />
                            {pref.hoTen} (đề xuất)
                          </button>
                          <div className={styles.muted}>{pref.tuoi} tuổi · {pref.gioiTinh}</div>
                          <div className={styles.chipWrap}>
                            {(pref.specialties || []).slice(0, 3).map((s) => (
                              <span key={s} className={styles.chip}>{s}</span>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className={styles.muted}>Chưa có PT đề xuất</div>
                      )}
                    </td>
                    <td>
                      <span className={`${styles.pill} ${styles[meta.cls]}`}>{meta.label}</span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        {r.status === "pending" ? (
                          <>
                            <button className={styles.btnPrimary} onClick={() => approve(r)}>
                              <Check size={16} /> Duyệt
                            </button>
                            <button className={styles.btnDanger} onClick={() => reject(r)}>
                              <X size={16} /> Từ chối
                            </button>
                          </>
                        ) : (
                          <button className={styles.btnGhost} onClick={() => openMember(r.memberId)}>
                            Xem hội viên
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
