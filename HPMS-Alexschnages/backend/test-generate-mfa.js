// Simple MFA QR Code Generator
// Run this with: node test-generate-mfa.js

const TEST_CONFIG = {
    // Your HR login credentials
    email: 'sysadmin@hcsolutions.com',
    password: 'Admin123!',

    // The employee ID you want to generate MFA for
    employeeId: 1, // Your HR account ID
};

async function generateMFAForHR() {
    console.log('🔐 MFA QR Code Generator\n');

    try {
        // Step 1: Login to get token
        console.log('Step 1: Logging in as HR...');
        const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: TEST_CONFIG.email,
                password: TEST_CONFIG.password,
            }),
        });

        const loginData = await loginResponse.json();

        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
        }

        // Check if MFA is required
        if (loginData.requiresMfa) {
            console.log('⚠️  MFA is already required for this account!');
            console.log('You need the MFA code to login first.');
            console.log('\n💡 TIP: If you lost your MFA, you need to:');
            console.log('1. Temporarily disable MFA in .env (set MFA_REQUIRED=false)');
            console.log('2. Restart backend');
            console.log('3. Run this script again');
            console.log('4. Re-enable MFA after setup');
            return;
        }

        const token = loginData.token;
        console.log('✅ Logged in successfully!\n');

        // Step 2: Generate MFA QR code
        console.log(`Step 2: Generating MFA for employee ID ${TEST_CONFIG.employeeId}...`);
        const mfaResponse = await fetch('http://localhost:4000/api/mfa/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                employeeId: TEST_CONFIG.employeeId,
            }),
        });

        const mfaData = await mfaResponse.json();

        if (!mfaResponse.ok) {
            throw new Error(`MFA generation failed: ${JSON.stringify(mfaData)}`);
        }

        console.log('✅ MFA Generated Successfully!\n');
        console.log('═══════════════════════════════════════════════════════');
        console.log('📱 MFA SETUP INFORMATION');
        console.log('═══════════════════════════════════════════════════════\n');
        console.log('Employee:', mfaData.data.employeeName);
        console.log('Email:', mfaData.data.employeeEmail);
        console.log('\n🔑 SECRET KEY (Enter this in Google Authenticator):');
        console.log('---------------------------------------------------');
        console.log(mfaData.data.secret);
        console.log('---------------------------------------------------');
        console.log('\n📊 QR CODE:');
        console.log('The QR code has been saved to: qr-code.html');
        console.log('Open that file in your browser to see the QR code!');
        console.log('\n═══════════════════════════════════════════════════════');
        console.log('\nℹ️  NEXT STEPS:');
        console.log('1. Open Google Authenticator on your phone');
        console.log('2. Tap "+" to add account');
        console.log('3. Choose "Enter a setup key"');
        console.log('4. Enter this information:');
        console.log('   Account: HC Solutions Payroll');
        console.log('   Key: ' + mfaData.data.secret);
        console.log('   Type: Time based');
        console.log('5. Save - you\'ll see a 6-digit code');
        console.log('6. Use that code when logging in!');
        console.log('═══════════════════════════════════════════════════════\n');

        // Save QR code to HTML file
        const fs = await import('fs');
        const html = `<!DOCTYPE html>
<html>
<head>
  <title>MFA QR Code - ${mfaData.data.employeeName}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      text-align: center;
      padding: 20px;
    }
    h1 { color: #0ea5e9; }
    .info { background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .secret { background: #fef3c7; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 18px; margin: 20px 0; }
    img { border: 2px solid #0ea5e9; padding: 20px; background: white; }
  </style>
</head>
<body>
  <h1>🔐 MFA Setup - HC Solutions Payroll</h1>
  <div class="info">
    <h2>${mfaData.data.employeeName}</h2>
    <p>${mfaData.data.employeeEmail}</p>
  </div>
  
  <h3>📱 Scan this QR Code with Google Authenticator:</h3>
  <img src="${mfaData.data.qrCode}" alt="MFA QR Code" />
  
  <h3>🔑 Or enter this secret key manually:</h3>
  <div class="secret">${mfaData.data.secret}</div>
  
  <div class="info">
    <h4>Instructions:</h4>
    <ol style="text-align: left;">
      <li>Open Google Authenticator app</li>
      <li>Tap "+" to add account</li>
      <li>Scan the QR code above OR enter the secret key</li>
      <li>Save and use the 6-digit code to login</li>
    </ol>
  </div>
</body>
</html>`;

        fs.writeFileSync('qr-code.html', html);
        console.log('✅ QR code saved to qr-code.html - open it in your browser!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('\nTroubleshooting:');
        console.error('- Make sure the backend is running (npm run dev)');
        console.error('- Check your email and password in TEST_CONFIG');
        console.error('- Verify the employee ID exists');
        console.error('- Make sure you have HR role permissions');
    }
}

// Run the script
generateMFAForHR();
