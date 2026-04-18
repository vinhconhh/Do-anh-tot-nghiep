import { useCallback, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { authedRequestJson } from "./client";

export function useSchedulesApi() {
  const { token, logout } = useContext(AuthContext);

  const aj = useCallback(
    async (path, opt = {}) => {
      try {
        return await authedRequestJson(path, token, opt);
      } catch (e) {
        if (e?.status === 401) {
          logout?.();
          throw new Error("Phiên đăng nhập đã hết hạn.");
        }
        if (e?.status === 403) throw new Error("Bạn không có quyền.");
        throw e;
      }
    },
    [token, logout]
  );

  const listByMember = useCallback(
    async (memberId) => aj(`/api/schedules?user_id=${memberId}`),
    [aj]
  );

  const listByTrainer = useCallback(
    async (trainerId) => aj(`/api/schedules?user_id=${trainerId}`),
    [aj]
  );

  const mySchedule = useCallback(
    async () => aj(`/api/schedules/my`),
    [aj]
  );

  return { listByMember, listByTrainer, mySchedule };
}
