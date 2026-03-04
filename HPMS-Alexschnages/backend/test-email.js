#!/usr/bin/env node

/**
 * Email Configuration Test Script
 * 
 * This script helps you test your email configuration without needing to use Postman or curl.
 * 
 * Usage:
 *   node test-email.js your-email@example.com YOUR_JWT_TOKEN
 */

import fetch from 'node-fetch';

const args = process.argv.slice(2);

if (args.length < 2) {
    console.error('❌ Usage: node test-email.js <email> <jwt-token>');
    console.error('   Example: node test-email.js test@example.com eyJhbGc...');
    process.exit(1);
}

const [email, token] = args;
const API_URL = 'http://localhost:4000/api/test-email';

console.log('🚀 Testing email configuration...\n');
console.log(`📧 Sending test email to: ${email}`);
console.log(`🔗 API URL: ${API_URL}\n`);

async function testEmail() {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ SUCCESS! Test email sent successfully!');
            console.log(`📬 Message ID: ${data.messageId}`);
            console.log(`\n💡 Check your inbox at ${email}`);
            console.log('   (Don\'t forget to check spam folder)\n');
        } else {
            console.error('❌ FAILED to send test email');
            console.error(`Status: ${response.status} ${response.statusText}`);
            console.error('Error:', JSON.stringify(data, null, 2));

            if (data.error?.message?.includes('SMTP not configured')) {
                console.log('\n💡 Next Steps:');
                console.log('   1. Open backend/.env');
                console.log('   2. Set SMTP_PASSWORD to your Gmail App Password');
                console.log('   3. See EMAIL_SETUP_GUIDE.md for detailed instructions\n');
            }
        }
    } catch (error) {
        console.error('❌ ERROR:', error.message);
        console.log('\n💡 Make sure:');
        console.log('   1. Backend server is running (npm run dev)');
        console.log('   2. Server is accessible at http://localhost:4000');
        console.log('   3. Your JWT token is valid\n');
    }
}

testEmail();
