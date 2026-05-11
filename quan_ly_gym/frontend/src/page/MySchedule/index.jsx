import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import ScheduleWeek, { startOfWeekMonday } from "../../components/ScheduleWeek";
import styles from "./MySchedule.module.scss";
import { useSchedulesApi } from "../../api/schedulesApi";
import AttendanceModal from "../../components/Modal/AttendanceModal";

export default function MySchedule() {
  const { user } = useContext(AuthContext) ?? {};
  const displayName = user?.hoTen || "PT";
  const schedulesApi = useSchedulesApi();
  
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [events, setEvents] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedClassTitle, setSelectedClassTitle] = useState("");

  const fetchSchedule = () => {
    schedulesApi.mySchedule()
      .then(setEvents)
      .catch(console.error);
  };

  useEffect(() => {
    fetchSchedule();
  }, [schedulesApi, weekStart]);

  const handleEventClick = (ev) => {
    if (ev.id.startsWith("teach_")) {
      const classId = parseInt(ev.id.replace("teach_", ""), 10);
      setSelectedClassId(classId);
      setSelectedClassTitle(ev.title);
    }
  };

  return (
    <>
      <div className={styles.tab} />
      <div className={styles.page}>
        <ScheduleWeek
          title="Lịch làm của tôi"
          subtitle={`PT: ${displayName}`}
          weekStart={weekStart}
          onChangeWeekStart={setWeekStart}
          onEventClick={handleEventClick}
          events={events}
        />
      </div>

      {selectedClassId && (
        <AttendanceModal 
          classId={selectedClassId} 
          classTitle={selectedClassTitle} 
          onClose={() => {
            setSelectedClassId(null);
            fetchSchedule(); // Refresh schedule meta data after potential attendance changes
          }} 
        />
      )}
    </>
  );
}
