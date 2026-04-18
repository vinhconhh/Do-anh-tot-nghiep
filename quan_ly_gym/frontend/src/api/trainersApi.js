import { useCallback, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { authedRequestJson } from "./client";

export function useTrainersApi() {
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

  const list = useCallback(async () => aj(`/api/trainers`), [aj]);

  const getById = useCallback(
    async (id) => aj(`/api/trainers/${id}`),
    [aj]
  );

  const create = useCallback(
    async (payload) =>
      aj(`/api/trainers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    [aj]
  );

  const update = useCallback(
    async (id, payload) =>
      aj(`/api/trainers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    [aj]
  );

  const remove = useCallback(
    async (id) => aj(`/api/trainers/${id}`, { method: "DELETE" }),
    [aj]
  );

  return { list, getById, create, update, remove };
}
