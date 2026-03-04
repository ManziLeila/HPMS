import nodemailer from 'nodemailer';

console.log('🧪 Testing SMTP Connection...\n');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'manzileila03@gmail.com',
        pass: 'yclmfqyqdjqxyogr'
    }
});

async function testEmail() {
    try {
        console.log('📧 Sending test email...');

        const info = await transporter.sendMail({
            from: '"HC Solutions Payroll" <manzileila03@gmail.com>',
            to: 'manzileila03@gmail.com',
            subject: 'SMTP Test - HC Solutions Payroll',
            text: 'This is a test email to verify SMTP configuration.',
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #0ea5e9;">✅ SMTP Test Successful!</h1>
          <p>Your email configuration is working correctly.</p>
          <p><strong>Configuration:</strong></p>
          <ul>
            <li>Host: smtp.gmail.com</li>
            <li>Port: 587</li>
            <li>User: manzileila03@gmail.com</li>
          </ul>
          <p>You can now send payslip emails!</p>
        </div>
      `
        });

        console.log('\n✅ SUCCESS! Email sent successfully!');
        console.log('📬 Message ID:', info.messageId);
        console.log('📧 Check your inbox: manzileila03@gmail.com');
        console.log('\nIf you don\'t see the email, check your spam folder.');

    } catch (error) {
        console.error('\n❌ FAILED! Email could not be sent');
        console.error('Error:', error.message);

        if (error.message.includes('Invalid login')) {
            console.log('\n💡 Possible solutions:');
            console.log('   1. Regenerate Gmail App Password');
            console.log('   2. Make sure 2-Step Verification is enabled');
            console.log('   3. Update .env with new app password');
        } else if (error.message.includes('timeout')) {
            console.log('\n💡 Possible solutions:');
            console.log('   1. Check your internet connection');
            console.log('   2. Check firewall settings');
            console.log('   3. Try port 465 with secure: true');
        }
    }
}

testEmail();
