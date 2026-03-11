/** Format as RWF (Rwandan Franc) - always show RWF, not RF */
const numFormatter = new Intl.NumberFormat('en-RW', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatCurrency = (value) => {
  const n = Math.max(Number(value) || 0, 0);
  return `RWF ${numFormatter.format(n)}`;
};


