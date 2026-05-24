import { useCallback, useContext, useMemo } from "react";
import { AuthContext } from "../context/AuthContext";
import { authedRequestJson } from "./client";

export function useUsersApi() {
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

  const getMe = useCallback(async () => aj(`/api/users/me`), [aj]);

  const updateMe = useCallback(
    async (payload) =>
      aj(`/api/users/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    [aj]
  );

  return useMemo(() => ({ getMe, updateMe }), [getMe, updateMe]);
}
