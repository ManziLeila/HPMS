import nodemailer from 'nodemailer';
import dayjs from 'dayjs';
import { formatCurrency } from '../utils/currency.js';
import { salaryProcessedTemplate, payslipDeliveryTemplate } from '../utils/emailTemplates.js';

// Create reusable transporter
let transporter = null;

const getTransporter = () => {
    if (!transporter) {
        const smtpConfig = {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        };

        // Only create transporter if SMTP credentials are configured
        if (smtpConfig.auth.user && smtpConfig.auth.pass) {
            transporter = nodemailer.createTransport(smtpConfig);
        }
    }
    return transporter;
};

/**
 * Send salary processed notification email to employee
 */
export const sendSalaryProcessedEmail = async ({
    employeeEmail,
    employeeName,
    payPeriod,
    netSalary,
    grossSalary,
    salaryId,
}) => {
    try {
        const transport = getTransporter();

        if (!transport) {
            console.warn('SMTP not configured. Skipping email notification.');
            return { success: false, reason: 'SMTP not configured' };
        }

        const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
        const fromName = process.env.SMTP_FROM_NAME || 'HC Solutions Payroll';

        const htmlContent = salaryProcessedTemplate({
            employeeName,
            payPeriod: dayjs(payPeriod).format('MMMM YYYY'),
            netSalary: formatCurrency(netSalary),
            grossSalary: formatCurrency(grossSalary),
            salaryId,
        });

        const mailOptions = {
            from: `"${fromName}" <${fromEmail}>`,
            to: employeeEmail,
            subject: `Salary Processed - ${dayjs(payPeriod).format('MMMM YYYY')}`,
            html: htmlContent,
        };

        const info = await transport.sendMail(mailOptions);

        console.log('Salary notification email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Failed to send salary notification email:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send test email to verify SMTP configuration
 */
export const sendTestEmail = async (toEmail) => {
    try {
        const transport = getTransporter();

        if (!transport) {
            throw new Error('SMTP not configured');
        }

        const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
        const fromName = process.env.SMTP_FROM_NAME || 'HC Solutions Payroll';

        const mailOptions = {
            from: `"${fromName}" <${fromEmail}>`,
            to: toEmail,
            subject: 'Test Email - HC Solutions Payroll',
            html: '<h1>Test Email</h1><p>Your SMTP configuration is working correctly!</p>',
        };

        const info = await transport.sendMail(mailOptions);

        console.log('Test email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Failed to send test email:', error);
        throw error;
    }
};

/**
 * Send payslip email with PDF attachment
 */
export const sendPayslipEmail = async ({
    employeeEmail,
    employeeName,
    employeeId,
    payPeriod,
    netSalary,
    payDate,
    pdfBuffer,
    filename,
    companyName,
    hrContact,
    responseDays,
    senderName,
    jobTitle,
    companyEmail,
    companyPhone,
    customMessage, // Optional custom message from user
}) => {
    try {
        const transport = getTransporter();

        if (!transport) {
            console.warn('SMTP not configured. Skipping payslip email.');
            return { success: false, reason: 'SMTP not configured' };
        }

        if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer)) {
            console.error('Invalid PDF buffer provided');
            return { success: false, reason: 'Invalid PDF buffer' };
        }

        const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
        const fromName = process.env.SMTP_FROM_NAME || 'HC Solutions Payroll';

        // Use custom message if provided, otherwise use template
        const htmlContent = customMessage
            ? `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #000; }
    .signature { margin-top: 20px; padding-top: 15px; border-top: 1px solid #ccc; }
  </style>
</head>
<body>
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    ${customMessage.split('\n').map(line => `<p>${line || '&nbsp;'}</p>`).join('')}
    <div class="signature">
      <p>Best regards,<br/>
      ${senderName || 'Payroll Team'}<br/>
      ${jobTitle || 'Payroll Administrator'}<br/>
      ${companyName || 'HC Solutions'}<br/>
      ${companyEmail || 'payroll@hcsolutions.rw'}<br/>
      ${companyPhone || '+250 788 000 000'}</p>
    </div>
  </div>
</body>
</html>`
            : payslipDeliveryTemplate({
                employeeName,
                employeeId,
                payPeriod,
                netSalary,
                payDate,
                companyName,
                hrContact,
                responseDays,
                senderName,
                jobTitle,
                companyEmail,
                companyPhone,
            });

        const mailOptions = {
            from: `"${fromName}" <${fromEmail}>`,
            to: employeeEmail,
            subject: `Your Payslip for ${payPeriod}`,
            html: htmlContent,
            attachments: [
                {
                    filename: filename || `payslip-${payPeriod}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf',
                },
            ],
        };

        const info = await transport.sendMail(mailOptions);

        console.log('Payslip email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Failed to send payslip email:', error);
        return { success: false, error: error.message };
    }
};

export default {
    sendSalaryProcessedEmail,
    sendTestEmail,
    sendPayslipEmail,
};
