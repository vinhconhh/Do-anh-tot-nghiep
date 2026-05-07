import { authedRequestJson } from "./client";

const api = {
  get: async (url) => {
    const token = localStorage.getItem("token");
    const fullUrl = url.startsWith("/api") ? url : `/api${url.startsWith("/") ? "" : "/"}${url}`;
    const data = await authedRequestJson(fullUrl, token, { method: "GET" });
    return { data };
  },
  post: async (url, body) => {
    const token = localStorage.getItem("token");
    const fullUrl = url.startsWith("/api") ? url : `/api${url.startsWith("/") ? "" : "/"}${url}`;
    const data = await authedRequestJson(fullUrl, token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    return { data };
  },
  put: async (url, body) => {
    const token = localStorage.getItem("token");
    const fullUrl = url.startsWith("/api") ? url : `/api${url.startsWith("/") ? "" : "/"}${url}`;
    const data = await authedRequestJson(fullUrl, token, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    return { data };
  },
  delete: async (url) => {
    const token = localStorage.getItem("token");
    const fullUrl = url.startsWith("/api") ? url : `/api${url.startsWith("/") ? "" : "/"}${url}`;
    const data = await authedRequestJson(fullUrl, token, { method: "DELETE" });
    return { data };
  }
};

export default api;
