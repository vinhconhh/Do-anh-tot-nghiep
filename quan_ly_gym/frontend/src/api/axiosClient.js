import { authedRequestJson } from "./client";

const handle401 = (err) => {
  if (err?.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  }
  throw err;
};

const buildUrl = (url, params) => {
  const base = url.startsWith("/api") ? url : `/api${url.startsWith("/") ? "" : "/"}${url}`;
  if (!params || Object.keys(params).length === 0) return base;
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
  ).toString();
  return qs ? `${base}?${qs}` : base;
};

const api = {
  get: async (url, { params } = {}) => {
    const token = localStorage.getItem("token");
    const fullUrl = buildUrl(url, params);
    return authedRequestJson(fullUrl, token, { method: "GET" })
      .then((data) => ({ data }))
      .catch(handle401);
  },
  post: async (url, body) => {
    const token = localStorage.getItem("token");
    const fullUrl = buildUrl(url);
    return authedRequestJson(fullUrl, token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((data) => ({ data }))
      .catch(handle401);
  },
  put: async (url, body) => {
    const token = localStorage.getItem("token");
    const fullUrl = buildUrl(url);
    return authedRequestJson(fullUrl, token, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((data) => ({ data }))
      .catch(handle401);
  },
  delete: async (url, { params } = {}) => {
    const token = localStorage.getItem("token");
    const fullUrl = buildUrl(url, params);
    return authedRequestJson(fullUrl, token, { method: "DELETE" })
      .then((data) => ({ data }))
      .catch(handle401);
  },
};

export default api;
