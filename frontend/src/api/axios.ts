import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ── Request: attach JWT ───────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem("auth-storage");
  if (raw) {
    try {
      const { state } = JSON.parse(raw);
      if (state?.token) config.headers.Authorization = `Bearer ${state.token}`;
    } catch { /* ignore */ }
  }
  return config;
});

// ── Response: silent token refresh ───────────────────────────────────────────
let isRefreshing = false;
let queue: { resolve: (v: string) => void; reject: (e: unknown) => void }[] = [];

function drainQueue(token: string) {
  queue.forEach((p) => p.resolve(token));
  queue = [];
}

function failQueue(err: unknown) {
  queue.forEach((p) => p.reject(err));
  queue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) return Promise.reject(error);

    const raw = localStorage.getItem("auth-storage");
    if (!raw) return Promise.reject(error);

    let refreshToken: string | undefined;
    try {
      refreshToken = JSON.parse(raw)?.state?.refreshToken;
    } catch { return Promise.reject(error); }
    if (!refreshToken) return Promise.reject(error);

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => queue.push({ resolve, reject }))
        .then((token) => { original.headers.Authorization = `Bearer ${token}`; return api(original); });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refreshToken });
      const { access_token, refresh_token: newRefresh, user } = data.data;

      const stored = JSON.parse(raw);
      stored.state = { ...stored.state, token: access_token, refreshToken: newRefresh, user };
      localStorage.setItem("auth-storage", JSON.stringify(stored));

      api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
      drainQueue(access_token);
      return api(original);
    } catch (err) {
      failQueue(err);
      localStorage.removeItem("auth-storage");
      window.location.href = "/login";
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
