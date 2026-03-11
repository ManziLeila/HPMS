/** Round to whole RWF: >= 0.5 rounds up, < 0.5 rounds down */
export const roundRwf = (value) => Math.round(Number(value) || 0);

/** Format as RWF (Rwandan Franc) - whole numbers only */
const currency = (value) => {
  const num = Number(value);
  const n = roundRwf(Math.max(Number.isFinite(num) ? num : 0, 0));
  const formatted = new Intl.NumberFormat('en-RW', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
  return `RWF ${formatted}`;
};

const clampNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const calculatePaye = (taxableIncome) => {
  const bands = [
    { upTo: 60000, rate: 0 },
    { upTo: 100000, rate: 0.1 },
    { upTo: 200000, rate: 0.2 },
    { upTo: Infinity, rate: 0.3 },
  ];

  let remaining = Math.max(taxableIncome, 0);
  let tax = 0;
  let lowerBound = 0;

  for (const band of bands) {
    if (remaining <= 0) break;
    const taxableAmount = Math.min(remaining, band.upTo - lowerBound);
    tax += taxableAmount * band.rate;
    remaining -= taxableAmount;
    lowerBound = band.upTo;
  }

  return tax;
};

/**
 * Calculate payroll according to Rwandan tax regulations
 * Matches backend implementation
 */
export const calculatePayroll = (payload) => {
  // Basic Salary = Initial Salary
  const basicSalary = clampNumber(payload.baseSalary);

  const allowances = {
    variable: clampNumber(payload.variableAllowance),
    transport: clampNumber(payload.transportAllowance),
    housing: clampNumber(payload.housingAllowance),
    performance: clampNumber(payload.performanceAllowance),
  };

  // Gross Salary = Basic Salary + Transport + Housing + Performance allowances
  const grossSalary = basicSalary + allowances.transport + allowances.housing + allowances.performance;

  // Taxable Income = Gross Salary (the 60,000 exemption is already in the tax brackets at 0%)
  const taxableIncome = Math.max(grossSalary, 0);

  // Calculate PAYE using progressive tax brackets
  // Note: The first 60,000 RWF is taxed at 0% (built into the tax brackets)
  const paye = calculatePaye(taxableIncome);

  // RSSB Employee Pension = 6% of Gross Salary
  const rssbEePension = grossSalary * 0.06;

  // RSSB Maternity (Employee) = 0.3% of Basic Salary
  const rssbEeMaternity = basicSalary * 0.003;

  // RAMA (Medical Insurance Employee) = 7.5% of Basic Salary
  const includeMedical = payload.includeMedical !== false;
  const ramaInsuranceEmployee = includeMedical ? basicSalary * 0.075 : 0;

  // NET (before CBHI) = Gross - PAYE - RSSB Pension - Maternity - RAMA
  const netBeforeCbhi = grossSalary - paye - rssbEePension - rssbEeMaternity - ramaInsuranceEmployee;

  // CBHI = 0.5% of NET (before CBHI)
  const cbhiEmployee = netBeforeCbhi * 0.005;

  // Advance amount (deducted from final salary)
  const advanceAmount = clampNumber(payload.advanceAmount);

  // NET Salary (after CBHI and advance)
  const netSalary = netBeforeCbhi - cbhiEmployee - advanceAmount;

  // Total Employee Deductions
  const totalEmployeeDeductions = paye + rssbEePension + rssbEeMaternity + ramaInsuranceEmployee + cbhiEmployee + advanceAmount;

  // EMPLOYER CONTRIBUTIONS
  const rssbErPension = grossSalary * 0.06;
  const rssbErMaternity = basicSalary * 0.003;
  const ramaInsuranceEmployer = includeMedical ? basicSalary * 0.075 : 0;
  const hazardContribution = basicSalary * 0.02;

  const totalEmployerContributions = rssbErPension + rssbErMaternity + ramaInsuranceEmployer + hazardContribution;
  const totalCostOfEmployment = grossSalary + totalEmployerContributions;

  return {
    basicSalary,
    allowances,
    totalGross: grossSalary, // Alias for backward compatibility
    grossSalary,
    taxableIncome,
    paye,
    rssbEePension,
    rssbErPension,
    rssbEeMaternity,
    rssbErMaternity,
    ramaInsuranceEmployee,
    ramaInsuranceEmployer,
    medicalInsuranceEmployee: ramaInsuranceEmployee, // Alias
    medicalInsuranceEmployer: ramaInsuranceEmployer, // Alias
    netBeforeCbhi,
    cbhiEmployee,
    advanceAmount,
    totalEmployeeDeductions,
    netSalary,
    netPaidToBank: netSalary,
    takeHomeSalary: netSalary,
    netToBePaid: netSalary,
    hazardContribution,
    totalEmployerContributions,
    totalCostOfEmployment,
    includeMedical,
  };
};

export const formatCurrency = (value) => currency(Math.max(clampNumber(value), 0));

/**
 * Build computation formulas for HR/MD approval view.
 * Returns array of { label, formula, amount } for each payroll line.
 * Amounts are rounded to whole RWF for display (entry form values stay as entered).
 * Includes employee deductions and employer contributions (occupational hazard separate).
 */
export const getComputationFormulas = (s) => {
  const snap = s?.snapshot || {};
  const allow = snap.allowances || {};
  const basic = Number(snap.basicSalary) || 0;
  const transport = Number(allow.transport) || 0;
  const housing = Number(allow.housing) || 0;
  const performance = Number(allow.performance) || 0;
  const gross = Number(s.gross_salary ?? snap.grossSalary) || 0;
  const paye = Number(s.paye ?? snap.paye) || 0;
  const rssb = Number(snap.rssbEePension ?? s.rssb_pension) || 0;
  const round = (v) => roundRwf(v);
  const includeMedical = snap.includeMedical !== false;
  const advance = Number(snap.advanceAmount) || 0;
  const net = Number(s.net_salary ?? snap.netPaidToBank ?? snap.netSalary) || 0;

  // When snapshot has zeros but gross exists, recalculate derived values
  const effectiveBasic = basic > 0 ? basic : (gross - transport - housing - performance > 0 ? gross - transport - housing - performance : gross);
  const rssbVal = rssb > 0 ? rssb : round(gross * 0.06);
  const maternity = Number(snap.rssbEeMaternity) || round((basic > 0 ? basic : effectiveBasic) * 0.003);
  const rama = Number(snap.ramaInsuranceEmployee) || (includeMedical ? round((basic > 0 ? basic : effectiveBasic) * 0.075) : 0);
  const computedNetBeforeCbhi = gross - paye - rssbVal - maternity - rama;
  const netBeforeCbhi = (() => {
    const stored = Number(snap.netBeforeCbhi);
    if (stored > 0) return stored;
    return gross > 0 ? computedNetBeforeCbhi : 0;
  })();
  const computedCbhi = netBeforeCbhi * 0.005;
  const cbhi = (() => {
    const stored = Number(snap.cbhiEmployee);
    if (stored > 0) return stored;
    return gross > 0 ? computedCbhi : 0;
  })();

  // Employer contributions: recalculate when snapshot has zeros but gross exists
  const hazardVal = round(Number(snap.hazardContribution) || effectiveBasic * 0.02);
  const rssbErVal = round(Number(snap.rssbErPension) || gross * 0.06);
  const maternityErVal = round(Number(snap.rssbErMaternity) || effectiveBasic * 0.003);
  const ramaErVal = includeMedical ? round(Number(snap.ramaInsuranceEmployer) || effectiveBasic * 0.075) : 0;

  const displayBasic = basic > 0 ? basic : effectiveBasic;
  const items = [
    { section: 'Earnings' },
    {
      label: 'Gross Salary',
      formula: `Basic (${displayBasic.toLocaleString()}) + Transport (${transport.toLocaleString()}) + Housing (${housing.toLocaleString()}) + Performance (${performance.toLocaleString()})`,
      amount: round(gross),
      rawValue: gross,
    },
    { section: 'Employee deductions' },
    {
      label: 'PAYE',
      formula: 'Progressive tax: 0% on first 60,000 RWF, 10% on next 40,000, 20% on next 100,000, 30% above 200,000',
      amount: round(paye),
      rawValue: paye,
    },
    { label: 'RSSB Pension (employee)', formula: `6% of Gross (${gross.toLocaleString()})`, amount: round(rssbVal), rawValue: rssbVal },
    { label: 'RSSB Maternity (employee)', formula: `0.3% of Basic (${displayBasic.toLocaleString()})`, amount: round(maternity), rawValue: maternity },
    ...(includeMedical ? [{ label: 'RAMA (Medical) (employee)', formula: `7.5% of Basic (${displayBasic.toLocaleString()})`, amount: round(rama), rawValue: rama }] : []),
    {
      label: 'NET (before CBHI)',
      formula: includeMedical ? 'Gross − PAYE − RSSB Pension − Maternity − RAMA' : 'Gross − PAYE − RSSB Pension − Maternity',
      amount: round(netBeforeCbhi),
      rawValue: netBeforeCbhi,
    },
    { label: 'CBHI', formula: `0.5% of NET (before CBHI) = ${netBeforeCbhi.toLocaleString()} × 0.005`, amount: round(cbhi), rawValue: cbhi },
    { label: 'Advance', formula: 'Deducted amount', amount: round(advance), rawValue: advance },
    {
      label: 'Net Pay',
      formula: 'NET (before CBHI) − CBHI − Advance',
      amount: round(net),
      rawValue: net,
    },
    { section: 'Employer contributions' },
    { label: 'RSSB Pension (employer)', formula: `6% of Gross (${gross.toLocaleString()})`, amount: rssbErVal },
    { label: 'RSSB Maternity (employer)', formula: `0.3% of Basic (${effectiveBasic.toLocaleString()})`, amount: maternityErVal },
    ...(includeMedical ? [{ label: 'RAMA (Medical) (employer)', formula: `7.5% of Basic (${effectiveBasic.toLocaleString()})`, amount: ramaErVal }] : []),
    { label: 'Occupational Hazard (employer)', formula: `2% of Basic (${effectiveBasic.toLocaleString()})`, amount: hazardVal },
  ];
  return items;
};

/**
 * Build computation formulas from form values (e.g. Edit Salary modal).
 * Uses calculatePayroll to compute all values, then formats for display.
 */
export const getComputationFormulasFromPayload = (payload) => {
  if (!payload) return [];
  const calc = calculatePayroll({
    baseSalary: Number(payload.baseSalary) ?? 0,
    transportAllowance: Number(payload.transportAllowance) ?? 0,
    housingAllowance: Number(payload.housingAllowance) ?? 0,
    performanceAllowance: Number(payload.performanceAllowance) ?? 0,
    advanceAmount: Number(payload.advanceAmount) ?? 0,
    includeMedical: payload.includeMedical !== false,
  });
  return getComputationFormulas({
    gross_salary: calc.grossSalary,
    paye: calc.paye,
    net_salary: calc.netSalary,
    snapshot: {
      basicSalary: calc.basicSalary,
      grossSalary: calc.grossSalary,
      allowances: calc.allowances,
      paye: calc.paye,
      rssbEePension: calc.rssbEePension,
      rssbEeMaternity: calc.rssbEeMaternity,
      ramaInsuranceEmployee: calc.ramaInsuranceEmployee,
      netBeforeCbhi: calc.netBeforeCbhi,
      cbhiEmployee: calc.cbhiEmployee,
      netPaidToBank: calc.netSalary,
      advanceAmount: calc.advanceAmount,
      includeMedical: calc.includeMedical,
      rssbErPension: calc.rssbErPension,
      rssbErMaternity: calc.rssbErMaternity,
      ramaInsuranceEmployer: calc.ramaInsuranceEmployer,
      hazardContribution: calc.hazardContribution,
    },
  });
};

