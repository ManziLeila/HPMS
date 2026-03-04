import PDFDocument from 'pdfkit';
import dayjs from 'dayjs';
import { formatCurrency } from '../utils/currency.js';
import { numberToWords } from '../utils/numberToWords.js';

/**
 * Generate a professional payslip PDF matching the reference design
 * Clean, business-style layout with bordered tables
 */
export const generatePayslipPdf = ({ employee, salary, payrollSnapshot }) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = 595.28; // A4 width in points
    const margin = 50;
    const contentWidth = pageWidth - 2 * margin;

    // ========================================
    // HEADER SECTION - Centered
    // ========================================
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('Payslip', margin, 50, { align: 'center', width: contentWidth });

    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('HC Solutions', margin, 85, { align: 'center', width: contentWidth });

    doc
      .fontSize(11)
      .font('Helvetica')
      .text('Kigali, Rwanda', margin, 110, { align: 'center', width: contentWidth });

    doc.moveDown(2);

    // ========================================
    // EMPLOYEE INFORMATION - Two Columns
    // ========================================
    const infoStartY = doc.y + 10;
    const leftColX = margin;
    const rightColX = margin + contentWidth / 2 + 20;

    // Left Column
    doc.fontSize(10).font('Helvetica').text('Date of Joining', leftColX, infoStartY);
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(
        employee.dateOfJoining ? dayjs(employee.dateOfJoining).format('YYYY-MM-DD') : 'N/A',
        leftColX + 120,
        infoStartY
      );

    doc.fontSize(10).font('Helvetica').text('Pay Period', leftColX, infoStartY + 20);
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(dayjs(salary.payPeriod).format('MMMM YYYY'), leftColX + 120, infoStartY + 20);

    doc.fontSize(10).font('Helvetica').text('Worked Days', leftColX, infoStartY + 40);
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(salary.workedDays || '26', leftColX + 120, infoStartY + 40);

    // Right Column
    doc.fontSize(10).font('Helvetica').text('Employee name', rightColX, infoStartY);
    doc.fontSize(11).font('Helvetica-Bold').text(employee.fullName, rightColX + 120, infoStartY);

    doc.fontSize(10).font('Helvetica').text('Designation', rightColX, infoStartY + 20);
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(employee.role || 'Employee', rightColX + 120, infoStartY + 20);

    doc.fontSize(10).font('Helvetica').text('Department', rightColX, infoStartY + 40);
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(employee.department || 'N/A', rightColX + 120, infoStartY + 40);

    doc.moveDown(4);

    // ========================================
    // EARNINGS TABLE
    // ========================================
    const earningsTableY = doc.y + 10;
    const tableX = margin;
    const tableWidth = contentWidth;
    const col1Width = tableWidth * 0.7;
    const col2Width = tableWidth * 0.3;

    // Table header
    doc.rect(tableX, earningsTableY, tableWidth, 25).stroke();
    doc.rect(tableX, earningsTableY, col1Width, 25).stroke();
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Earnings', tableX + 10, earningsTableY + 8);
    doc.text('Amount', tableX + col1Width + 10, earningsTableY + 8);

    let currentY = earningsTableY + 25;

    // Earnings rows
    const earningsItems = [
      { label: 'Basic Salary', amount: payrollSnapshot.basicSalary },
      { label: 'Transport Allowance', amount: payrollSnapshot.allowances.transport },
      { label: 'Housing Allowance', amount: payrollSnapshot.allowances.housing },
      { label: 'Performance Allowance', amount: payrollSnapshot.allowances.performance },
    ];

    earningsItems.forEach((item) => {
      doc.rect(tableX, currentY, tableWidth, 20).stroke();
      doc.rect(tableX, currentY, col1Width, 20).stroke();
      doc.fontSize(10).font('Helvetica').text(item.label, tableX + 10, currentY + 6);
      doc.text(formatCurrency(item.amount).replace('RWF ', ''), tableX + col1Width + 10, currentY + 6, {
        width: col2Width - 20,
        align: 'right',
      });
      currentY += 20;
    });

    // Total Earnings
    doc.rect(tableX, currentY, tableWidth, 22).stroke();
    doc.rect(tableX, currentY, col1Width, 22).stroke();
    doc.fontSize(11).font('Helvetica-Bold').text('Total Earnings', tableX + 10, currentY + 6);
    doc.text(formatCurrency(payrollSnapshot.grossSalary).replace('RWF ', ''), tableX + col1Width + 10, currentY + 6, {
      width: col2Width - 20,
      align: 'right',
    });

    currentY += 35;

    // ========================================
    // DEDUCTIONS TABLE
    // ========================================
    const deductionsTableY = currentY;

    // Table header
    doc.rect(tableX, deductionsTableY, tableWidth, 25).stroke();
    doc.rect(tableX, deductionsTableY, col1Width, 25).stroke();
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Deductions', tableX + 10, deductionsTableY + 8);
    doc.text('Amount', tableX + col1Width + 10, deductionsTableY + 8);

    currentY = deductionsTableY + 25;

    // Deductions rows
    const deductionsItems = [
      { label: 'PAYE Tax', amount: payrollSnapshot.paye },
      { label: 'RSSB Pension (6%)', amount: payrollSnapshot.rssbEePension },
      { label: 'RSSB Maternity (0.3%)', amount: payrollSnapshot.rssbEeMaternity },
    ];

    if (payrollSnapshot.includeMedical !== false) {
      deductionsItems.push({
        label: 'RAMA Insurance (7.5%)',
        amount: payrollSnapshot.ramaInsuranceEmployee || payrollSnapshot.medicalInsuranceEmployee || 0,
      });
    }

    deductionsItems.push({
      label: 'CBHI (0.5%)',
      amount: payrollSnapshot.cbhiEmployee || 0,
    });

    if (payrollSnapshot.advanceAmount > 0) {
      deductionsItems.push({
        label: 'Advance Deduction',
        amount: payrollSnapshot.advanceAmount,
      });
    }

    deductionsItems.forEach((item) => {
      doc.rect(tableX, currentY, tableWidth, 20).stroke();
      doc.rect(tableX, currentY, col1Width, 20).stroke();
      doc.fontSize(10).font('Helvetica').text(item.label, tableX + 10, currentY + 6);
      doc.text(formatCurrency(item.amount).replace('RWF ', ''), tableX + col1Width + 10, currentY + 6, {
        width: col2Width - 20,
        align: 'right',
      });
      currentY += 20;
    });

    // Total Deductions
    doc.rect(tableX, currentY, tableWidth, 22).stroke();
    doc.rect(tableX, currentY, col1Width, 22).stroke();
    doc.fontSize(11).font('Helvetica-Bold').text('Total Deductions', tableX + 10, currentY + 6);
    doc.text(
      formatCurrency(payrollSnapshot.totalEmployeeDeductions).replace('RWF ', ''),
      tableX + col1Width + 10,
      currentY + 6,
      {
        width: col2Width - 20,
        align: 'right',
      }
    );

    currentY += 22;

    // Net Pay (highlighted)
    doc.rect(tableX, currentY, tableWidth, 25).fillAndStroke('#f0f0f0', '#000000');
    doc.rect(tableX, currentY, col1Width, 25).stroke();
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000').text('Net Pay', tableX + 10, currentY + 8);
    doc.text(
      formatCurrency(payrollSnapshot.netPaidToBank || payrollSnapshot.netSalary).replace('RWF ', ''),
      tableX + col1Width + 10,
      currentY + 8,
      {
        width: col2Width - 20,
        align: 'right',
      }
    );

    currentY += 40;

    // ========================================
    // NET PAY IN WORDS
    // ========================================
    const netAmount = payrollSnapshot.netPaidToBank || payrollSnapshot.netSalary;
    const amountInWords = numberToWords(netAmount);

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text(amountInWords, margin, currentY, { align: 'center', width: contentWidth });

    currentY += 40;

    // ========================================
    // SIGNATURE SECTION
    // ========================================
    const signatureY = currentY;
    const signatureBoxHeight = 60;

    // Draw signature boxes
    doc.rect(tableX, signatureY, col1Width - 10, signatureBoxHeight).stroke();
    doc.rect(tableX + col1Width + 10, signatureY, col2Width + (tableWidth - col1Width - col2Width) - 10, signatureBoxHeight).stroke();

    // Labels
    doc.fontSize(10).font('Helvetica').text('Employer Signature', tableX + 10, signatureY + 10);
    doc.text('Employee Signature', tableX + col1Width + 20, signatureY + 10);

    // Signature lines
    doc
      .moveTo(tableX + 10, signatureY + signatureBoxHeight - 15)
      .lineTo(tableX + col1Width - 20, signatureY + signatureBoxHeight - 15)
      .stroke();

    doc
      .moveTo(tableX + col1Width + 20, signatureY + signatureBoxHeight - 15)
      .lineTo(tableX + tableWidth - 10, signatureY + signatureBoxHeight - 15)
      .stroke();

    currentY = signatureY + signatureBoxHeight + 30;

    // ========================================
    // FOOTER
    // ========================================
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#666666')
      .text('This is system generated payslip', margin, currentY, { align: 'center', width: contentWidth });

    doc.end();
  });
