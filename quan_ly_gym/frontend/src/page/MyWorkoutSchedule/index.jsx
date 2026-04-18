import { useMemo, useState } from "react";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import ScheduleWeek, { startOfWeekMonday } from "../../components/ScheduleWeek";
import styles from "./MyWorkoutSchedule.module.scss";

export default function MyWorkoutSchedule() {
  const { user } = useContext(AuthContext) ?? {};
  const displayName = user?.hoTen || "Hội viên";

  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));

  const events = useMemo(() => [], [weekStart]);

  return (
    <>
      <div className={styles.tab} />
      <div className={styles.page}>
        <ScheduleWeek
          title="Lịch tập của tôi"
          subtitle={`Hội viên: ${displayName}`}
          weekStart={weekStart}
          onChangeWeekStart={setWeekStart}
          events={events}
        />
      </div>
    </>
  );
}
