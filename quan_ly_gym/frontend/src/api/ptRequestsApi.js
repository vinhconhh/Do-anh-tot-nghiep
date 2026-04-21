import { useCallback, useContext, useMemo } from "react";
import { AuthContext } from "../context/AuthContext";
import { authedRequestJson } from "./client";

export function usePtRequestsApi() {
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
    getAvailablePTs: () => aj("/api/pt-requests/available-pts"),
    getAll: () => aj("/api/pt-requests"),
    getMyRequests: () => aj("/api/pt-requests/my-requests"),
    getIncoming: () => aj("/api/pt-requests/incoming"),
    create: (ptId, goal, note) =>
      aj("/api/pt-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ptId, goal, note }),
      }),
    respond: (id, status) =>
      aj(`/api/pt-requests/${id}/respond`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }),
    assign: (id, ptId) =>
      aj(`/api/pt-requests/${id}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ptId }),
      }),
  }), [aj]);
}
