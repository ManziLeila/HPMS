// Test the actual API endpoint
const API_URL = 'http://localhost:4000/api/salaries/preview';

const testPayload = {
    baseSalary: 1000000,
    transportAllowance: 0,
    housingAllowance: 0,
    performanceAllowance: 0,
    advanceAmount: 0,
    frequency: 'monthly',
    includeMedical: true,
};

console.log('Testing API endpoint:', API_URL);
console.log('Payload:', JSON.stringify(testPayload, null, 2));
console.log('');

fetch(API_URL, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(testPayload),
})
    .then(response => {
        console.log('Response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('');
        console.log('='.repeat(70));
        console.log('API RESPONSE:');
        console.log('='.repeat(70));
        console.log(`Gross Salary: RF ${data.grossSalary?.toLocaleString()}`);
        console.log(`Taxable Income: RF ${data.taxableIncome?.toLocaleString()}`);
        console.log(`PAYE Tax: RF ${data.paye?.toLocaleString()}`);
        console.log(`Net Salary: RF ${data.netSalary?.toLocaleString()}`);
        console.log('='.repeat(70));
        console.log('');

        if (data.paye === 264000) {
            console.log('✓ SUCCESS: API is returning correct PAYE (264,000)');
        } else {
            console.log(`✗ ERROR: API is returning incorrect PAYE (${data.paye})`);
            console.log('Expected: 264,000');
        }
    })
    .catch(error => {
        console.error('Error calling API:', error.message);
        console.log('');
        console.log('Note: This test requires authentication. The endpoint may be protected.');
        console.log('Please test manually in the browser with the Employee Form.');
    });
