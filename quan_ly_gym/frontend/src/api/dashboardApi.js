import { useCallback, useContext, useMemo } from "react";
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

  const updateMemberMetrics = useCallback(
    async (metrics) => aj(`/api/dashboard/member-stats/metrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metrics)
    }),
    [aj]
  );

  const getMemberReportDetail = useCallback(
    async (id) => aj(`/api/dashboard/member-report/${id}`),
    [aj]
  );

  const getTrainerReportDetail = useCallback(
    async (id) => aj(`/api/dashboard/trainer-report/${id}`),
    [aj]
  );

  const getTopTrainers = useCallback(
    async () => aj(`/api/dashboard/top-trainers`),
    [aj]
  );

  return useMemo(
    () => ({
      getStats,
      getRevenue,
      getRecentMembers,
      getMemberStats,
      updateMemberMetrics,
      getMemberReportDetail,
      getTrainerReportDetail,
      getTopTrainers,
    }),
    [getStats, getRevenue, getRecentMembers, getMemberStats, updateMemberMetrics, getMemberReportDetail, getTrainerReportDetail, getTopTrainers]
  );
}
