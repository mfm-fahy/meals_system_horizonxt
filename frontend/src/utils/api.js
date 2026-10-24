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
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  return res.text();
}

async function fetchText(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.text();
}

export const api = {
  getParticipants: () => fetchApi('/participants'),
  getOverview: () => fetchApi('/participants/overview'),
  getParticipant: (barcode) => fetchApi(`/participants/${barcode}`),
  scan: (barcode, type) => fetchApi(`/participants/${barcode}/scan`, { method: 'POST', body: JSON.stringify({ type }) }),
  manualEntry: (email, type) => fetchApi('/participants/manual', { method: 'POST', body: JSON.stringify({ email, type }) }),
  importData: () => fetchApi('/participants', { method: 'POST' }),
  addParticipant: (data) => fetchApi('/participants', { method: 'POST', body: JSON.stringify(data) }),
  deleteParticipant: (id) => fetchApi(`/participants/${id}`, { method: 'DELETE' }),
  getMeals: () => fetchApi('/meals'),
  getActiveMeals: () => fetchApi('/meals/active'),
  getMeal: (id) => fetchApi(`/meals/${id}`),
  createMeal: (data) => fetchApi('/meals', { method: 'POST', body: JSON.stringify(data) }),
  updateMeal: (id, data) => fetchApi(`/meals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMeal: (id) => fetchApi(`/meals/${id}`, { method: 'DELETE' }),
  seedMeals: () => fetchApi('/meals/seed', { method: 'POST' }),
  serveFood: (barcode, mealId, method) => fetchApi(`/participants/${barcode}/serve-food`, { method: 'POST', body: JSON.stringify({ mealId, method }) }),
  serveFoodManual: (email, mealId) => fetchApi('/participants/manual/serve-food', { method: 'POST', body: JSON.stringify({ email, mealId }) }),
  getZPL: (id) => fetchText(`/participants/${id}/zpl`, { headers: { 'Accept': 'application/zpl' } }),
  printBatch: (ids) => fetchText('/participants/print-batch', { method: 'POST', body: JSON.stringify({ participantIds: ids }), headers: { 'Accept': 'application/zpl' } }),
};