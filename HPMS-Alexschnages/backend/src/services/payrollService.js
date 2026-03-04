import { calculatePaye } from '../utils/paye.js';

const clamp = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const allowanceMap = (payload) => ({
  variable: clamp(payload.variableAllowance),
  transport: clamp(payload.transportAllowance),
  housing: clamp(payload.housingAllowance),
  performance: clamp(payload.performanceAllowance),
});

/**
 * Calculate payroll according to Rwandan tax regulations
 * 
 * Formula breakdown:
 * - Basic Salary = Initial Salary (baseSalary parameter)
 * - Gross Salary = Basic Salary + Transport + Housing + Performance allowances
 * - Taxable Income = Gross Salary
 * - PAYE = Progressive tax on taxable income (0% on first 60k, 10%, 20%, 30%)
 * - RSSB Employee Pension = 6% of Gross Salary
 * - RSSB Maternity = 0.3% of Basic Salary
 * - RAMA = 7.5% of Basic Salary
 * - NET (before CBHI) = Gross - PAYE - RSSB Pension - Maternity - RAMA
 * - CBHI = 0.5% of NET (before CBHI)
 * - NET (after CBHI) = NET (before CBHI) - CBHI - Advance
 * - Employer: 6% pension, 0.3% maternity, 7.5% RAMA (optional), 2% hazard
 */
export const calculatePayroll = (payload) => {
  const frequency = payload.frequency || 'monthly';

  // Basic Salary = Initial Salary (this is the base, not including allowances)
  const basicSalary = clamp(payload.baseSalary);

  // Get all allowances
  const allowances = allowanceMap(payload);

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
  const includeMedical = payload.includeMedical !== false; // Default to true
  const ramaInsuranceEmployee = includeMedical ? basicSalary * 0.075 : 0;

  // NET (before CBHI) = Gross - PAYE - RSSB Pension - Maternity - RAMA
  const netBeforeCbhi = grossSalary - paye - rssbEePension - rssbEeMaternity - ramaInsuranceEmployee;

  // CBHI = 0.5% of NET (before CBHI)
  const cbhiEmployee = netBeforeCbhi * 0.005;

  // Advance amount (deducted from final salary)
  const advanceAmount = clamp(payload.advanceAmount);

  // NET Salary (after CBHI and advance) = NET (before CBHI) - CBHI - Advance
  const netSalary = netBeforeCbhi - cbhiEmployee - advanceAmount;

  // Total Employee Deductions
  const totalEmployeeDeductions = paye + rssbEePension + rssbEeMaternity + ramaInsuranceEmployee + cbhiEmployee + advanceAmount;

  // Net to be paid to bank
  const netPaidToBank = netSalary;

  // ========================================
  // EMPLOYER CONTRIBUTIONS
  // ========================================

  // RSSB Employer Pension = 6% of Gross Salary
  const rssbErPension = grossSalary * 0.06;

  // RSSB Maternity (Employer) = 0.3% of Basic Salary
  const rssbErMaternity = basicSalary * 0.003;

  // RAMA (Medical Insurance Employer) = 7.5% of Basic Salary (optional)
  const ramaInsuranceEmployer = includeMedical ? basicSalary * 0.075 : 0;

  // Occupational Hazard = 2% of Basic Salary
  const hazardContribution = basicSalary * 0.02;

  // Total Employer Contributions
  const totalEmployerContributions = rssbErPension + rssbErMaternity + ramaInsuranceEmployer + hazardContribution;

  // Total Cost of Employment = Gross Salary + Employer Contributions
  const totalCostOfEmployment = grossSalary + totalEmployerContributions;

  return {
    frequency,
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
    medicalInsuranceEmployee: ramaInsuranceEmployee, // Alias for backward compatibility
    medicalInsuranceEmployer: ramaInsuranceEmployer, // Alias for backward compatibility
    netBeforeCbhi,
    cbhiEmployee,
    advanceAmount,
    totalEmployeeDeductions,
    netSalary,
    netPaidToBank,
    takeHomeSalary: netSalary, // Alias
    netToBePaid: netPaidToBank, // Alias
    hazardContribution,
    totalEmployerContributions,
    totalCostOfEmployment,
    includeMedical,
  };
};

