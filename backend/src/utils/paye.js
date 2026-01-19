const taxBands = [
  { upTo: 60000, rate: 0 },
  { upTo: 100000, rate: 0.1 },
  { upTo: 200000, rate: 0.2 },
  { upTo: Infinity, rate: 0.3 },
];

export const calculatePaye = (taxableIncome) => {
  let remaining = Math.max(taxableIncome, 0);
  let tax = 0;
  let lowerBound = 0;

  for (const band of taxBands) {
    if (remaining <= 0) break;
    const taxableAmount = Math.min(remaining, band.upTo - lowerBound);
    tax += taxableAmount * band.rate;
    remaining -= taxableAmount;
    lowerBound = band.upTo;
  }

  return Math.max(tax, 0);
};

