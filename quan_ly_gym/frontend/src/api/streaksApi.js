import { useCallback, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { authedRequestJson } from "./client";

export function useStreaksApi() {
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

  const checkIn = useCallback(() => aj("/api/streaks/checkin", { method: "POST" }), [aj]);
  const getMy = useCallback(() => aj("/api/streaks/my"), [aj]);
  const getLeaderboard = useCallback(() => aj("/api/streaks/leaderboard"), [aj]);

  return { checkIn, getMy, getLeaderboard };
}
