export const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export const compactCurrency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatCurrency(value) {
  return currency.format(Number.isFinite(value) ? value : 0);
}

export function formatCompactCurrency(value) {
  return compactCurrency.format(Number.isFinite(value) ? value : 0);
}

export function formatTime(iso) {
  const value = iso ? new Date(iso) : new Date();
  return value.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDateTime(iso) {
  const value = iso ? new Date(iso) : new Date();
  return value.toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-');
}
