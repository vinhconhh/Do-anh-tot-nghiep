import { useCallback, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { authedRequestJson } from "./client";

export function useAiApi() {
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

  const getQuota = useCallback(
    async () => aj(`/api/ai/quota`),
    [aj]
  );

  const getPackages = useCallback(
    async () => aj(`/api/ai/packages`),
    [aj]
  );

  const getHistory = useCallback(
    async () => aj(`/api/ai/purchase-history`),
    [aj]
  );

  const buyPackage = useCallback(
    async (packageId) =>
      aj(`/api/ai/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      }),
    [aj]
  );

  return { getQuota, getPackages, getHistory, buyPackage };
}
