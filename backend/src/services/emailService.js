import nodemailer from 'nodemailer';
import dayjs from 'dayjs';
import config from '../config/env.js';
import { formatCurrency } from '../utils/currency.js';
import { salaryProcessedTemplate, payslipDeliveryTemplate, foNotificationTemplate } from '../utils/emailTemplates.js';
import { getActiveTemplateByEvent } from '../repositories/emailTemplateRepository.js';

// Create reusable transporter (reset on each call so config changes take effect)
const getTransporter = () => {
  const smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  };

  if (!smtpConfig.auth.user || !smtpConfig.auth.pass) return null;
  return nodemailer.createTransport(smtpConfig);
};

/**
 * Replace {{variableName}} placeholders in a template string with actual values.
 */
const render = (template, vars) =>
  template.replace(/\{\{(\w+)\}\}/g, (_, key) => (vars[key] != null ? vars[key] : ''));

/**
 * Try to load an active DB template for the given event.
 * Returns { subject, html } using rendered placeholders, or null if not found.
 */
const loadDbTemplate = async (event, vars) => {
  try {
    const { rows } = await getActiveTemplateByEvent(event);
    if (!rows.length) return null;
    const tpl = rows[0];
    return {
      subject: render(tpl.subject, vars),
      html: render(tpl.body_html, vars),
    };
  } catch {
    return null;
  }
};

/**
 * Send salary processed notification email to employee.
 * Auto-triggered when a salary record is created.
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
      console.warn('SMTP not configured. Skipping salary notification.');
      return { success: false, reason: 'SMTP not configured' };
    }

    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    const fromName = process.env.SMTP_FROM_NAME || 'HC Solutions Payroll';
    const payPeriodLabel = dayjs(payPeriod).format('MMMM YYYY');

    const vars = {
      employeeName,
      payPeriod: payPeriodLabel,
      netSalary: formatCurrency(netSalary),
      grossSalary: formatCurrency(grossSalary),
      salaryId,
    };

    const dbTpl = await loadDbTemplate('salary_processed', vars);

    const subject = dbTpl?.subject ?? `Salary Processed - ${payPeriodLabel}`;
    const html = dbTpl?.html ?? salaryProcessedTemplate(vars);

    const info = await transport.sendMail({ from: `"${fromName}" <${fromEmail}>`, to: employeeEmail, subject, html });
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
    if (!transport) throw new Error('SMTP not configured');

    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    const fromName = process.env.SMTP_FROM_NAME || 'HC Solutions Payroll';

    const info = await transport.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: toEmail,
      subject: 'Test Email - HC Solutions Payroll',
      html: '<h1>Test Email</h1><p>Your SMTP configuration is working correctly!</p>',
    });

    console.log('Test email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send test email:', error);
    throw error;
  }
};

/**
 * Send payslip email with PDF attachment.
 * Auto-triggered after MD approval when payslips are dispatched.
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
  customMessage,
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

    let subject = `Your Payslip for ${payPeriod}`;
    let html;

    if (customMessage) {
      html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#000}.signature{margin-top:20px;padding-top:15px;border-top:1px solid #ccc}</style></head>
<body><div style="max-width:600px;margin:0 auto;padding:20px">
  ${customMessage.split('\n').map(line => `<p>${line || '&nbsp;'}</p>`).join('')}
  <div class="signature">
    <p>Best regards,<br/>${senderName || 'Payroll Team'}<br/>${jobTitle || 'Payroll Administrator'}<br/>${companyName || 'HC Solutions'}<br/>${companyEmail || 'payroll@hcsolutions.rw'}<br/>${companyPhone || '+250 788 000 000'}</p>
  </div>
</div></body></html>`;
    } else {
      const vars = {
        employeeName, employeeId, payPeriod, netSalary, payDate,
        companyName, hrContact, responseDays, senderName, jobTitle, companyEmail, companyPhone,
      };
      const dbTpl = await loadDbTemplate('payslip_sent', vars);
      subject = dbTpl?.subject ?? subject;
      html = dbTpl?.html ?? payslipDeliveryTemplate(vars);
    }

    const info = await transport.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: employeeEmail,
      subject,
      html,
      attachments: [{ filename: filename || `payslip-${payPeriod}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }],
    });

    console.log('Payslip email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send payslip email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send welcome email to a newly created employee with their credentials.
 * Auto-triggered when a new employee is created.
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
    const loginUrl = `${config.appUrl}/login`;

    const vars = { employeeName, employeeEmail, temporaryPassword, role, loginUrl };
    const dbTpl = await loadDbTemplate('welcome_email', vars);

    const subject = dbTpl?.subject ?? `🎉 Welcome to HC Solutions, ${employeeName}!`;
    const html = dbTpl?.html ?? `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
        <div style="background:linear-gradient(135deg,#003661 0%,#004d8a 100%);padding:32px 40px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700">Welcome to HC Solutions</h1>
          <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px">Payroll Management System</p>
        </div>
        <div style="padding:32px 40px">
          <p style="font-size:16px;color:#1e293b">Dear <strong>${employeeName}</strong>,</p>
          <p style="color:#475569;line-height:1.6">Your employee account has been created. Use the credentials below to log in.</p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px 24px;margin:24px 0">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:600;width:40%">Email</td><td style="padding:8px 0;font-size:13px;color:#1e293b"><strong>${employeeEmail}</strong></td></tr>
              <tr><td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:600">Temporary Password</td><td style="padding:8px 0;font-size:13px;color:#1e293b"><strong style="background:#fff3cd;padding:2px 8px;border-radius:4px;font-family:monospace">${temporaryPassword}</strong></td></tr>
              <tr><td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:600">Role</td><td style="padding:8px 0;font-size:13px;color:#1e293b">${role}</td></tr>
            </table>
          </div>
          <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:14px 18px;margin-bottom:24px">
            <p style="margin:0;font-size:13px;color:#92400e">⚠️ <strong>Important:</strong> Please log in and change your password immediately.</p>
          </div>
          <div style="text-align:center;margin:28px 0">
            <a href="${loginUrl}" style="background:linear-gradient(135deg,#003661,#004d8a);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block">Log In Now →</a>
          </div>
        </div>
        <div style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0">
          <p style="margin:0;font-size:12px;color:#94a3b8">HC Solutions Ltd · Payroll Management System · Automated message</p>
        </div>
      </div>`;

    await transport.sendMail({ from: `"${fromName}" <${fromEmail}>`, to: employeeEmail, subject, html });
    console.log(`Welcome email sent to ${employeeEmail}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Notify Finance Officer about HR review result.
 * Auto-triggered after HR review submission.
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

    const vars = { foName, period, status, count, reviewedBy, comment: comment || '' };
    const dbTpl = await loadDbTemplate('fo_notification', vars);

    const subject = dbTpl?.subject ?? `📢 Payroll Review: ${status.replace('HR_', '')} for ${period}`;
    const html = dbTpl?.html ?? foNotificationTemplate({ foName, period, status, count, reviewedBy, comment, actionUrl });

    await transport.sendMail({ from: `"${fromName}" <${fromEmail}>`, to: foEmail, subject, html });
    return { success: true };
  } catch (error) {
    console.error('Failed to send FO notification email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generic approval-workflow notification email.
 * Auto-triggered on every payroll workflow state change.
 * event: 'SUBMITTED' | 'HR_APPROVED' | 'HR_REJECTED' | 'MD_APPROVED' | 'MD_REJECTED'
 */
