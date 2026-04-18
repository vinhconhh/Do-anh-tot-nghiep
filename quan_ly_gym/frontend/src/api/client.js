// Vite proxy handles /api/* → backend, so base URL is empty for dev/docker
export const API_BASE_URL = "";

async function readJsonSafe(res) {
  return await res.json().catch(() => ({}));
}

export async function requestJson(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, options);
  const data = await readJsonSafe(res);
  if (!res.ok) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function authedRequestJson(path, token, options = {}) {
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return requestJson(path, { ...options, headers });
}

