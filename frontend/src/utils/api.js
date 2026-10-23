const API_BASE = '/api';

async function fetchApi(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  getParticipants: () => fetchApi('/participants'),
  getOverview: () => fetchApi('/participants/overview'),
  getParticipant: (barcode) => fetchApi(`/participants/${barcode}`),
  scan: (barcode, type) => fetchApi(`/participants/${barcode}/scan`, { method: 'POST', body: JSON.stringify({ type }) }),
  manualEntry: (email, type) => fetchApi('/participants/manual', { method: 'POST', body: JSON.stringify({ email, type }) }),
  importData: () => fetchApi('/participants', { method: 'POST' }),
};