export const sendApprovalNotification = async ({
  toEmail,
  event,
  clientName,
  periodLabel,
  salaryCount,
  actorName,
  comments,
}) => {
  if (!toEmail) return { success: false, reason: 'No recipient email configured' };

  try {
    const transport = getTransporter();
    if (!transport) return { success: false, reason: 'SMTP not configured' };

    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    const fromName = process.env.SMTP_FROM_NAME || 'HC Solutions Payroll';

    const META = {
      SUBMITTED:   { event: 'payroll_submitted', subject: '📋 New Payroll Submitted for HR Review',         color: '#f5911f' },
      HR_APPROVED: { event: 'hr_approved',        subject: '✅ Payroll Forwarded to MD for Final Approval',   color: '#6366f1' },
      HR_REJECTED: { event: 'hr_rejected',        subject: '❌ Payroll Submission Rejected by HR',            color: '#ef4444' },
      MD_APPROVED: { event: 'md_approved',        subject: '✅ Payroll Approved by Managing Director',         color: '#10b981' },
      MD_REJECTED: { event: 'md_rejected',        subject: '❌ Payroll Rejected by Managing Director',         color: '#ef4444' },
    };

    const meta = META[event] || META.SUBMITTED;

    const vars = {
      clientName: clientName || '—',
      periodLabel: periodLabel || '—',
      salaryCount: salaryCount ?? '—',
      actorName: actorName || '—',
      comments: comments || '',
    };

    const dbTpl = await loadDbTemplate(meta.event, vars);

    const subject = dbTpl?.subject ?? meta.subject;
    const html = dbTpl?.html ?? `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
        <div style="background:linear-gradient(135deg,#003661 0%,#004d8a 100%);padding:28px 40px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">HC Solutions Payroll System</h1>
          <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px">Approval Workflow Notification</p>
        </div>
        <div style="padding:28px 36px">
          <div style="border-left:4px solid ${meta.color};padding-left:14px;margin-bottom:22px">
            <p style="margin:0;font-size:15px;color:#1e293b;font-weight:600">${meta.subject.replace(/^[^\s]+ /, '')}</p>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr style="background:#f8fafc"><td style="padding:8px 12px;color:#64748b;font-weight:600;width:40%">Client</td><td style="padding:8px 12px;color:#1e293b">${vars.clientName}</td></tr>
            <tr><td style="padding:8px 12px;color:#64748b;font-weight:600">Pay Period</td><td style="padding:8px 12px;color:#1e293b">${vars.periodLabel}</td></tr>
            <tr style="background:#f8fafc"><td style="padding:8px 12px;color:#64748b;font-weight:600">Employees</td><td style="padding:8px 12px;color:#1e293b">${vars.salaryCount}</td></tr>
            <tr><td style="padding:8px 12px;color:#64748b;font-weight:600">By</td><td style="padding:8px 12px;color:#1e293b">${vars.actorName}</td></tr>
            ${comments ? `<tr style="background:#f8fafc"><td style="padding:8px 12px;color:#64748b;font-weight:600">Comments</td><td style="padding:8px 12px;color:#1e293b">${comments}</td></tr>` : ''}
          </table>
        </div>
        <div style="background:#f8fafc;padding:16px 36px;text-align:center;border-top:1px solid #e2e8f0">
          <p style="margin:0;font-size:11px;color:#94a3b8">HC Solutions Ltd · Payroll Management System · Automated notification</p>
        </div>
      </div>`;

    await transport.sendMail({ from: `"${fromName}" <${fromEmail}>`, to: toEmail, subject, html });
    return { success: true };
  } catch (error) {
    console.error('Failed to send approval notification email:', error);
    return { success: false, error: error.message };
  }
};

export default {
  sendSalaryProcessedEmail,
  sendTestEmail,
  sendPayslipEmail,
  sendWelcomeEmail,
  sendFONotification,
  sendApprovalNotification,
};
