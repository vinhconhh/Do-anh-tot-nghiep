import { useState, useEffect } from "react";
import ScheduleWeek, { startOfWeekMonday } from "../../components/ScheduleWeek";
import styles from "./Schedules.module.scss";
import { useMembersApi } from "../../api/membersApi";
import { useTrainersApi } from "../../api/trainersApi";
import { useSchedulesApi } from "../../api/schedulesApi";

export default function Schedules() {
  const membersApi = useMembersApi();
  const trainersApi = useTrainersApi();
  const schedulesApi = useSchedulesApi();

  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [kind, setKind] = useState("member"); // member | trainer
  const [memberId, setMemberId] = useState("");
  const [trainerId, setTrainerId] = useState("");
  const [memberOptions, setMemberOptions] = useState([]);
  const [trainerOptions, setTrainerOptions] = useState([]);
  const [events, setEvents] = useState([]);

  // Load member and trainer lists
  useEffect(() => {
    membersApi.list()
      .then((data) => setMemberOptions(data.map((m) => ({ id: String(m.UserID), label: m.hoTen }))))
      .catch(console.error);
    trainersApi.list()
      .then((data) => setTrainerOptions(data.map((t) => ({ id: String(t.UserID), label: t.hoTen }))))
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load schedules when selection changes
  useEffect(() => {
    setEvents([]);
    if (kind === "member" && memberId) {
      schedulesApi.listByMember(memberId).then(setEvents).catch(console.error);
    } else if (kind === "trainer" && trainerId) {
      schedulesApi.listByTrainer(trainerId).then(setEvents).catch(console.error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, memberId, trainerId, weekStart]);

  const selectedLabel = kind === "member"
    ? memberOptions.find((x) => x.id === memberId)?.label || "—"
    : trainerOptions.find((x) => x.id === trainerId)?.label || "—";

  return (
    <>
      <div className={styles.tab} />
      <div className={styles.page}>
        <div className={styles.toolbar}>
          <div className={styles.left}>
            <div className={styles.seg}>
              <button
                className={`${styles.segBtn} ${kind === "member" ? styles.segActive : ""}`}
                onClick={() => setKind("member")}
              >
                Lịch tập hội viên
              </button>
              <button
                className={`${styles.segBtn} ${kind === "trainer" ? styles.segActive : ""}`}
                onClick={() => setKind("trainer")}
              >
                Lịch làm PT
              </button>
            </div>

            {kind === "member" ? (
              <select
                className={styles.select}
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
              >
                <option value="">— Chọn hội viên —</option>
                {memberOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            ) : (
              <select
                className={styles.select}
                value={trainerId}
                onChange={(e) => setTrainerId(e.target.value)}
              >
                <option value="">— Chọn PT —</option>
                {trainerOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <ScheduleWeek
          title="Lịch tổng (Admin/Manager)"
          subtitle={`Đang xem: ${selectedLabel}`}
          weekStart={weekStart}
          onChangeWeekStart={setWeekStart}
          events={events}
        />
      </div>
    </>
  );
}
