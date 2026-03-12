-- Migration 016: Email Templates
-- Stores editable, per-event email templates that are auto-triggered on form submissions.

CREATE TABLE IF NOT EXISTS email_templates (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  trigger_event VARCHAR(50)  NOT NULL UNIQUE,
  subject       VARCHAR(255) NOT NULL,
  body_html     TEXT         NOT NULL,
  description   TEXT,
  variables     JSONB        NOT NULL DEFAULT '[]',
  is_active     BOOLEAN      NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Seed default templates using {{variableName}} placeholders

INSERT INTO email_templates (name, trigger_event, subject, body_html, description, variables) VALUES (
  'Welcome Email',
  'welcome_email',
  'Welcome to HC Solutions, {{employeeName}}!',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
  <div style="background:linear-gradient(135deg,#003661 0%,#004d8a 100%);padding:32px 40px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700">Welcome to HC Solutions</h1>
    <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px">Payroll Management System</p>
  </div>
  <div style="padding:32px 40px">
    <p style="font-size:16px;color:#1e293b">Dear <strong>{{employeeName}}</strong>,</p>
    <p style="color:#475569;line-height:1.6">Your employee account has been created on the <strong>HC Solutions Payroll Management System</strong>. You can now log in to view your payslips and profile.</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px 24px;margin:24px 0">
      <h3 style="margin:0 0 16px;color:#003661;font-size:14px;text-transform:uppercase;letter-spacing:0.05em">Your Login Credentials</h3>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:600;width:40%">Email</td><td style="padding:8px 0;font-size:13px;color:#1e293b"><strong>{{employeeEmail}}</strong></td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:600">Temporary Password</td><td style="padding:8px 0;font-size:13px;color:#1e293b"><strong style="background:#fff3cd;padding:2px 8px;border-radius:4px;font-family:monospace">{{temporaryPassword}}</strong></td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:600">Role</td><td style="padding:8px 0;font-size:13px;color:#1e293b">{{role}}</td></tr>
      </table>
    </div>
    <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:14px 18px;margin-bottom:24px">
      <p style="margin:0;font-size:13px;color:#92400e">⚠️ <strong>Important:</strong> Please log in and change your password immediately.</p>
    </div>
    <div style="text-align:center;margin:28px 0">
      <a href="{{loginUrl}}" style="background:linear-gradient(135deg,#003661,#004d8a);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block">Log In Now →</a>
    </div>
  </div>
  <div style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0">
    <p style="margin:0;font-size:12px;color:#94a3b8">HC Solutions Ltd · Payroll Management System · Automated message</p>
  </div>
</div>',
  'Sent automatically when a new employee account is created.',
  '["employeeName","employeeEmail","temporaryPassword","role","loginUrl"]'::jsonb
) ON CONFLICT (trigger_event) DO NOTHING;

INSERT INTO email_templates (name, trigger_event, subject, body_html, description, variables) VALUES (
  'Salary Processed Notification',
  'salary_processed',
  'Salary Processed – {{payPeriod}}',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
  <div style="background:linear-gradient(135deg,#003661 0%,#004d8a 100%);padding:28px 40px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700">Salary Processed</h1>
    <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px">HC Solutions Payroll</p>
  </div>
  <div style="padding:28px 36px">
    <p style="font-size:15px;color:#1e293b">Dear <strong>{{employeeName}}</strong>,</p>
    <p style="color:#475569">Your salary for <strong>{{payPeriod}}</strong> has been processed successfully.</p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px 24px;margin:20px 0">
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:8px 0;color:#64748b;font-weight:600;width:50%">Gross Salary</td><td style="padding:8px 0;color:#1e293b;font-weight:700">{{grossSalary}}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;font-weight:600">Net Salary</td><td style="padding:8px 0;color:#16a34a;font-weight:700;font-size:16px">{{netSalary}}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;font-weight:600">Reference</td><td style="padding:8px 0;color:#1e293b">#{{salaryId}}</td></tr>
      </table>
    </div>
    <p style="color:#475569;font-size:13px">Your payslip will be sent separately. Contact HR if you have any questions.</p>
  </div>
  <div style="background:#f8fafc;padding:16px 36px;text-align:center;border-top:1px solid #e2e8f0">
    <p style="margin:0;font-size:11px;color:#94a3b8">HC Solutions Ltd · Automated notification</p>
  </div>
</div>',
  'Sent when a salary record is created for an employee.',
  '["employeeName","payPeriod","netSalary","grossSalary","salaryId"]'::jsonb
) ON CONFLICT (trigger_event) DO NOTHING;

INSERT INTO email_templates (name, trigger_event, subject, body_html, description, variables) VALUES (
  'Payslip Delivery',
  'payslip_sent',
  'Your Payslip for {{payPeriod}}',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
  <div style="background:linear-gradient(135deg,#003661 0%,#004d8a 100%);padding:28px 40px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700">Your Payslip is Ready</h1>
    <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px">{{companyName}}</p>
  </div>
  <div style="padding:28px 36px">
    <p style="font-size:15px;color:#1e293b">Dear <strong>{{employeeName}}</strong>,</p>
    <p style="color:#475569">Please find attached your payslip for <strong>{{payPeriod}}</strong>. Your net pay of <strong>{{netSalary}}</strong> has been processed.</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin:20px 0;font-size:13px;color:#475569">
      <p style="margin:0">Employee ID: <strong>{{employeeId}}</strong> &nbsp;|&nbsp; Pay Date: <strong>{{payDate}}</strong></p>
    </div>
    <p style="color:#475569;font-size:13px">Please review your payslip and contact <strong>{{hrContact}}</strong> within <strong>{{responseDays}} business days</strong> if you have any questions.</p>
    <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:13px;color:#475569">
      <p style="margin:0">Best regards,<br/><strong>{{senderName}}</strong><br/>{{jobTitle}}<br/>{{companyName}}<br/>{{companyEmail}} · {{companyPhone}}</p>
    </div>
  </div>
  <div style="background:#f8fafc;padding:16px 36px;text-align:center;border-top:1px solid #e2e8f0">
    <p style="margin:0;font-size:11px;color:#94a3b8">{{companyName}} · Automated payslip delivery</p>
  </div>
</div>',
  'Sent with the PDF payslip attachment after MD approval.',
  '["employeeName","employeeId","payPeriod","netSalary","payDate","companyName","hrContact","responseDays","senderName","jobTitle","companyEmail","companyPhone"]'::jsonb
) ON CONFLICT (trigger_event) DO NOTHING;

INSERT INTO email_templates (name, trigger_event, subject, body_html, description, variables) VALUES (
  'Payroll Submitted for HR Review',
  'payroll_submitted',
  'New Payroll Submitted for HR Review – {{periodLabel}}',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
  <div style="background:linear-gradient(135deg,#f5911f 0%,#e07c10 100%);padding:28px 40px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">Payroll Submitted for Review</h1>
    <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px">Action required</p>
  </div>
  <div style="padding:28px 36px">
    <div style="border-left:4px solid #f5911f;padding-left:14px;margin-bottom:22px">
      <p style="margin:0;font-size:15px;color:#1e293b;font-weight:600">A new payroll batch has been submitted for your review.</p>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr style="background:#f8fafc"><td style="padding:8px 12px;color:#64748b;font-weight:600;width:40%">Client</td><td style="padding:8px 12px;color:#1e293b">{{clientName}}</td></tr>
      <tr><td style="padding:8px 12px;color:#64748b;font-weight:600">Pay Period</td><td style="padding:8px 12px;color:#1e293b">{{periodLabel}}</td></tr>
      <tr style="background:#f8fafc"><td style="padding:8px 12px;color:#64748b;font-weight:600">Employees</td><td style="padding:8px 12px;color:#1e293b">{{salaryCount}}</td></tr>
      <tr><td style="padding:8px 12px;color:#64748b;font-weight:600">Submitted by</td><td style="padding:8px 12px;color:#1e293b">{{actorName}}</td></tr>
    </table>
  </div>
  <div style="background:#f8fafc;padding:16px 36px;text-align:center;border-top:1px solid #e2e8f0">
    <p style="margin:0;font-size:11px;color:#94a3b8">HC Solutions Ltd · Payroll Workflow</p>
  </div>
</div>',
  'Sent to HR when a payroll batch is submitted for review.',
  '["clientName","periodLabel","salaryCount","actorName","comments"]'::jsonb
) ON CONFLICT (trigger_event) DO NOTHING;

INSERT INTO email_templates (name, trigger_event, subject, body_html, description, variables) VALUES (
  'HR Approved – Forwarded to MD',
  'hr_approved',
  'Payroll Approved by HR – {{periodLabel}}',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
  <div style="background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);padding:28px 40px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">Payroll Forwarded to MD</h1>
    <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px">HR review complete</p>
  </div>
  <div style="padding:28px 36px">
    <div style="border-left:4px solid #6366f1;padding-left:14px;margin-bottom:22px">
      <p style="margin:0;font-size:15px;color:#1e293b;font-weight:600">HR has reviewed and approved the payroll. It now awaits MD final approval.</p>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr style="background:#f8fafc"><td style="padding:8px 12px;color:#64748b;font-weight:600;width:40%">Client</td><td style="padding:8px 12px;color:#1e293b">{{clientName}}</td></tr>
      <tr><td style="padding:8px 12px;color:#64748b;font-weight:600">Pay Period</td><td style="padding:8px 12px;color:#1e293b">{{periodLabel}}</td></tr>
      <tr style="background:#f8fafc"><td style="padding:8px 12px;color:#64748b;font-weight:600">Employees</td><td style="padding:8px 12px;color:#1e293b">{{salaryCount}}</td></tr>
      <tr><td style="padding:8px 12px;color:#64748b;font-weight:600">Reviewed by</td><td style="padding:8px 12px;color:#1e293b">{{actorName}}</td></tr>
    </table>
  </div>
  <div style="background:#f8fafc;padding:16px 36px;text-align:center;border-top:1px solid #e2e8f0">
    <p style="margin:0;font-size:11px;color:#94a3b8">HC Solutions Ltd · Payroll Workflow</p>
  </div>
</div>',
  'Sent to MD when HR approves a payroll batch.',
  '["clientName","periodLabel","salaryCount","actorName","comments"]'::jsonb
) ON CONFLICT (trigger_event) DO NOTHING;

INSERT INTO email_templates (name, trigger_event, subject, body_html, description, variables) VALUES (
  'HR Rejected Payroll',
  'hr_rejected',
  'Payroll Rejected by HR – {{periodLabel}}',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
  <div style="background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);padding:28px 40px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">Payroll Rejected by HR</h1>
    <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px">Action required</p>
  </div>
  <div style="padding:28px 36px">
    <div style="border-left:4px solid #ef4444;padding-left:14px;margin-bottom:22px">
      <p style="margin:0;font-size:15px;color:#1e293b;font-weight:600">HR has rejected the payroll submission. Please review comments and resubmit.</p>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr style="background:#f8fafc"><td style="padding:8px 12px;color:#64748b;font-weight:600;width:40%">Client</td><td style="padding:8px 12px;color:#1e293b">{{clientName}}</td></tr>
      <tr><td style="padding:8px 12px;color:#64748b;font-weight:600">Pay Period</td><td style="padding:8px 12px;color:#1e293b">{{periodLabel}}</td></tr>
      <tr style="background:#f8fafc"><td style="padding:8px 12px;color:#64748b;font-weight:600">Rejected by</td><td style="padding:8px 12px;color:#1e293b">{{actorName}}</td></tr>
      <tr><td style="padding:8px 12px;color:#64748b;font-weight:600">Comments</td><td style="padding:8px 12px;color:#dc2626">{{comments}}</td></tr>
    </table>
  </div>
  <div style="background:#f8fafc;padding:16px 36px;text-align:center;border-top:1px solid #e2e8f0">
    <p style="margin:0;font-size:11px;color:#94a3b8">HC Solutions Ltd · Payroll Workflow</p>
  </div>
</div>',
  'Sent to Finance Officer when HR rejects a payroll batch.',
  '["clientName","periodLabel","salaryCount","actorName","comments"]'::jsonb
) ON CONFLICT (trigger_event) DO NOTHING;

INSERT INTO email_templates (name, trigger_event, subject, body_html, description, variables) VALUES (
  'MD Approved Payroll',
  'md_approved',
  'Payroll Approved by Managing Director – {{periodLabel}}',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
  <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:28px 40px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">Payroll Fully Approved</h1>
    <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px">MD final approval granted</p>
  </div>
  <div style="padding:28px 36px">
    <div style="border-left:4px solid #10b981;padding-left:14px;margin-bottom:22px">
      <p style="margin:0;font-size:15px;color:#1e293b;font-weight:600">The Managing Director has given final approval. You may now process payments.</p>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr style="background:#f8fafc"><td style="padding:8px 12px;color:#64748b;font-weight:600;width:40%">Client</td><td style="padding:8px 12px;color:#1e293b">{{clientName}}</td></tr>
      <tr><td style="padding:8px 12px;color:#64748b;font-weight:600">Pay Period</td><td style="padding:8px 12px;color:#1e293b">{{periodLabel}}</td></tr>
      <tr style="background:#f8fafc"><td style="padding:8px 12px;color:#64748b;font-weight:600">Employees</td><td style="padding:8px 12px;color:#1e293b">{{salaryCount}}</td></tr>
      <tr><td style="padding:8px 12px;color:#64748b;font-weight:600">Approved by</td><td style="padding:8px 12px;color:#1e293b">{{actorName}}</td></tr>
    </table>
  </div>
  <div style="background:#f8fafc;padding:16px 36px;text-align:center;border-top:1px solid #e2e8f0">
    <p style="margin:0;font-size:11px;color:#94a3b8">HC Solutions Ltd · Payroll Workflow</p>
  </div>
</div>',
  'Sent to Finance Officer when MD gives final approval.',
  '["clientName","periodLabel","salaryCount","actorName","comments"]'::jsonb
) ON CONFLICT (trigger_event) DO NOTHING;

INSERT INTO email_templates (name, trigger_event, subject, body_html, description, variables) VALUES (
  'MD Rejected Payroll',
  'md_rejected',
  'Payroll Rejected by Managing Director – {{periodLabel}}',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
  <div style="background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);padding:28px 40px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">Payroll Rejected by MD</h1>
    <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px">Action required</p>
  </div>
  <div style="padding:28px 36px">
    <div style="border-left:4px solid #ef4444;padding-left:14px;margin-bottom:22px">
      <p style="margin:0;font-size:15px;color:#1e293b;font-weight:600">The Managing Director has rejected the payroll. Please review comments.</p>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr style="background:#f8fafc"><td style="padding:8px 12px;color:#64748b;font-weight:600;width:40%">Client</td><td style="padding:8px 12px;color:#1e293b">{{clientName}}</td></tr>
      <tr><td style="padding:8px 12px;color:#64748b;font-weight:600">Pay Period</td><td style="padding:8px 12px;color:#1e293b">{{periodLabel}}</td></tr>
      <tr style="background:#f8fafc"><td style="padding:8px 12px;color:#64748b;font-weight:600">Rejected by</td><td style="padding:8px 12px;color:#1e293b">{{actorName}}</td></tr>
      <tr><td style="padding:8px 12px;color:#64748b;font-weight:600">Comments</td><td style="padding:8px 12px;color:#dc2626">{{comments}}</td></tr>
    </table>
  </div>
  <div style="background:#f8fafc;padding:16px 36px;text-align:center;border-top:1px solid #e2e8f0">
    <p style="margin:0;font-size:11px;color:#94a3b8">HC Solutions Ltd · Payroll Workflow</p>
  </div>
</div>',
  'Sent to HR/Finance Officer when MD rejects a payroll batch.',
  '["clientName","periodLabel","salaryCount","actorName","comments"]'::jsonb
) ON CONFLICT (trigger_event) DO NOTHING;

INSERT INTO email_templates (name, trigger_event, subject, body_html, description, variables) VALUES (
  'Finance Officer Notification',
  'fo_notification',
  'Payroll Review Update – {{period}}',
  '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
  <div style="background:linear-gradient(135deg,#003661 0%,#004d8a 100%);padding:28px 40px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">Payroll Review Update</h1>
    <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px">Finance Officer Notification</p>
  </div>
  <div style="padding:28px 36px">
    <p style="font-size:15px;color:#1e293b">Dear <strong>{{foName}}</strong>,</p>
    <p style="color:#475569">The payroll review for <strong>{{period}}</strong> has been updated. Status: <strong>{{status}}</strong></p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
      <tr style="background:#f8fafc"><td style="padding:8px 12px;color:#64748b;font-weight:600;width:40%">Period</td><td style="padding:8px 12px;color:#1e293b">{{period}}</td></tr>
      <tr><td style="padding:8px 12px;color:#64748b;font-weight:600">Employees</td><td style="padding:8px 12px;color:#1e293b">{{count}}</td></tr>
      <tr style="background:#f8fafc"><td style="padding:8px 12px;color:#64748b;font-weight:600">Reviewed by</td><td style="padding:8px 12px;color:#1e293b">{{reviewedBy}}</td></tr>
      <tr><td style="padding:8px 12px;color:#64748b;font-weight:600">Comments</td><td style="padding:8px 12px;color:#1e293b">{{comment}}</td></tr>
    </table>
  </div>
  <div style="background:#f8fafc;padding:16px 36px;text-align:center;border-top:1px solid #e2e8f0">
    <p style="margin:0;font-size:11px;color:#94a3b8">HC Solutions Ltd · Automated notification</p>
  </div>
</div>',
  'Sent to Finance Officer after HR review of payroll.',
  '["foName","period","status","count","reviewedBy","comment"]'::jsonb
) ON CONFLICT (trigger_event) DO NOTHING;
