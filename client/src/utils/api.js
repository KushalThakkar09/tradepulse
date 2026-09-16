// Shared API and Currency formatting utility for TradePulse

export function getToken() {
  return localStorage.getItem('trade_pulse_token');
}

export function getUser() {
  const user = localStorage.getItem('trade_pulse_user');
  return user ? JSON.parse(user) : null;
}

export async function authFetch(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });
  return response;
}

export function formatINR(val, options = {}) {
  const num = typeof val === 'number' ? val : parseFloat(val) || 0;
  const { minimumFractionDigits = 2, maximumFractionDigits = 2, showSymbol = true } = options;
  const formatted = num.toLocaleString('en-IN', {
    minimumFractionDigits,
    maximumFractionDigits
  });
  return showSymbol ? `₹ ${formatted}` : formatted;
}
