import { useCallback, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { authedRequestJson } from "./client";

export function useMembersApi() {
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

  const list = useCallback(async () => aj(`/api/members`), [aj]);

  const search = useCallback(
    async (q) => aj(`/api/members/search?q=${encodeURIComponent(q || "")}`),
    [aj]
  );

  const getById = useCallback(
    async (id) => aj(`/api/members/${id}`),
    [aj]
  );

  const create = useCallback(
    async (payload) =>
      aj(`/api/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    [aj]
  );

  const update = useCallback(
    async (id, payload) =>
      aj(`/api/members/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    [aj]
  );

  const remove = useCallback(
    async (id) => aj(`/api/members/${id}`, { method: "DELETE" }),
    [aj]
  );

  return { list, search, getById, create, update, remove };
}
