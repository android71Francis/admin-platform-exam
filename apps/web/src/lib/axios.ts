import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

let activeOrgId: string | null = null;

export const setActiveOrgId = (orgId: string | null) => {
  activeOrgId = orgId;
};

api.interceptors.request.use((config) => {
  if (activeOrgId) {
    config.headers['x-org-id'] = activeOrgId;
  }
  return config;
});

let isRefreshing = false;
let onLogout: (() => void) | null = null;
export const registerLogoutHandler = (fn: () => void) => { onLogout = fn; };

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry && !original.url?.includes('/auth/')) {
      original._retry = true;
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          await api.post('/auth/refresh');
        } catch {
          if (onLogout) onLogout();
          throw err;
        } finally {
          isRefreshing = false;
        }
      }
      return api(original);
    }
    return Promise.reject(err);
  },
);
