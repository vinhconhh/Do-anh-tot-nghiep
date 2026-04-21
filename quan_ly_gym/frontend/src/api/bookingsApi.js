import { useCallback, useContext, useMemo } from "react";
import { AuthContext } from "../context/AuthContext";
import { authedRequestJson } from "./client";

export function useBookingsApi() {
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

  return useMemo(() => ({
    list: () => aj(`/api/bookings`),
    listMy: () => aj(`/api/bookings/my`),
    updateStatus: (id, status) => aj(`/api/bookings/${id}/status?status=${status}`, { method: "PUT" }),
  }), [aj]);
}
