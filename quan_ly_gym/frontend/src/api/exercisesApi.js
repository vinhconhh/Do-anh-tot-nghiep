import { useCallback, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { requestJson } from "./client";

export function useExercisesApi() {
  const { logout } = useContext(AuthContext);

  const aj = useCallback(
    async (path, opt = {}) => {
      try {
        return await requestJson(path, opt);
      } catch (e) {
        if (e?.status === 401) {
          logout?.();
          throw new Error("Phiên đăng nhập đã hết hạn.");
        }
        throw e;
      }
    },
    [logout]
  );

  const list = useCallback(() => aj(`/api/exercises`), [aj]);
  const listGroups = useCallback(() => aj(`/api/exercises/groups`), [aj]);

  return { list, listGroups };
}
