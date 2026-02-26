import nodemailer from 'nodemailer';
import dayjs from 'dayjs';
import { formatCurrency } from '../utils/currency.js';
import { salaryProcessedTemplate, payslipDeliveryTemplate, foNotificationTemplate } from '../utils/emailTemplates.js';

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

/**
 * Send welcome email to a newly created employee with their credentials
 */
export const sendWelcomeEmail = async ({ employeeEmail, employeeName, temporaryPassword, role }) => {
  try {
    const transport = getTransporter();
    if (!transport) {
      console.warn('SMTP not configured. Skipping welcome email.');
      return { success: false, reason: 'SMTP not configured' };
    }

    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    const fromName = process.env.SMTP_FROM_NAME || 'HC Solutions Payroll';
    const loginUrl = process.env.APP_URL || 'http://localhost:5173';

    const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
          <!-- Header -->
          <div style="background:linear-gradient(135deg,#003661 0%,#004d8a 100%);padding:32px 40px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700">Welcome to HC Solutions</h1>
            <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px">Payroll Management System</p>
          </div>
          <!-- Body -->
          <div style="padding:32px 40px">
            <p style="font-size:16px;color:#1e293b">Dear <strong>${employeeName}</strong>,</p>
            <p style="color:#475569;line-height:1.6">Your employee account has been created on the <strong>HC Solutions Payroll Management System</strong>. You can now log in to view your payslips and profile.</p>

            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px 24px;margin:24px 0">
              <h3 style="margin:0 0 16px;color:#003661;font-size:14px;text-transform:uppercase;letter-spacing:0.05em">Your Login Credentials</h3>
              <table style="width:100%;border-collapse:collapse">
                <tr>
                  <td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:600;width:40%">Email</td>
                  <td style="padding:8px 0;font-size:13px;color:#1e293b"><strong>${employeeEmail}</strong></td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:600">Temporary Password</td>
                  <td style="padding:8px 0;font-size:13px;color:#1e293b"><strong style="background:#fff3cd;padding:2px 8px;border-radius:4px;font-family:monospace">${temporaryPassword}</strong></td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:600">Role</td>
                  <td style="padding:8px 0;font-size:13px;color:#1e293b">${role}</td>
                </tr>
              </table>
            </div>

            <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:14px 18px;margin-bottom:24px">
              <p style="margin:0;font-size:13px;color:#92400e">⚠️ <strong>Important:</strong> Please log in and change your password immediately. Do not share your credentials with anyone.</p>
            </div>

            <div style="text-align:center;margin:28px 0">
              <a href="${loginUrl}/login" style="background:linear-gradient(135deg,#003661,#004d8a);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block">
                Log In Now →
              </a>
            </div>
          </div>
          <div style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0">
            <p style="margin:0;font-size:12px;color:#94a3b8">HC Solutions Ltd · Payroll Management System · This is an automated message</p>
          </div>
        </div>`;

    await transport.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: employeeEmail,
      subject: `🎉 Welcome to HC Solutions, ${employeeName}!`,
      html,
    });

    console.log(`Welcome email sent to ${employeeEmail}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Notify Finance Officer about HR review result
 */
export const sendFONotification = async ({
  foEmail,
  foName,
  period,
  status,
  count,
  reviewedBy,
  comment,
  actionUrl,
}) => {
  try {
    const transport = getTransporter();
    if (!transport) return { success: false, reason: 'SMTP not configured' };

    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    const fromName = process.env.SMTP_FROM_NAME || 'HC Solutions Payroll';

    const html = foNotificationTemplate({
      foName,
      period,
      status,
      count,
      reviewedBy,
      comment,
      actionUrl,
    });

    await transport.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: foEmail,
      subject: `📢 Payroll Review: ${status.replace('HR_', '')} for ${period}`,
      html,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send FO notification email:', error);
    return { success: false, error: error.message };
  }
};

export default {
  sendSalaryProcessedEmail,
  sendTestEmail,
  sendPayslipEmail,
  sendWelcomeEmail,
  sendFONotification,
};

