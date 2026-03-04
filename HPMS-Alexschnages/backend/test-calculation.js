// Calculation Test - Based on Spreadsheet Row 4
// This should match your Excel calculations exactly

const testData = {
    basicSalary: 752292,
    transport: 252311,
    housing: 525407,
    performance: 0,
    advance: 0
};

console.log('=== PAYROLL CALCULATION TEST ===\n');

// Step 1: Calculate Gross
const totalGross = testData.transport + testData.housing + testData.performance;
const grossSalary = testData.basicSalary + totalGross;
console.log('1. Basic Salary:', testData.basicSalary.toLocaleString());
console.log('2. Total Gross Allowances:', totalGross.toLocaleString());
console.log('3. Gross Salary:', grossSalary.toLocaleString());

// Step 2: PAYE Calculation
const payeBase = 60000;
const taxableIncome = Math.max(grossSalary - payeBase, 0);
console.log('\n4. PAYE Base (Exemption):', payeBase.toLocaleString());
console.log('5. Taxable Income:', taxableIncome.toLocaleString());

// Progressive tax
let paye = 0;
let remaining = taxableIncome;
if (remaining > 200000) {
    paye += (remaining - 200000) * 0.30;
    remaining = 200000;
}
if (remaining > 100000) {
    paye += (remaining - 100000) * 0.20;
    remaining = 100000;
}
if (remaining > 60000) {
    paye += (remaining - 60000) * 0.10;
    remaining = 60000;
}
console.log('6. PAYE Tax:', Math.round(paye).toLocaleString());

// Step 3: Deductions
const rssbPension = grossSalary * 0.06;
const rssbMaternity = testData.basicSalary * 0.003;
const rama = testData.basicSalary * 0.075;

console.log('\n7. RSSB Pension (6% of Gross):', Math.round(rssbPension).toLocaleString());
console.log('8. RSSB Maternity (0.3% of Basic):', Math.round(rssbMaternity).toLocaleString());
console.log('9. RAMA (7.5% of Basic):', Math.round(rama).toLocaleString());

// Step 4: NET before CBHI
const netBeforeCbhi = grossSalary - paye - rssbPension - rssbMaternity - rama;
console.log('\n10. NET (before CBHI):', Math.round(netBeforeCbhi).toLocaleString());

// Step 5: CBHI
const cbhi = netBeforeCbhi * 0.005;
console.log('11. CBHI (0.5% of NET before CBHI):', Math.round(cbhi).toLocaleString());

// Step 6: Final NET
const netSalary = netBeforeCbhi - cbhi - testData.advance;
console.log('\n12. NET SALARY (PAID TO BANK):', Math.round(netSalary).toLocaleString());

// Employer Contributions
console.log('\n=== EMPLOYER CONTRIBUTIONS ===');
const empPension = grossSalary * 0.06;
const empMaternity = testData.basicSalary * 0.003;
const empRama = testData.basicSalary * 0.075;
const hazard = testData.basicSalary * 0.02;

console.log('Pension (6% of Gross):', Math.round(empPension).toLocaleString());
console.log('Maternity (0.3% of Basic):', Math.round(empMaternity).toLocaleString());
console.log('RAMA (7.5% of Basic):', Math.round(empRama).toLocaleString());
console.log('Hazard (2% of Basic):', Math.round(hazard).toLocaleString());

const totalEmpCost = empPension + empMaternity + empRama + hazard;
console.log('Total Employer Cost:', Math.round(totalEmpCost).toLocaleString());

console.log('\n=== EXPECTED FROM SPREADSHEET ===');
console.log('Gross: 1,525,407 (check if this matches)');
console.log('PAYE: 279,482');
console.log('NET: 706,652');
