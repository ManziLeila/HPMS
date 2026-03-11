/** Format as RWF (Rwandan Franc) - always show RWF, not RF */
const currency = (value) => {
  const num = Number(value);
  const n = Math.max(Number.isFinite(num) ? num : 0, 0);
  const formatted = new Intl.NumberFormat('en-RW', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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
  const maternity = Number(snap.rssbEeMaternity) || 0;
  const rama = Number(snap.ramaInsuranceEmployee) || 0;
  const includeMedical = snap.includeMedical !== false;
  const netBeforeCbhi = Number(snap.netBeforeCbhi) || 0;
  const cbhi = Number(snap.cbhiEmployee) || 0;
  const advance = Number(snap.advanceAmount) || 0;
  const net = Number(s.net_salary ?? snap.netPaidToBank ?? snap.netSalary) || 0;
  const round = (v) => Math.round(Number(v) || 0);
  const hazard = Number(snap.hazardContribution) ?? round(basic * 0.02);
  const rssbEr = Number(snap.rssbErPension) ?? round(gross * 0.06);
  const maternityEr = Number(snap.rssbErMaternity) ?? round(basic * 0.003);
  const ramaEr = includeMedical ? (Number(snap.ramaInsuranceEmployer) ?? round(basic * 0.075)) : 0;

  const items = [
    { section: 'Earnings' },
    {
      label: 'Gross Salary',
      formula: `Basic (${basic.toLocaleString()}) + Transport (${transport.toLocaleString()}) + Housing (${housing.toLocaleString()}) + Performance (${performance.toLocaleString()})`,
      amount: round(gross),
    },
    { section: 'Employee deductions' },
    {
      label: 'PAYE',
      formula: 'Progressive tax: 0% on first 60,000 RWF, 10% on next 40,000, 20% on next 100,000, 30% above 200,000',
      amount: round(paye),
    },
    { label: 'RSSB Pension (employee)', formula: '6% of Gross Salary', amount: round(rssb) },
    { label: 'RSSB Maternity (employee)', formula: '0.3% of Basic Salary', amount: round(maternity) },
    ...(includeMedical ? [{ label: 'RAMA (Medical) (employee)', formula: '7.5% of Basic Salary', amount: round(rama) }] : []),
    {
      label: 'NET (before CBHI)',
      formula: includeMedical ? 'Gross − PAYE − RSSB Pension − Maternity − RAMA' : 'Gross − PAYE − RSSB Pension − Maternity',
      amount: round(netBeforeCbhi),
    },
    { label: 'CBHI', formula: '0.5% of NET (before CBHI)', amount: round(cbhi) },
    { label: 'Advance', formula: 'Deducted amount', amount: round(advance) },
    {
      label: 'Net Pay',
      formula: 'NET (before CBHI) − CBHI − Advance',
      amount: round(net),
    },
    { section: 'Employer contributions' },
    { label: 'RSSB Pension (employer)', formula: '6% of Gross Salary', amount: rssbEr },
    { label: 'RSSB Maternity (employer)', formula: '0.3% of Basic Salary', amount: maternityEr },
    ...(includeMedical ? [{ label: 'RAMA (Medical) (employer)', formula: '7.5% of Basic Salary', amount: ramaEr }] : []),
    { label: 'Occupational Hazard (employer)', formula: '2% of Basic Salary', amount: hazard },
  ];
  return items;
};

