import { useState, useEffect } from "react";
import { Dumbbell, Search, Filter } from "lucide-react";
import styles from "./Exercises.module.scss";
import { useExercisesApi } from "../../api/exercisesApi";

export default function Exercises() {
  const { list } = useExercisesApi();
  const [exercises, setExercises] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    list()
      .then(setExercises)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [list]);

  const filtered = exercises.filter(ex => 
    !q || 
    ex.name.toLowerCase().includes(q.toLowerCase()) || 
    ex.muscleGroup.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Danh mục Bài tập Master</h2>
          <p className={styles.subtitle}>Thư viện bài tập chuẩn dành cho việc thiết kế lịch tập.</p>
        </div>
      </div>

      <div className={styles.tools}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Tìm kiếm bài tập hoặc nhóm cơ..." 
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.grid}>
        {loading ? (
          <div className={styles.empty}>Đang tải dữ liệu...</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>Không tìm thấy bài tập nào.</div>
        ) : (
          filtered.map((ex) => (
            <div key={ex.id} className={styles.card}>
              <div className={styles.cardIcon}>
                <Dumbbell size={24} />
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.exName}>{ex.name}</h3>
                <div className={styles.badges}>
                  <span className={styles.badge}>{ex.muscleGroup}</span>
                  <span className={`${styles.badge} ${styles.outline}`}>{ex.equipment}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
