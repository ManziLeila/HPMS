/**
 * Email template for salary processed notification
 */
export const salaryProcessedTemplate = ({
  employeeName,
  payPeriod,
  netSalary,
  grossSalary,
  salaryId,
}) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Salary Processed</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      color: white;
      padding: 20px;
      border-radius: 8px 8px 0 0;
      margin: -30px -30px 20px -30px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 20px 0;
    }
    .salary-info {
      background-color: #f0f9ff;
      border-left: 4px solid #0ea5e9;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .salary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .salary-row:last-child {
      border-bottom: none;
      font-weight: bold;
      font-size: 18px;
      color: #0ea5e9;
    }
    .label {
      color: #666;
    }
    .value {
      font-weight: 600;
      color: #333;
    }
    .button {
      display: inline-block;
      background-color: #0ea5e9;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 20px;
      font-weight: 600;
    }
    .button:hover {
      background-color: #0284c7;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💰 Salary Processed</h1>
    </div>
    
    <div class="content">
      <p>Dear <strong>${employeeName}</strong>,</p>
      
      <p>Your salary for <strong>${payPeriod}</strong> has been successfully processed and is ready for payment.</p>
      
      <div class="salary-info">
        <div class="salary-row">
          <span class="label">Pay Period:</span>
          <span class="value">${payPeriod}</span>
        </div>
        <div class="salary-row">
          <span class="label">Gross Salary:</span>
          <span class="value">${grossSalary}</span>
        </div>
        <div class="salary-row">
          <span class="label">Net Salary:</span>
          <span class="value">${netSalary}</span>
        </div>
      </div>
      
      <p>You can download your detailed payslip by logging into the payroll system.</p>
      
      <p style="margin-top: 30px;">
        <strong>Note:</strong> The salary will be transferred to your registered bank account within 1-2 business days.
      </p>
    </div>
    
    <div class="footer">
      <p>This is an automated message from HC Solutions Payroll Management System.</p>
      <p>If you have any questions, please contact your HR department.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
};

/**
 * Email template for payslip delivery with PDF attachment
 * Simple, natural format - salary details only in PDF attachment
 */
export const payslipDeliveryTemplate = ({
  employeeName,
  employeeId,
  payPeriod,
  netSalary,
  payDate,
  companyName = 'HC Solutions',
  hrContact = 'HR Department',
  responseDays = '5',
  senderName = 'Payroll Team',
  jobTitle = 'Payroll Administrator',
  companyEmail = 'payroll@hcsolutions.rw',
  companyPhone = '+250 788 000 000',
}) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Payslip for ${payPeriod}</title>
  <style>
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #000000;
      background-color: #ffffff;
      margin: 0;
      padding: 20px;
    }
    .email-content {
      max-width: 600px;
      margin: 0 auto;
    }
    p {
      margin: 0 0 12px 0;
    }
    .signature {
      margin-top: 20px;
      border-top: 1px solid #cccccc;
      padding-top: 15px;
    }
  </style>
</head>
<body>
  <div class="email-content">
    <p>Dear ${employeeName},</p>
    
    <p>I hope this email finds you well.</p>
    
    <p>Please find attached your payslip for <strong>${payPeriod}</strong>. The attached PDF document contains a detailed breakdown of your earnings, deductions, and other payroll information for this period.</p>
    
    <p>Payment will be processed on <strong>${payDate}</strong>.</p>
    
    <p>If you have any questions or notice any discrepancies, please contact the ${hrContact} within ${responseDays} working days.</p>
    
    <p>Thank you for your continued dedication to ${companyName}.</p>
    
    <div class="signature">
      <p>Best regards,<br>
      ${senderName}<br>
      ${jobTitle}<br>
      ${companyName}<br>
      ${companyEmail}<br>
      ${companyPhone}</p>
    </div>
    
    <p style="font-size: 11px; color: #666666; margin-top: 20px; border-top: 1px solid #eeeeee; padding-top: 10px;">
      <em>This is an automated message. Please do not reply to this email. For assistance, contact ${hrContact}.</em>
    </p>
  </div>
</body>
</html>
  `.trim();
};

export default {
  salaryProcessedTemplate,
  payslipDeliveryTemplate,
};
