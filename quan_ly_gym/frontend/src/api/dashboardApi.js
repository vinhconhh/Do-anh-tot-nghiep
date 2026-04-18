import { useCallback, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { authedRequestJson } from "./client";

export function useDashboardApi() {
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
        throw e;
      }
    },
    [token, logout]
  );

  const getStats = useCallback(
    async () => aj(`/api/dashboard/stats`),
    [aj]
  );

  const getRevenue = useCallback(
    async () => aj(`/api/dashboard/revenue`),
    [aj]
  );

  const getRecentMembers = useCallback(
    async () => aj(`/api/dashboard/recent-members`),
    [aj]
  );

  const getMemberStats = useCallback(
    async () => aj(`/api/dashboard/member-stats`),
    [aj]
  );

  return { getStats, getRevenue, getRecentMembers, getMemberStats };
}
