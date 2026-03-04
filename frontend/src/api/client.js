const normalizeBase = (base) => base.replace(/\/$/, "");

const resolveApiBase = () => {
  const envBase = import.meta.env.VITE_API_BASE_URL?.trim();
  if (envBase) {
    return normalizeBase(envBase);
  }

  const origin = window.location.origin;
  // Local dev: Vite uses 5173 by default, may use 5174, 5175, etc. if port is busy
  if (origin.includes("localhost:") || origin.includes("127.0.0.1:")) {
    return "http://localhost:4000/api";
  }

  if (origin.startsWith("http")) {
    return normalizeBase(`${origin}/api`);
  }

  return "http://localhost:4000/api";
};

export const API_BASE_URL = resolveApiBase();


const buildHeaders = (token, extraHeaders = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};


const clearAuthAndRedirect = () => {
  try {
    window.localStorage.removeItem('hpms_admin_token');
  // eslint-disable-next-line no-empty
  } catch {}
  // Best-effort redirect to login
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

const parseResponse = async (response) => {
  if (response.status === 204) return null;

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthAndRedirect();
    }
    const message = payload?.error?.message || "Request failed";
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return payload;
};

// ====================
// MAIN REQUEST HANDLER
// ====================
const request = async (path, { method = "GET", body, token, signal, headers } = {}) => {
  const url = `${API_BASE_URL}${path}`;

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: buildHeaders(token, headers),
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (error) {
    const networkError = new Error("Unable to reach the payroll API. Verify the backend is running and CORS allows this origin.");
    networkError.cause = error;
    throw networkError;
  }

  return parseResponse(response);
};

// ==============
// API CLIENT
// ==============
export const apiClient = {
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) => request(path, { ...options, method: "POST", body }),
  postForm: async (path, formData, options = {}) => {
    const url = `${API_BASE_URL}${path}`;
    const headers = {};
    if (options.token) headers.Authorization = `Bearer ${options.token}`;
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });
    return parseResponse(res);
  },
  putForm: async (path, formData, options = {}) => {
    const url = `${API_BASE_URL}${path}`;
    const headers = {};
    if (options.token) headers.Authorization = `Bearer ${options.token}`;
    const res = await fetch(url, {
      method: "PUT",
      headers,
      body: formData,
    });
    return parseResponse(res);
  },
  put: (path, body, options) => request(path, { ...options, method: "PUT", body }),
  patch: (path, body, options) => request(path, { ...options, method: "PATCH", body }),
  delete: (path, options) => request(path, { ...options, method: "DELETE" }),
};

export default apiClient;
