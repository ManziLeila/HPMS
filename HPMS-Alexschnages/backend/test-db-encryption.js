import db from './src/repositories/db.js';
import { encryptField, decryptField } from './src/services/encryptionService.js';

console.log('='.repeat(70));
console.log('DATABASE ENCRYPTION TEST');
console.log('='.repeat(70));
console.log('');

async function testDatabaseEncryption() {
    try {
        // Test data
        const testSalary = {
            baseSalary: 500000,
            transportAllowance: 30000,
            housingAllowance: 50000,
        };

        console.log('1. Original Values:');
        console.log(JSON.stringify(testSalary, null, 2));
        console.log('');

        // Encrypt
        console.log('2. Encrypting values...');
        const encrypted = {
            basicSalaryEnc: encryptField('basic_salary_enc', testSalary.baseSalary),
            transportAllowEnc: encryptField('transport_allow_enc', testSalary.transportAllowance),
            housingAllowEnc: encryptField('housing_allow_enc', testSalary.housingAllowance),
        };
        console.log('   ✓ Encryption complete');
        console.log('');

        // Query a recent salary record to see what's actually in the database
        console.log('3. Querying recent salary record from database...');
        const { rows } = await db.query(`
      SELECT 
        salary_id,
        employee_id,
        pay_period,
        basic_salary_enc,
        transport_allow_enc,
        housing_allow_enc,
        performance_allow_enc,
        variable_allow_enc,
        gross_salary,
        paye
      FROM hpms_core.salaries
      ORDER BY created_at DESC
      LIMIT 1
    `);

        if (rows.length === 0) {
            console.log('   ⚠ No salary records found in database');
            console.log('   Please create a salary record first using the Employee Form');
            process.exit(0);
        }

        const record = rows[0];
        console.log('   ✓ Found salary record:', record.salary_id);
        console.log('');

        console.log('4. Database Record Details:');
        console.log(`   Salary ID: ${record.salary_id}`);
        console.log(`   Employee ID: ${record.employee_id}`);
        console.log(`   Pay Period: ${record.pay_period}`);
        console.log(`   Gross Salary (plain): ${record.gross_salary}`);
        console.log(`   PAYE (plain): ${record.paye}`);
        console.log('');

        console.log('5. Encrypted Fields Status:');
        console.log(`   basic_salary_enc: ${record.basic_salary_enc ? 'EXISTS (' + record.basic_salary_enc.substring(0, 30) + '...)' : 'NULL/MISSING'}`);
        console.log(`   transport_allow_enc: ${record.transport_allow_enc ? 'EXISTS (' + record.transport_allow_enc.substring(0, 30) + '...)' : 'NULL/MISSING'}`);
        console.log(`   housing_allow_enc: ${record.housing_allow_enc ? 'EXISTS (' + record.housing_allow_enc.substring(0, 30) + '...)' : 'NULL/MISSING'}`);
        console.log(`   performance_allow_enc: ${record.performance_allow_enc ? 'EXISTS (' + record.performance_allow_enc.substring(0, 30) + '...)' : 'NULL/MISSING'}`);
        console.log('');

        // Try to decrypt
        console.log('6. Attempting Decryption...');
        const decrypted = {};
        let decryptionSuccess = true;

        if (record.basic_salary_enc) {
            try {
                decrypted.baseSalary = Number(decryptField('basic_salary_enc', record.basic_salary_enc));
                console.log(`   ✓ basic_salary_enc: ${decrypted.baseSalary}`);
            } catch (err) {
                console.log(`   ✗ basic_salary_enc: FAILED - ${err.message}`);
                decryptionSuccess = false;
            }
        } else {
            console.log(`   ⚠ basic_salary_enc: Field is NULL in database`);
            decryptionSuccess = false;
        }

        if (record.transport_allow_enc) {
            try {
                decrypted.transportAllowance = Number(decryptField('transport_allow_enc', record.transport_allow_enc));
                console.log(`   ✓ transport_allow_enc: ${decrypted.transportAllowance}`);
            } catch (err) {
                console.log(`   ✗ transport_allow_enc: FAILED - ${err.message}`);
                decryptionSuccess = false;
            }
        } else {
            console.log(`   ⚠ transport_allow_enc: Field is NULL in database`);
        }

        if (record.housing_allow_enc) {
            try {
                decrypted.housingAllowance = Number(decryptField('housing_allow_enc', record.housing_allow_enc));
                console.log(`   ✓ housing_allow_enc: ${decrypted.housingAllowance}`);
            } catch (err) {
                console.log(`   ✗ housing_allow_enc: FAILED - ${err.message}`);
                decryptionSuccess = false;
            }
        } else {
            console.log(`   ⚠ housing_allow_enc: Field is NULL in database`);
        }

        console.log('');
        console.log('='.repeat(70));

        if (decryptionSuccess && Object.keys(decrypted).length > 0) {
            console.log('✓ SUCCESS: Encrypted fields are stored and can be decrypted!');
            console.log('  Decrypted values:', decrypted);
        } else {
            console.log('✗ ISSUE FOUND: Encrypted fields are NULL or cannot be decrypted!');
            console.log('  This explains why payslips show RF 0 for all values.');
            console.log('');
            console.log('  Possible causes:');
            console.log('  1. Encrypted fields are not being saved to database during salary creation');
            console.log('  2. Database schema is missing the encrypted columns');
            console.log('  3. Encryption key changed between creation and retrieval');
        }

        await db.end();
        process.exit(decryptionSuccess ? 0 : 1);

    } catch (error) {
        console.error('Error:', error);
        await db.end();
        process.exit(1);
    }
}

testDatabaseEncryption();
