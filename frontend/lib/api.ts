const BASE = 'http://localhost:4000';

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  login: (email: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getVendors: () => request('/vendors'),
  createVendor: (body: object) =>
    request('/vendors', { method: 'POST', body: JSON.stringify(body) }),
  getPayouts: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/payouts${qs}`);
  },
  createPayout: (body: object) =>
    request('/payouts', { method: 'POST', body: JSON.stringify(body) }),
  getPayout: (id: string) => request(`/payouts/${id}`),
  submitPayout: (id: string) =>
    request(`/payouts/${id}/submit`, { method: 'POST' }),
  approvePayout: (id: string) =>
    request(`/payouts/${id}/approve`, { method: 'POST' }),
  rejectPayout: (id: string, decision_reason: string) =>
    request(`/payouts/${id}/reject`, { method: 'POST', body: JSON.stringify({ decision_reason }) }),
};
