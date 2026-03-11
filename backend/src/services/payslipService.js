import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import { createReadStream, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dayjs from 'dayjs';
import { formatCurrency } from '../utils/currency.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = join(__dirname, '../assets/hc-solutions-logo.png');

/**
 * Generate a professional payslip PDF
 * Clean, business-style layout with bordered tables
 */
export const generatePayslipPdf = ({ employee, salary, payrollSnapshot }) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    const pass = new PassThrough();
    pass.on('data', (chunk) => chunks.push(chunk));
    pass.on('finish', () => {
      const buf = Buffer.concat(chunks);
      if (buf.length === 0) {
        reject(new Error('PDF generation produced empty output'));
      } else {
        resolve(buf);
      }
    });
    pass.on('error', reject);
    doc.on('error', reject);
    doc.pipe(pass);

    const snap = payrollSnapshot || {};
    const allowances = snap.allowances || { transport: 0, housing: 0, performance: 0, variable: 0 };
    const basicSalary = snap.basicSalary ?? 0;

    const pageWidth = 595.28;
    const margin = 50;
    const contentWidth = pageWidth - 2 * margin;

    // ========================================
    // HEADER — Logo + Company Info
    // ========================================
    let headerY = 50;

    // Logo — top left
    const logoSize = 60;
    if (existsSync(LOGO_PATH)) {
      doc.image(LOGO_PATH, margin, headerY, { width: logoSize, height: logoSize });
    }

    // Company name + title — centered beside logo
    doc
      .fontSize(22)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('Payslip', margin, headerY + 4, { align: 'center', width: contentWidth });

    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('HC Solutions', margin, headerY + 30, { align: 'center', width: contentWidth });

    doc
      .fontSize(10)
      .font('Helvetica')
      .text('Kigali, Rwanda', margin, headerY + 50, { align: 'center', width: contentWidth });

    headerY += logoSize + 10;

    // ========================================
    // EMPLOYEE INFORMATION — Two Columns
    // ========================================
    const infoStartY = headerY + 75;
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
    const payPeriodStr = salary?.payPeriod ? dayjs(salary.payPeriod).format('MMMM YYYY') : 'N/A';
    doc.fontSize(11).font('Helvetica-Bold').text(payPeriodStr, leftColX + 120, infoStartY + 20);

    doc.fontSize(10).font('Helvetica').text('Worked Days', leftColX, infoStartY + 40);
    doc.fontSize(11).font('Helvetica-Bold').text(String(salary.workedDays || '26'), leftColX + 120, infoStartY + 40);

    // Right Column
    doc.fontSize(10).font('Helvetica').text('Employee name', rightColX, infoStartY);
    doc.fontSize(11).font('Helvetica-Bold').text(employee?.fullName || 'N/A', rightColX + 120, infoStartY);

    doc.fontSize(10).font('Helvetica').text('Designation', rightColX, infoStartY + 20);
    doc.fontSize(11).font('Helvetica-Bold').text(employee.role || 'Employee', rightColX + 120, infoStartY + 20);

    doc.fontSize(10).font('Helvetica').text('Department', rightColX, infoStartY + 40);
    doc.fontSize(11).font('Helvetica-Bold').text(employee.department || 'N/A', rightColX + 120, infoStartY + 40);

    // ========================================
    // EARNINGS TABLE
    // ========================================
    const tableX = margin;
    const tableWidth = contentWidth;
    const col1Width = tableWidth * 0.7;
    const col2Width = tableWidth * 0.3;
    const rowH = 22;

    let currentY = infoStartY + 70;

    // Table header
    doc.rect(tableX, currentY, tableWidth, 25).stroke();
    doc.rect(tableX, currentY, col1Width, 25).stroke();
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000').text('Earnings', tableX + 10, currentY + 8);
    doc.text('Amount', tableX + col1Width + 10, currentY + 8);
    currentY += 25;

    const earningsItems = [
      { label: 'Basic Salary',           amount: basicSalary },
      { label: 'Transport Allowance',    amount: allowances.transport },
      { label: 'Housing Allowance',      amount: allowances.housing },
      { label: 'Performance Allowance',  amount: allowances.performance },
    ];

    earningsItems.forEach((item) => {
      doc.rect(tableX, currentY, tableWidth, rowH).stroke();
      doc.rect(tableX, currentY, col1Width, rowH).stroke();
      doc.fontSize(10).font('Helvetica').fillColor('#000000').text(item.label, tableX + 10, currentY + 6);
      doc.fontSize(10).font('Helvetica').text(
        formatCurrency(item.amount).replace('RWF ', ''),
        tableX + col1Width + 10, currentY + 6,
        { width: col2Width - 20, align: 'right' }
      );
      currentY += rowH;
    });

    // Total Earnings
    doc.rect(tableX, currentY, tableWidth, rowH).stroke();
    doc.rect(tableX, currentY, col1Width, rowH).stroke();
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000').text('Total Earnings', tableX + 10, currentY + 5);
    doc.text(
      formatCurrency(snap.grossSalary ?? 0).replace('RWF ', ''),
      tableX + col1Width + 10, currentY + 5,
      { width: col2Width - 20, align: 'right' }
    );
    currentY += rowH + 12;

    // ========================================
    // DEDUCTIONS TABLE
    // ========================================
    doc.rect(tableX, currentY, tableWidth, 25).stroke();
    doc.rect(tableX, currentY, col1Width, 25).stroke();
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000').text('Deductions', tableX + 10, currentY + 8);
    doc.text('Amount', tableX + col1Width + 10, currentY + 8);
    currentY += 25;

    const deductionsItems = [
      { label: 'PAYE Tax',             amount: snap.paye ?? 0 },
      { label: 'RSSB Pension (6%)',    amount: snap.rssbEePension ?? 0 },
      { label: 'RSSB Maternity (0.3%)', amount: snap.rssbEeMaternity ?? 0 },
    ];

    if (snap.includeMedical !== false) {
      deductionsItems.push({
        label: 'RAMA Insurance (7.5%)',
        amount: snap.ramaInsuranceEmployee || snap.medicalInsuranceEmployee || 0,
      });
    }

    deductionsItems.push({ label: 'CBHI (0.5%)', amount: snap.cbhiEmployee ?? 0 });

    if ((snap.advanceAmount ?? 0) > 0) {
      deductionsItems.push({ label: 'Advance Deduction', amount: snap.advanceAmount });
    }

    deductionsItems.forEach((item) => {
      doc.rect(tableX, currentY, tableWidth, rowH).stroke();
      doc.rect(tableX, currentY, col1Width, rowH).stroke();
      doc.fontSize(10).font('Helvetica').fillColor('#000000').text(item.label, tableX + 10, currentY + 6);
      doc.fontSize(10).font('Helvetica').text(
        formatCurrency(item.amount).replace('RWF ', ''),
        tableX + col1Width + 10, currentY + 6,
        { width: col2Width - 20, align: 'right' }
      );
      currentY += rowH;
    });

    // Total Deductions
    doc.rect(tableX, currentY, tableWidth, rowH).stroke();
    doc.rect(tableX, currentY, col1Width, rowH).stroke();
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000').text('Total Deductions', tableX + 10, currentY + 5);
    doc.text(
      formatCurrency(snap.totalEmployeeDeductions ?? 0).replace('RWF ', ''),
      tableX + col1Width + 10, currentY + 5,
      { width: col2Width - 20, align: 'right' }
    );
    currentY += rowH;

    // Net Pay (highlighted)
    doc.rect(tableX, currentY, tableWidth, 26).fillAndStroke('#f0f0f0', '#000000');
    doc.rect(tableX, currentY, col1Width, 26).stroke();
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000').text('Net Pay', tableX + 10, currentY + 7);
    doc.text(
      formatCurrency(snap.netPaidToBank || snap.netSalary || 0).replace('RWF ', ''),
      tableX + col1Width + 10, currentY + 7,
      { width: col2Width - 20, align: 'right' }
    );
    currentY += 40;

    // ========================================
    // FOOTER — Generated-by statement
    // ========================================
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#1e3a8a')
      .text(
        'This payslip was generated by HC Solutions Payroll System.',
        margin, currentY,
        { align: 'center', width: contentWidth }
      );

    doc.end();
  });
