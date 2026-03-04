import { calculatePayroll } from './src/services/payrollService.js';

console.log('='.repeat(70));
console.log('PAYE CALCULATION TEST - Base Salary: 1,000,000 RWF');
console.log('='.repeat(70));
console.log('');

// Test case: 1,000,000 base salary with no allowances
const testPayload = {
    baseSalary: 1000000,
    transportAllowance: 0,
    housingAllowance: 0,
    performanceAllowance: 0,
    advanceAmount: 0,
    frequency: 'monthly',
    includeMedical: true,
};

console.log('Input:');
console.log('- Base Salary: RF 1,000,000');
console.log('- Transport Allowance: RF 0');
console.log('- Housing Allowance: RF 0');
console.log('- Performance Allowance: RF 0');
console.log('- RAMA Insurance: Included (7.5%)');
console.log('');

const result = calculatePayroll(testPayload);

// Expected PAYE calculation for 1,000,000
// Band 1: 0 - 60,000 @ 0% = 0
// Band 2: 60,001 - 100,000 @ 10% = 4,000
// Band 3: 100,001 - 200,000 @ 20% = 20,000
// Band 4: Above 200,000 @ 30% = 240,000
// Total PAYE = 264,000

const expectedPaye = 264000;
const expectedGross = 1000000;
const expectedTaxable = 1000000;

console.log('CALCULATION RESULTS:');
console.log('-'.repeat(70));
console.log(`Gross Salary:           RF ${result.grossSalary.toLocaleString()}`);
console.log(`Taxable Income:         RF ${result.taxableIncome.toLocaleString()}`);
console.log('');
console.log('PAYE Breakdown:');
console.log('  Band 1 (0 - 60,000 @ 0%):        RF 0');
console.log('  Band 2 (60,001 - 100,000 @ 10%): RF 4,000');
console.log('  Band 3 (100,001 - 200,000 @ 20%): RF 20,000');
console.log('  Band 4 (Above 200,000 @ 30%):     RF 240,000');
console.log(`PAYE Tax:               RF ${result.paye.toLocaleString()}`);
console.log('');
console.log(`RSSB Pension (6%):      RF ${result.rssbEePension.toLocaleString()}`);
console.log(`RSSB Maternity (0.3%):  RF ${result.rssbEeMaternity.toLocaleString()}`);
console.log(`RAMA Insurance (7.5%):  RF ${result.ramaInsuranceEmployee.toLocaleString()}`);
console.log(`CBHI (0.5% of net):     RF ${result.cbhiEmployee.toLocaleString()}`);
console.log('-'.repeat(70));
console.log(`NET SALARY:             RF ${result.netSalary.toLocaleString()}`);
console.log(`NET TO BANK:            RF ${result.netPaidToBank.toLocaleString()}`);
console.log('='.repeat(70));
console.log('');

// Verification
console.log('VERIFICATION:');
const payeCorrect = result.paye === expectedPaye;
const grossCorrect = result.grossSalary === expectedGross;
const taxableCorrect = result.taxableIncome === expectedTaxable;

console.log(`[${grossCorrect ? 'PASS' : 'FAIL'}] Gross Salary: Expected ${expectedGross.toLocaleString()}, Got ${result.grossSalary.toLocaleString()}`);
console.log(`[${taxableCorrect ? 'PASS' : 'FAIL'}] Taxable Income: Expected ${expectedTaxable.toLocaleString()}, Got ${result.taxableIncome.toLocaleString()}`);
console.log(`[${payeCorrect ? 'PASS' : 'FAIL'}] PAYE Tax: Expected ${expectedPaye.toLocaleString()}, Got ${result.paye.toLocaleString()}`);
console.log('');

if (payeCorrect && grossCorrect && taxableCorrect) {
    console.log('✓ SUCCESS: PAYE calculation is now CORRECT!');
    console.log('  The double exemption bug has been fixed.');
    process.exit(0);
} else {
    console.log('✗ ERROR: PAYE calculation still has issues!');
    process.exit(1);
}
