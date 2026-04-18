import { useContext, useMemo, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import ScheduleWeek, { startOfWeekMonday } from "../../components/ScheduleWeek";
import styles from "./MySchedule.module.scss";

export default function MySchedule() {
  const { user } = useContext(AuthContext) ?? {};
  const displayName = user?.hoTen || "PT";
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));

  const events = useMemo(() => [], [weekStart]);

  return (
    <>
      <div className={styles.tab} />
      <div className={styles.page}>
        <ScheduleWeek
          title="Lịch làm của tôi"
          subtitle={`PT: ${displayName}`}
          weekStart={weekStart}
          onChangeWeekStart={setWeekStart}
          events={events}
        />
      </div>
    </>
  );
}
