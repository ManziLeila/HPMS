import { encryptField, decryptField } from './src/services/encryptionService.js';

console.log('='.repeat(70));
console.log('ENCRYPTION/DECRYPTION TEST');
console.log('='.repeat(70));
console.log('');

// Test data
const testData = {
    baseSalary: 1000000,
    transportAllowance: 50000,
    housingAllowance: 100000,
    performanceAllowance: 25000,
    variableAllowance: 0,
    netPaid: 750000,
};

console.log('Original Values:');
console.log(JSON.stringify(testData, null, 2));
console.log('');

// Test encryption
console.log('Testing Encryption...');
const encrypted = {
    basicSalaryEnc: encryptField('basic_salary_enc', testData.baseSalary),
    transportAllowEnc: encryptField('transport_allow_enc', testData.transportAllowance),
    housingAllowEnc: encryptField('housing_allow_enc', testData.housingAllowance),
    performanceAllowEnc: encryptField('performance_allow_enc', testData.performanceAllowance),
    variableAllowEnc: encryptField('variable_allow_enc', testData.variableAllowance),
    netPaidEnc: encryptField('net_paid_enc', testData.netPaid),
};

console.log('Encrypted (base64):');
Object.entries(encrypted).forEach(([key, value]) => {
    console.log(`  ${key}: ${value?.substring(0, 40)}...`);
});
console.log('');

// Test decryption
console.log('Testing Decryption...');
const decrypted = {
    baseSalary: Number(decryptField('basic_salary_enc', encrypted.basicSalaryEnc)),
    transportAllowance: Number(decryptField('transport_allow_enc', encrypted.transportAllowEnc)),
    housingAllowance: Number(decryptField('housing_allow_enc', encrypted.housingAllowEnc)),
    performanceAllowance: Number(decryptField('performance_allow_enc', encrypted.performanceAllowEnc)),
    variableAllowance: Number(decryptField('variable_allow_enc', encrypted.variableAllowEnc)),
    netPaid: Number(decryptField('net_paid_enc', encrypted.netPaidEnc)),
};

console.log('Decrypted Values:');
console.log(JSON.stringify(decrypted, null, 2));
console.log('');

// Verify
console.log('Verification:');
let allPassed = true;
Object.keys(testData).forEach(key => {
    const original = testData[key];
    const decryptedValue = decrypted[key];
    const passed = original === decryptedValue;

    if (!passed) allPassed = false;

    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${key}: ${original} === ${decryptedValue}`);
});

console.log('');
console.log('='.repeat(70));
if (allPassed) {
    console.log('✓ SUCCESS: All encryption/decryption tests passed!');
    console.log('  The encryption service is working correctly.');
    process.exit(0);
} else {
    console.log('✗ ERROR: Some encryption/decryption tests failed!');
    process.exit(1);
}
