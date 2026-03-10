import { apiClient, API_BASE_URL } from './client.js';

const BASE = '/management';

export const managementApi = {
  verifyAccess: (password, token) =>
    apiClient.post(`${BASE}/verify-access`, { password }, { token }),
  getHealth: (token) => apiClient.get(`${BASE}/health`, { token }),
  getOverview: (token) => apiClient.get(`${BASE}/overview`, { token }),
  getEmailStatus: (token) => apiClient.get('/email/status', { token }),
  getActivity: (params, token) => {
    const q = new URLSearchParams();
    if (params?.limit != null) q.set('limit', params.limit);
    if (params?.offset != null) q.set('offset', params.offset);
    if (params?.actionType) q.set('actionType', params.actionType);
    if (params?.userId) q.set('userId', params.userId);
    if (params?.fromDate) q.set('fromDate', params.fromDate);
    if (params?.toDate) q.set('toDate', params.toDate);
    const query = q.toString();
    return apiClient.get(`${BASE}/activity${query ? `?${query}` : ''}`, { token });
  },
  /** Export activity as CSV; returns blob URL. Pass same params as getActivity (without limit/offset). */
  exportActivity: async (params, token) => {
    const q = new URLSearchParams();
    if (params?.actionType) q.set('actionType', params.actionType);
    if (params?.userId) q.set('userId', params.userId);
    if (params?.fromDate) q.set('fromDate', params.fromDate);
    if (params?.toDate) q.set('toDate', params.toDate);
    const query = q.toString();
    const res = await fetch(`${API_BASE_URL}${BASE}/activity/export${query ? `?${query}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(res.statusText || 'Export failed');
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },
  getAllUsers: (token) => apiClient.get(`${BASE}/users`, { token }),
  createUser: (payload, token) => apiClient.post(`${BASE}/users`, payload, { token }),
  updateUser: (userId, payload, token) => apiClient.put(`${BASE}/users/${userId}`, payload, { token }),
  deleteUser: (userId, token) => apiClient.delete(`${BASE}/users/${userId}`, { token }),
  getPermissions: (token) => apiClient.get(`${BASE}/permissions`, { token }),
  updateUserRole: (userId, role, token) =>
    apiClient.put(`${BASE}/users/${userId}/role`, { role }, { token }),
  updateRolePermissions: (role, permissions, token) =>
    apiClient.put(`${BASE}/roles/${role}/permissions`, { permissions }, { token }),
};

export default managementApi;
