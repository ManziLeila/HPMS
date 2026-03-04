// PAYE Calculation Test for Base Salary: 1,000,000 RWF
// No other allowances
// Rwanda PAYE Tax Brackets:
// 0 - 60,000: 0%
// 60,001 - 100,000: 10%
// 100,001 - 200,000: 20%
// Above 200,000: 30%

const baseSalary = 1000000;
const allowances = 0;
const grossSalary = baseSalary + allowances;

// Taxable income = Gross Salary
const taxableIncome = grossSalary;

console.log('='.repeat(60));
console.log('PAYROLL CALCULATION FOR BASE SALARY: 1,000,000 RWF');
console.log('='.repeat(60));
console.log(`Base Salary: ${baseSalary.toLocaleString()} RWF`);
console.log(`Allowances: ${allowances.toLocaleString()} RWF`);
console.log(`Gross Salary: ${grossSalary.toLocaleString()} RWF`);
console.log(`Taxable Income: ${taxableIncome.toLocaleString()} RWF`);
console.log('');

// Band 1: 0 - 60,000 @ 0% = 0
const band1 = 60000 * 0;

// Band 2: 60,001 - 100,000 @ 10% = 40,000 * 0.10 = 4,000
const band2 = (100000 - 60000) * 0.10;

// Band 3: 100,001 - 200,000 @ 20% = 100,000 * 0.20 = 20,000
const band3 = (200000 - 100000) * 0.20;

// Band 4: Above 200,000 @ 30% = 800,000 * 0.30 = 240,000
const band4 = (taxableIncome - 200000) * 0.30;

const totalPaye = band1 + band2 + band3 + band4;

console.log('PAYE CALCULATION BREAKDOWN:');
console.log('-'.repeat(60));
console.log(`Band 1 (0 - 60,000 @ 0%):        ${band1.toLocaleString()} RWF`);
console.log(`Band 2 (60,001 - 100,000 @ 10%): ${band2.toLocaleString()} RWF`);
console.log(`Band 3 (100,001 - 200,000 @ 20%): ${band3.toLocaleString()} RWF`);
console.log(`Band 4 (Above 200,000 @ 30%):     ${band4.toLocaleString()} RWF`);
console.log('-'.repeat(60));
console.log(`TOTAL PAYE TAX: ${totalPaye.toLocaleString()} RWF`);
console.log('');
console.log(`Net Salary (Take Home): ${(grossSalary - totalPaye).toLocaleString()} RWF`);
console.log('='.repeat(60));
