import { calculatePayroll } from './src/services/payrollService.js';

console.log('=== PAYROLL CALCULATION TEST ===\n');

// Test case
const testPayload = {
    baseSalary: 500000,
    transportAllowance: 50000,
    housingAllowance: 100000,
    performanceAllowance: 50000,
    advanceAmount: 0,
    frequency: 'monthly',
    includeMedical: true,
};

console.log('Input:');
console.log('- Basic Salary: RF 500,000');
console.log('- Transport: RF 50,000');
console.log('- Housing: RF 100,000');
console.log('- Performance: RF 50,000\n');

const result = calculatePayroll(testPayload);

// Manual calculation for verification
const basicSalary = 500000;
const grossSalary = 500000 + 50000 + 100000 + 50000; // 700,000
const exemptedSalary = 60000;
const taxableIncome = grossSalary - exemptedSalary; // 640,000

// PAYE calculation
const paye = 0 + (40000 * 0.10) + (100000 * 0.20) + (440000 * 0.30); // 156,000

// Deductions
const rssbPension = grossSalary * 0.06; // 42,000
const rssbMaternity = basicSalary * 0.003; // 1,500
const rama = basicSalary * 0.075; // 37,500

// NET before CBHI
const netBeforeCbhi = grossSalary - paye - rssbPension - rssbMaternity - rama; // 463,000

// CBHI
const cbhi = netBeforeCbhi * 0.005; // 2,315

// NET Salary
const netSalary = netBeforeCbhi - cbhi; // 460,685

// Employer contributions
const employerRssb = grossSalary * 0.06; // 42,000
const employerMaternity = basicSalary * 0.003; // 1,500
const employerRama = basicSalary * 0.075; // 37,500
const hazard = basicSalary * 0.02; // 10,000
const totalEmployerContrib = employerRssb + employerMaternity + employerRama + hazard; // 91,000

// Total cost
const totalCost = grossSalary + totalEmployerContrib; // 791,000

console.log('Expected Results:');
console.log(`- Gross Salary: RF ${grossSalary.toLocaleString()}`);
console.log(`- Exempted Salary: RF ${exemptedSalary.toLocaleString()}`);
console.log(`- Taxable Income: RF ${taxableIncome.toLocaleString()}`);
console.log(`- PAYE Tax: RF ${paye.toLocaleString()}`);
console.log(`- RSSB Pension (6%): RF ${rssbPension.toLocaleString()}`);
console.log(`- RSSB Maternity (0.3%): RF ${rssbMaternity.toLocaleString()}`);
console.log(`- RAMA (7.5%): RF ${rama.toLocaleString()}`);
console.log(`- NET before CBHI: RF ${netBeforeCbhi.toLocaleString()}`);
console.log(`- CBHI (0.5%): RF ${cbhi.toLocaleString()}`);
console.log(`- NET Salary: RF ${netSalary.toLocaleString()}`);
console.log(`- Employer Contributions: RF ${totalEmployerContrib.toLocaleString()}`);
console.log(`- Total Cost of Employment: RF ${totalCost.toLocaleString()}\n`);

console.log('Actual Results:');
console.log(`- Gross Salary: RF ${result.grossSalary.toLocaleString()}`);
console.log(`- Exempted Salary: RF ${result.payeBase.toLocaleString()}`);
console.log(`- Taxable Income: RF ${result.taxableIncome.toLocaleString()}`);
console.log(`- PAYE Tax: RF ${result.paye.toLocaleString()}`);
console.log(`- RSSB Pension (6%): RF ${result.rssbEePension.toLocaleString()}`);
console.log(`- RSSB Maternity (0.3%): RF ${result.rssbEeMaternity.toLocaleString()}`);
console.log(`- RAMA (7.5%): RF ${result.ramaInsuranceEmployee.toLocaleString()}`);
console.log(`- NET before CBHI: RF ${result.netBeforeCbhi.toLocaleString()}`);
console.log(`- CBHI (0.5%): RF ${result.cbhiEmployee.toLocaleString()}`);
console.log(`- NET Salary: RF ${result.netSalary.toLocaleString()}`);
console.log(`- Employer Contributions: RF ${result.totalEmployerContributions.toLocaleString()}`);
console.log(`- Total Cost of Employment: RF ${result.totalCostOfEmployment.toLocaleString()}\n`);

// Verify calculations
const checks = [
    { name: 'Gross Salary', expected: grossSalary, actual: result.grossSalary },
    { name: 'Taxable Income', expected: taxableIncome, actual: result.taxableIncome },
    { name: 'PAYE Tax', expected: paye, actual: result.paye },
    { name: 'RSSB Pension', expected: rssbPension, actual: result.rssbEePension },
    { name: 'RSSB Maternity', expected: rssbMaternity, actual: result.rssbEeMaternity },
    { name: 'RAMA', expected: rama, actual: result.ramaInsuranceEmployee },
    { name: 'NET before CBHI', expected: netBeforeCbhi, actual: result.netBeforeCbhi },
    { name: 'CBHI', expected: cbhi, actual: result.cbhiEmployee },
    { name: 'NET Salary', expected: netSalary, actual: result.netSalary },
    { name: 'Employer Contributions', expected: totalEmployerContrib, actual: result.totalEmployerContributions },
    { name: 'Total Cost of Employment', expected: totalCost, actual: result.totalCostOfEmployment },
];

console.log('Verification:');
let allPassed = true;
checks.forEach(check => {
    const passed = Math.abs(check.expected - check.actual) < 1; // Allow for rounding
    const status = passed ? 'PASS' : 'FAIL';
    if (!passed) allPassed = false;
    console.log(`[${status}] ${check.name}: Expected ${check.expected.toFixed(2)}, Got ${check.actual.toFixed(2)}`);
});

console.log('');
if (allPassed) {
    console.log('SUCCESS: All tests passed!');
    process.exit(0);
} else {
    console.log('ERROR: Some tests failed!');
    process.exit(1);
}
