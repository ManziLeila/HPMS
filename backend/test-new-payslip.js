// Quick test script to verify the new payslip design works
// Run this with: node test-new-payslip.js

import { generatePayslipPdf } from './src/services/payslipService.js';
import fs from 'fs';

const testData = {
    employee: {
        fullName: 'John Doe',
        email: 'john.doe@hcsolutions.com',
        bankName: 'Bank of Kigali',
        accountNumber: '1234567890',
        accountHolderName: 'John Doe',
        role: 'Software Engineer',
        department: 'IT Department',
        dateOfJoining: '2018-06-23',
    },
    salary: {
        payPeriod: '2026-01-01',
        frequency: 'monthly',
        workedDays: 26,
        baseSalary: 500000,
        transportAllowance: 50000,
        housingAllowance: 100000,
        performanceAllowance: 25000,
    },
    payrollSnapshot: {
        basicSalary: 500000,
        allowances: {
            transport: 50000,
            housing: 100000,
            performance: 25000,
        },
        grossSalary: 675000,
        paye: 45000,
        rssbEePension: 30000,
        rssbEeMaternity: 1500,
        ramaInsuranceEmployee: 37500,
        cbhiEmployee: 2500,
        totalEmployeeDeductions: 116500,
        netSalary: 558500,
        netPaidToBank: 558500,
        rssbErPension: 30000,
        rssbErMaternity: 1500,
        ramaInsuranceEmployer: 37500,
        hazardContribution: 10000,
        totalEmployerContributions: 79000,
        totalCostOfEmployment: 754000,
        includeMedical: true,
        advanceAmount: 0,
    },
};

console.log('🧪 Testing new payslip design...\n');

try {
    const pdfBuffer = await generatePayslipPdf(testData);

    const filename = 'test-new-payslip-design.pdf';
    fs.writeFileSync(filename, pdfBuffer);

    console.log('✅ SUCCESS! Payslip generated successfully');
    console.log(`📄 File saved: ${filename}`);
    console.log(`📊 File size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
    console.log('\n👀 Open the PDF to verify:');
    console.log('   - Professional layout with bordered tables');
    console.log('   - Employee details (name, department, role, joining date)');
    console.log('   - Earnings and deductions tables');
    console.log('   - Net pay in words');
    console.log('   - Signature sections');

} catch (error) {
    console.error('❌ ERROR generating payslip:');
    console.error(error);
    process.exit(1);
}
