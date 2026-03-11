/** Round to whole RWF: >= 0.5 rounds up, < 0.5 rounds down (e.g. 1.5→2, 1.4→1) */
export const roundRwf = (value) => Math.round(Number(value) || 0);

/** Format as RWF (Rwandan Franc) - whole numbers only, no decimals */
const numFormatter = new Intl.NumberFormat('en-RW', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const formatCurrency = (value) => {
  const n = roundRwf(Math.max(Number(value) || 0, 0));
  return `RWF ${numFormatter.format(n)}`;
};


