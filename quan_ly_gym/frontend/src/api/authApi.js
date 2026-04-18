import { requestJson } from "./client";

export async function login(username, password) {
  return requestJson("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tenDangNhap: username, matKhau: password }),
  });
}

export async function register(payload) {
  return requestJson("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
