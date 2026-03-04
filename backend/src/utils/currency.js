const formatter = new Intl.NumberFormat('en-RW', {
  style: 'currency',
  currency: 'RWF',
  maximumFractionDigits: 0,
});

export const formatCurrency = (value) => formatter.format(Math.max(Number(value) || 0, 0));


