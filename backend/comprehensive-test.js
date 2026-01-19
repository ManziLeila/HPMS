// Comprehensive Payroll Calculation and PDF Test
import { calculatePayroll } from './src/services/payrollService.js';
import { generatePayslipPdf } from './src/services/payslipService.js';
import fs from 'fs';

console.log('=== COMPREHENSIVE PAYROLL TEST ===\n');

// Test data from test-calculation.js
const testPayload = {
    baseSalary: 752292,
    transportAllowance: 252311,
    housingAllowance: 525407,
    performanceAllowance: 0,
    advanceAmount: 0,
    includeMedical: true,
    frequency: 'monthly'
};

console.log('INPUT DATA:');
console.log('- Basic Salary:', testPayload.baseSalary.toLocaleString());
console.log('- Transport Allowance:', testPayload.transportAllowance.toLocaleString());
console.log('- Housing Allowance:', testPayload.housingAllowance.toLocaleString());
console.log('- Performance Allowance:', testPayload.performanceAllowance.toLocaleString());
console.log('- Advance:', testPayload.advanceAmount.toLocaleString());
console.log('');

// Calculate payroll
const result = calculatePayroll(testPayload);

console.log('CALCULATION RESULTS:');
console.log('');
console.log('=== EARNINGS ===');
console.log('Basic Salary:', result.basicSalary.toLocaleString());
console.log('Total Gross Allowances:', result.totalGross.toLocaleString());
console.log('Gross Salary:', result.grossSalary.toLocaleString());
console.log('');

console.log('=== TAX CALCULATION ===');
console.log('PAYE Base (Exemption):', result.payeBase.toLocaleString());
console.log('Taxable Income:', result.taxableIncome.toLocaleString());
console.log('PAYE Tax:', Math.round(result.paye).toLocaleString());
console.log('');

console.log('=== EMPLOYEE DEDUCTIONS ===');
console.log('RSSB Pension (6% of Gross):', Math.round(result.rssbEePension).toLocaleString());
console.log('RSSB Maternity (0.3% of Basic):', Math.round(result.rssbEeMaternity).toLocaleString());
console.log('RAMA Insurance (7.5% of Basic):', Math.round(result.ramaInsuranceEmployee).toLocaleString());
console.log('NET (before CBHI):', Math.round(result.netBeforeCbhi).toLocaleString());
console.log('CBHI (0.5% of NET before CBHI):', Math.round(result.cbhiEmployee).toLocaleString());
console.log('Advance Deduction:', Math.round(result.advanceAmount).toLocaleString());
console.log('Total Employee Deductions:', Math.round(result.totalEmployeeDeductions).toLocaleString());
console.log('');

console.log('=== NET SALARY ===');
console.log('NET SALARY (PAID TO BANK):', Math.round(result.netSalary).toLocaleString(), 'RWF');
console.log('');

console.log('=== EMPLOYER CONTRIBUTIONS ===');
console.log('RSSB Pension (6% of Gross):', Math.round(result.rssbErPension).toLocaleString());
console.log('RSSB Maternity (0.3% of Basic):', Math.round(result.rssbErMaternity).toLocaleString());
console.log('RAMA Insurance (7.5% of Basic):', Math.round(result.ramaInsuranceEmployer).toLocaleString());
console.log('Occupational Hazard (2% of Basic):', Math.round(result.hazardContribution).toLocaleString());
console.log('Total Employer Contributions:', Math.round(result.totalEmployerContributions).toLocaleString());
console.log('Total Cost of Employment:', Math.round(result.totalCostOfEmployment).toLocaleString());
console.log('');

console.log('=== EXPECTED FROM SPREADSHEET ===');
console.log('Expected Gross: 1,530,010');
console.log('Expected PAYE: 279,482');
console.log('Expected NET: 706,652');
console.log('');

console.log('=== COMPARISON ===');
const expectedGross = 1530010;
const expectedPaye = 279482;
const expectedNet = 706652;

console.log('Gross Match:', result.grossSalary === expectedGross ? '✓' : `✗ (Got ${result.grossSalary}, Expected ${expectedGross})`);
console.log('PAYE Match:', Math.round(result.paye) === expectedPaye ? '✓' : `✗ (Got ${Math.round(result.paye)}, Expected ${expectedPaye})`);
console.log('NET Match:', Math.round(result.netSalary) === expectedNet ? '✓' : `✗ (Got ${Math.round(result.netSalary)}, Expected ${expectedNet})`);
console.log('');

// Test PDF Generation
console.log('=== TESTING PDF GENERATION ===');
try {
    const pdfBuffer = await generatePayslipPdf({
        employee: {
            fullName: 'Test Employee',
            email: 'test@example.com',
            bankName: 'Bank of Kigali',
            accountNumber: '1234567890',
            accountHolderName: 'Test Employee'
        },
        salary: {
            payPeriod: '2025-12-01',
            frequency: 'monthly',
            ...testPayload
        },
        payrollSnapshot: result
    });

    // Save PDF to file
    const filename = 'test-payslip.pdf';
    fs.writeFileSync(filename, pdfBuffer);
    console.log(`✓ PDF generated successfully: ${filename}`);
    console.log(`✓ PDF size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
} catch (error) {
    console.error('✗ PDF generation failed:', error.message);
    console.error(error.stack);
}
