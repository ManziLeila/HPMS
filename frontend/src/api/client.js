const normalizeBase = (base) => base.replace(/\/$/, "");

const resolveApiBase = () => {
  const envBase = import.meta.env.VITE_API_BASE_URL?.trim();
  if (envBase) {
    return normalizeBase(envBase);
  }

  const origin = window.location.origin;
  if (origin.includes("localhost:5173") || origin.includes("localhost:5174")) {
    return "http://localhost:4000/api";
  }

  if (origin.startsWith("http")) {
    return normalizeBase(`${origin}/api`);
  }

  return "http://localhost:4000/api";
};

export const API_BASE_URL = resolveApiBase();

// ===============
// HEADER BUILDER
// ===============
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

// ====================
// PARSE API RESPONSES
// ====================
const parseResponse = async (response) => {
  if (response.status === 204) return null;

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
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
  put: (path, body, options) => request(path, { ...options, method: "PUT", body }),
  patch: (path, body, options) => request(path, { ...options, method: "PATCH", body }),
  delete: (path, options) => request(path, { ...options, method: "DELETE" }),
};

export default apiClient;
