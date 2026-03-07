// ============================================================================
// UTILITIES
// ============================================================================

export const fmt = n => n ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n) : "—";
export const fmtK = n => n ? "$" + Math.round(n / 1000) + "K" : "—";
export const fmtNum = n => new Intl.NumberFormat("en-US").format(n);

export const pct = (arr, p) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const i = (p / 100) * (s.length - 1);
  return Math.round(s[Math.floor(i)] + (s[Math.ceil(i)] - s[Math.floor(i)]) * (i - Math.floor(i)));
};
