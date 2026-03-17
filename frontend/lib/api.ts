// const BASE = 'http://localhost:4000';
 const BASE = 'https://payout-backend-olen.onrender.com';

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

function clearSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    window.location.href = '/login';
  }
}

async function request<T = Record<string, unknown>>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error('Cannot connect to server. Is the backend running?');
  }

  // Token expired or invalid — clear session and redirect to login
  if (res.status === 401) {
    clearSession();
    throw new Error('Session expired. Please log in again.');
  }

  let data: T & { error?: string };
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server error (${res.status})`);
  }

  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; role: string; email: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  // Vendors
  getVendors: () => request<Vendor[]>('/vendors'),
  createVendor: (body: { name: string; upi_id?: string; bank_account?: string; ifsc?: string }) =>
    request<Vendor>('/vendors', { method: 'POST', body: JSON.stringify(body) }),

  // Payouts
  getPayouts: (params?: Record<string, string>) => {
    const qs = params && Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
    return request<PayoutListItem[]>(`/payouts${qs}`);
  },
  createPayout: (body: { vendor_id: number; amount: number; mode: string; note?: string }) =>
    request<PayoutDetail>('/payouts', { method: 'POST', body: JSON.stringify(body) }),
  getPayout: (id: string) =>
    request<PayoutDetail>(`/payouts/${id}`),

  // Payout actions
  submitPayout: (id: string) =>
    request<PayoutDetail>(`/payouts/${id}/submit`, { method: 'POST' }),
  approvePayout: (id: string) =>
    request<PayoutDetail>(`/payouts/${id}/approve`, { method: 'POST' }),
  rejectPayout: (id: string, decision_reason: string) =>
    request<PayoutDetail>(`/payouts/${id}/reject`, { method: 'POST', body: JSON.stringify({ decision_reason }) }),
};

// ---- Shared types ----
export interface Vendor {
  id: number; name: string; upi_id: string; bank_account: string; ifsc: string; is_active: boolean;
}

export interface PayoutListItem {
  id: number; amount: string; mode: string; status: string;
  vendor: { id: number; name: string }; createdAt: string;
}

export interface PayoutAudit {
  id: number;
  action: 'CREATED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  user: { email: string; role: string };
}

export interface PayoutDetail {
  id: number; amount: string; mode: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
  note: string; decision_reason: string; createdAt: string;
  vendor: { name: string; upi_id: string; bank_account: string; ifsc: string };
  audits: PayoutAudit[];
}
