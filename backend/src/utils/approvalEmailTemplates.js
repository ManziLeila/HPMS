/**
 * EMAIL TEMPLATES FOR PAYROLL APPROVAL WORKFLOW
 * Handles notifications at each approval stage
 */

import config from '../config/env.js';

const appUrl = () => config.appUrl;

export const payrollSubmittedTemplate = ({ batchName, periodMonth, periodYear, totalEmployees, totalNetSalary, financeOfficerName, batchId }) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px; border-radius: 8px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: white; padding: 30px; border-bottom: 1px solid #e5e7eb; }
        .section { margin-bottom: 25px; }
        .section-title { color: #111827; font-size: 18px; font-weight: 700; margin-bottom: 15px; display: flex; align-items: center; gap: 10px; }
        .status { display: inline-block; padding: 8px 16px; background: #fef3c7; color: #92400e; border-radius: 6px; font-weight: 600; font-size: 14px; }
        .info-table { width: 100%; border-collapse: collapse; }
        .info-table td { padding: 12px; border-bottom: 1px solid #f3f4f6; }
        .info-table .label { color: #6b7280; font-weight: 600; width: 40%; }
        .info-table .value { color: #111827; font-weight: 500; }
        .timeline { border-left: 3px solid #667eea; padding-left: 20px; margin: 20px 0; }
        .timeline-item { margin-bottom: 20px; }
        .timeline-dot { width: 16px; height: 16px; background: #667eea; border-radius: 50%; margin-left: -29px; margin-top: 3px; }
        .timeline-item.pending .timeline-dot { background: #f59e0b; }
        .timeline-item.active { color: #667eea; font-weight: 600; }
        .action-required { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
        .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 Payroll Batch Submitted for Approval</h1>
            <p>Action Required from HR Team</p>
        </div>
        <div class="content">
            <div class="section">
                <div class="section-title">📦 Batch Summary</div>
                <table class="info-table">
                    <tr>
                        <td class="label">Batch Name</td>
                        <td class="value"><strong>${batchName}</strong></td>
                    </tr>
                    <tr>
                        <td class="label">Batch ID</td>
                        <td class="value">#${batchId}</td>
                    </tr>
                    <tr>
                        <td class="label">Period</td>
                        <td class="value">${periodMonth}/${periodYear}</td>
                    </tr>
                    <tr>
                        <td class="label">Total Employees</td>
                        <td class="value">${totalEmployees}</td>
                    </tr>
                    <tr>
                        <td class="label">Total Net Salary</td>
                        <td class="value">RWF ${totalNetSalary.toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td class="label">Submitted By</td>
                        <td class="value">${financeOfficerName}</td>
                    </tr>
                    <tr>
                        <td class="label">Status</td>
                        <td class="value"><span class="status">⏳ Awaiting HR Review</span></td>
                    </tr>
                </table>
            </div>

            <div class="section">
                <div class="section-title">📍 Approval Workflow</div>
                <div class="timeline">
                    <div class="timeline-item active">
                        <div class="timeline-dot"></div>
                        <strong>Step 1: HR Review</strong> (Current Stage)
                        <p style="margin: 5px 0 0 0; font-size: 14px;">HR Manager must verify all salary records</p>
                    </div>
                    <div class="timeline-item pending">
                        <div class="timeline-dot"></div>
                        <strong>Step 2: MD Approval</strong> (Pending)
                        <p style="margin: 5px 0 0 0; font-size: 14px;">Managing Director final approval</p>
                    </div>
                    <div class="timeline-item pending">
                        <div class="timeline-dot"></div>
                        <strong>Step 3: Bank Submission</strong> (Pending)
                        <p style="margin: 5px 0 0 0; font-size: 14px;">Finance Officer submits to bank & sends payslips</p>
                    </div>
                </div>
            </div>

            <div class="action-required">
                <strong>⚠️ ACTION REQUIRED</strong>
                <p style="margin: 10px 0 0 0;">Please review this payroll batch and provide approval or feedback within 24 hours to maintain the approval timeline.</p>
            </div>

            <a href="${appUrl()}/hr-review" class="button">Review Payroll Batch</a>
        </div>
        <div class="footer">
            <p style="margin: 0;">HC Solutions Payroll System<br>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
`;

export const hrApprovedTemplate = ({ batchName, periodMonth, periodYear, hrManagerName, totalNetSalary, batchId }) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px; border-radius: 8px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: white; padding: 30px; }
        .success-badge { display: inline-block; padding: 10px 20px; background: #dcfce7; color: #166534; border-radius: 6px; font-weight: 600; margin-bottom: 20px; }
        .info-box { background: #f9fafb; padding: 15px; border-left: 4px solid #10b981; border-radius: 6px; margin: 20px 0; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Payroll Batch Approved by HR</h1>
            <p>Proceeding to Managing Director</p>
        </div>
        <div class="content">
            <div class="success-badge">✓ HR Review Complete</div>
            
            <p>Dear Finance Team,</p>
            <p><strong>Payroll batch "${batchName}"</strong> for ${periodMonth}/${periodYear} has been <strong>approved by HR Manager ${hrManagerName}</strong>.</p>
            
            <div class="info-box">
                <p><strong>Batch Details:</strong></p>
                <p style="margin: 5px 0;">• Batch ID: #${batchId}</p>
                <p style="margin: 5px 0;">• Total Net Salary: RWF ${totalNetSalary.toLocaleString()}</p>
                <p style="margin: 5px 0;">• Current Status: HR Approved → Awaiting MD Final Approval</p>
            </div>

            <p><strong>Next Step:</strong>&nbsp;The batch has been forwarded to the Managing Director for final approval. You will receive a notification once the MD has reviewed and approved it.</p>
        </div>
        <div class="footer">
            <p style="margin: 0;">HC Solutions Payroll System</p>
        </div>
    </div>
</body>
</html>
`;

export const mdApprovedTemplate = ({ batchName, periodMonth, periodYear, mdName, totalNetSalary, batchId, financeOfficerEmail }) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px; border-radius: 8px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: white; padding: 30px; }
        .success-badge { display: inline-block; padding: 10px 20px; background: #dcfce7; color: #166534; border-radius: 6px; font-weight: 600; margin-bottom: 20px; }
        .action-box { background: #efe6ff; border-left: 4px solid #667eea; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Payroll Fully Approved!</h1>
            <p>Ready for Bank Submission</p>
        </div>
        <div class="content">
            <div class="success-badge">✓ MD Approval Complete</div>
            
            <p>Dear Finance Officer,</p>
            <p><strong>Payroll batch "${batchName}"</strong> for ${periodMonth}/${periodYear} has been <strong>fully approved by Managing Director ${mdName}</strong>.</p>
            
            <div class="action-box">
                <p style="margin: 0;"><strong>📌 Important: Action Required From You</strong></p>
                <p style="margin: 10px 0 5px 0;">Your payroll batch is now ready for:</p>
                <p style="margin: 5px 0;">1️⃣ Bank Submission</p>
                <p style="margin: 5px 0;">2️⃣ Payslip Generation & Email Dispatch</p>
                <p style="margin: 5px 0 10px 0;">Please proceed to finalize this batch.</p>
            </div>

            <p><strong>Batch Details:</strong></p>
            <p style="margin: 5px 0;">• Batch ID: #${batchId}</p>
            <p style="margin: 5px 0;">• Total Net Salary: RWF ${totalNetSalary.toLocaleString()}</p>
            <p style="margin: 5px 0;">• Approved By: ${mdName}</p>

            <a href="${appUrl()}/my-batches" class="button">Send to Bank & Dispatch Payslips</a>
        </div>
        <div class="footer">
            <p style="margin: 0;">HC Solutions Payroll System</p>
        </div>
    </div>
</body>
</html>
`;

export const sentToBankTemplate = ({ batchName, periodMonth, periodYear, totalNetSalary, employeeCount, batchId }) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px; border-radius: 8px; }
        .header { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: white; padding: 30px; }
        .completed-badge { display: inline-block; padding: 10px 20px; background: #dcfce7; color: #166534; border-radius: 6px; font-weight: 600; margin-bottom: 20px; }
        .summary-box { background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💰 Payroll Sent to Bank</h1>
            <p>Payslips Dispatched to Employees</p>
        </div>
        <div class="content">
            <div class="completed-badge">✓ Process Complete</div>
            
            <p>Dear Stakeholders,</p>
            <p><strong>Payroll batch "${batchName}"</strong> for ${periodMonth}/${periodYear} has been <strong>successfully sent to the bank</strong> and all payslips have been dispatched to employees.</p>
            
            <div class="summary-box">
                <p><strong>📊 Process Summary:</strong></p>
                <p style="margin: 8px 0;">✓ HR Review: Completed</p>
                <p style="margin: 8px 0;">✓ MD Approval: Completed</p>
                <p style="margin: 8px 0;">✓ Bank Submission: Completed</p>
                <p style="margin: 8px 0;">✓ Payslips Sent: ${employeeCount} employees</p>
                <p style="margin: 8px 0;">✓ Total Amount: RWF ${totalNetSalary.toLocaleString()}</p>
            </div>

            <p><strong>What Happens Next:</strong></p>
            <p style="margin: 5px 0;">• Employees will receive their payslips via email</p>
            <p style="margin: 5px 0;">• Bank will process salary transfers within 1-2 business days</p>
            <p style="margin: 5px 0;">• Batch #${batchId} is now archived in the system</p>

            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">This payroll cycle has been successfully completed. Thank you for your attention to detail in the approval process.</p>
        </div>
        <div class="footer">
            <p style="margin: 0;">HC Solutions Payroll System</p>
        </div>
    </div>
</body>
</html>
`;

export const payrollRejectedTemplate = ({ batchName, periodMonth, periodYear, rejectionReason, rejectedBy, rejectedAt }) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px; border-radius: 8px; }
        .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: white; padding: 30px; }
        .alert-badge { display: inline-block; padding: 10px 20px; background: #fee2e2; color: #991b1b; border-radius: 6px; font-weight: 600; margin-bottom: 20px; }
        .details-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ Payroll Batch Rejected</h1>
            <p>Action Required - Please Review</p>
        </div>
        <div class="content">
            <div class="alert-badge">✗ Rejection Notice</div>
            
            <p>Dear Finance Officer,</p>
            <p><strong>Payroll batch "${batchName}"</strong> for ${periodMonth}/${periodYear} has been <strong>rejected</strong>.</p>
            
            <div class="details-box">
                <p><strong>Rejection Details:</strong></p>
                <p style="margin: 8px 0;"><strong>Rejected By:</strong> ${rejectedBy}</p>
                <p style="margin: 8px 0;"><strong>Date:</strong> ${new Date(rejectedAt).toLocaleDateString()}</p>
                <p style="margin-top: 12px;"><strong>Reason for Rejection:</strong></p>
                <p style="margin: 8px 0; padding: 10px; background: white; border-radius: 4px;">${rejectionReason || 'No specific reason provided'}</p>
            </div>

            <p><strong>Next Steps:</strong></p>
            <p style="margin: 5px 0;">1. Review the rejection reason carefully</p>
            <p style="margin: 5px 0;">2. Make necessary corrections to the payroll data</p>
            <p style="margin: 5px 0;">3. Create a new batch with the corrected information</p>
            <p style="margin: 5px 0;">4. Resubmit for approval</p>

            <p style="color: #991b1b; margin-top: 20px;"><strong>Please contact the reviewer for clarification if needed before resubmitting.</strong></p>
        </div>
        <div class="footer">
            <p style="margin: 0;">HC Solutions Payroll System</p>
        </div>
    </div>
</body>
</html>
`;
