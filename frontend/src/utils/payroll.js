const currency = (value) =>
  new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

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
 * Format date string (YYYY-MM-DD) to MM/YYYY for display
 */
export const formatPeriod = (dateString) => {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    // For ISO strings like '2026-01-31T22:00:00.000Z', this will show '02/2026' or '01/2026' depending on timezone.
    // However, pay_period is usually a fixed date.
    return (d.getUTCMonth() + 1).toString().padStart(2, '0') + '/' + d.getUTCFullYear();
  } catch (e) {
    return dateString;
  }
};

