import PropTypes from "prop-types";
import styles from "./ScheduleWeek.module.scss";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function fmtDate(d) {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function startOfWeekMonday(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // 0..6, Monday=0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function minutesSinceStart(d, startHour) {
  return (d.getHours() - startHour) * 60 + d.getMinutes();
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

const DOW = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export default function ScheduleWeek({
  title,
  subtitle,
  timezoneLabel = "GMT+7",
  weekStart,
  onChangeWeekStart,
  startHour = 6,
  endHour = 22,
  events = [],
}) {
  const totalMinutes = (endHour - startHour) * 60;
  const slots = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const eventsByDay = days.map((day) => {
    const yyyy = day.getFullYear();
    const mm = day.getMonth();
    const dd = day.getDate();
    return events
      .filter((ev) => {
        const s = new Date(ev.start);
        return s.getFullYear() === yyyy && s.getMonth() === mm && s.getDate() === dd;
      })
      .sort((a, b) => new Date(a.start) - new Date(b.start));
  });

  const rangeText = `${fmtDate(days[0])} → ${fmtDate(days[6])}`;

  return (
    <div className={styles.wrap}>
      <div className={styles.topbar}>
        <div>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <p className={styles.sub}>{subtitle}</p>}
        </div>
        <div className={styles.nav}>
          <button
            className={styles.btn}
            onClick={() => onChangeWeekStart?.(addDays(weekStart, -7))}
          >
            ← Tuần trước
          </button>
          <div className={styles.range}>{rangeText}</div>
          <button
            className={styles.btn}
            onClick={() => onChangeWeekStart?.(addDays(weekStart, 7))}
          >
            Tuần sau →
          </button>
        </div>
      </div>

      <div className={styles.legend}>
        <span><span className={styles.dot} style={{ background: "#4e73df" }} />Lịch tập</span>
        <span><span className={styles.dot} style={{ background: "#1cc88a" }} />Ca dạy</span>
        <span><span className={styles.dot} style={{ background: "#f6c23e" }} />Đã đặt</span>
        <span><span className={styles.dot} style={{ background: "#e74a3b" }} />Bận/khóa</span>
      </div>

      <div className={styles.grid}>
        <div className={styles.gridHeader}>
          <div className={styles.tzCell}>{timezoneLabel}</div>
          {days.map((d, i) => (
            <div key={i} className={styles.hCell}>
              {DOW[i]} <span className={styles.hSub}>{fmtDate(d)}</span>
            </div>
          ))}
        </div>

        <div className={styles.body}>
          <div className={styles.timeCol}>
            {slots.map((h) => (
              <div key={h} className={styles.timeSlot}>
                {pad2(h)}:00
              </div>
            ))}
          </div>

          {days.map((d, i) => (
            <div key={i} className={styles.dayCol}>
              {slots.map((h) => (
                <div key={h} className={styles.slotLine} />
              ))}

              {eventsByDay[i].map((ev) => {
                const s = new Date(ev.start);
                const e = new Date(ev.end);
                const topMin = clamp(minutesSinceStart(s, startHour), 0, totalMinutes);
                const endMin = clamp(minutesSinceStart(e, startHour), 0, totalMinutes);
                const heightMin = Math.max(20, endMin - topMin);
                const top = (topMin / totalMinutes) * 100;
                const height = (heightMin / totalMinutes) * 100;
                const colorClass =
                  ev.color === "green"
                    ? styles.green
                    : ev.color === "orange"
                      ? styles.orange
                      : ev.color === "red"
                        ? styles.red
                        : styles.blue;
                const timeText = `${pad2(s.getHours())}:${pad2(s.getMinutes())}–${pad2(
                  e.getHours()
                )}:${pad2(e.getMinutes())}`;
                return (
                  <div
                    key={ev.id}
                    className={`${styles.event} ${colorClass}`}
                    style={{ top: `${top}%`, height: `${height}%` }}
                    title={ev.title}
                  >
                    <div className={styles.evTitle}>{ev.title}</div>
                    <div className={styles.evMeta}>
                      {timeText}
                      {ev.meta ? ` · ${ev.meta}` : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

ScheduleWeek.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  timezoneLabel: PropTypes.string,
  weekStart: PropTypes.instanceOf(Date).isRequired,
  onChangeWeekStart: PropTypes.func,
  startHour: PropTypes.number,
  endHour: PropTypes.number,
  events: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      start: PropTypes.string.isRequired,
      end: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      meta: PropTypes.string,
      color: PropTypes.oneOf(["blue", "green", "orange", "red"]),
    })
  ),
};

export { startOfWeekMonday };

