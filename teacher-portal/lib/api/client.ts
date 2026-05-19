import { useAuthStore } from '@/lib/store/authStore';
import { refreshTeacherToken } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

function notifyPending(newToken: string) {
  pendingRequests.forEach((cb) => cb(newToken));
  pendingRequests = [];
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const { access_token } = useAuthStore.getState();

  const headers = new Headers(options.headers);
  if (access_token) {
    headers.set('Authorization', `Bearer ${access_token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (res.status !== 401) return res;

  // Token expired — try refresh
  const { refresh_token } = useAuthStore.getState();
  if (!refresh_token) {
    useAuthStore.getState().logout();
    if (typeof window !== 'undefined') window.location.href = '/login';
    return res;
  }

  if (isRefreshing) {
    return new Promise((resolve) => {
      pendingRequests.push(async (newToken) => {
        headers.set('Authorization', `Bearer ${newToken}`);
        resolve(fetch(`${API_BASE_URL}${path}`, { ...options, headers }));
      });
    });
  }

  isRefreshing = true;
  try {
    const tokens = await refreshTeacherToken(refresh_token);
    useAuthStore
      .getState()
      .setTokens(tokens.access_token, tokens.refresh_token);
    notifyPending(tokens.access_token);

    headers.set('Authorization', `Bearer ${tokens.access_token}`);
    return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    useAuthStore.getState().logout();
    if (typeof window !== 'undefined') window.location.href = '/login';
    return res;
  } finally {
    isRefreshing = false;
  }
}
