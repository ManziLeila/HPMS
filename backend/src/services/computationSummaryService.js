import PDFDocument from 'pdfkit';
import { formatCurrency } from '../utils/currency.js';

const monthName = (m) =>
  ['January', 'February', 'March', 'April', 'May', 'June',
   'July', 'August', 'September', 'October', 'November', 'December'][m - 1] || m;

/**
 * Build computation formulas for a salary record (matches frontend getComputationFormulas)
 */
const getFormulas = (s) => {
  const snap = s?.snapshot || {};
  const allow = snap.allowances || {};
  const basic = Number(snap.basicSalary) || 0;
  const transport = Number(allow.transport) || 0;
  const housing = Number(allow.housing) || 0;
  const performance = Number(allow.performance) || 0;
  const gross = Number(s.gross_salary ?? snap.grossSalary) || 0;
  const paye = Number(s.paye ?? snap.paye) || 0;
  const rssb = Number(snap.rssbEePension ?? s.rssb_pension) || 0;
  const maternity = Number(snap.rssbEeMaternity) || 0;
  const rama = Number(snap.ramaInsuranceEmployee) || 0;
  const includeMedical = snap.includeMedical !== false;
  const netBeforeCbhi = Number(snap.netBeforeCbhi) || 0;
  const cbhi = Number(snap.cbhiEmployee) || 0;
  const advance = Number(snap.advanceAmount) || 0;
  const net = Number(s.net_salary ?? snap.netPaidToBank ?? snap.netSalary) || 0;

  const baseItems = [
    { label: 'Gross Salary', formula: `Basic (${basic.toLocaleString()}) + Transport (${transport.toLocaleString()}) + Housing (${housing.toLocaleString()}) + Performance (${performance.toLocaleString()})`, amount: gross },
    { label: 'PAYE', formula: 'Progressive tax: 0% on first 60,000 RWF, 10% on next 40,000, 20% on next 100,000, 30% above 200,000', amount: paye },
    { label: 'RSSB Pension', formula: '6% of Gross Salary', amount: rssb },
    { label: 'RSSB Maternity', formula: '0.3% of Basic Salary', amount: maternity },
    ...(includeMedical ? [{ label: 'RAMA (Medical)', formula: '7.5% of Basic Salary', amount: rama }] : []),
    { label: 'NET (before CBHI)', formula: includeMedical ? 'Gross − PAYE − RSSB Pension − Maternity − RAMA' : 'Gross − PAYE − RSSB Pension − Maternity', amount: netBeforeCbhi },
    { label: 'CBHI', formula: '0.5% of NET (before CBHI)', amount: cbhi },
    { label: 'Advance', formula: 'Deducted amount', amount: advance },
    { label: 'Net Pay', formula: 'NET (before CBHI) − CBHI − Advance', amount: net },
  ];
  return baseItems;
};

/**
 * Generate a PDF with payroll computation breakdown (formulas + amounts) for HR/MD review
 */
export const generateComputationSummaryPdf = ({ period, salaries }) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const buf = Buffer.concat(chunks);
      resolve(buf.length > 0 ? buf : null);
    });
    doc.on('error', reject);

    const pageWidth = 595.28;
    const margin = 50;
    const contentWidth = pageWidth - 2 * margin;

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('Payroll Computation Summary', margin, 50, { align: 'center', width: contentWidth });
    doc.fontSize(14).font('Helvetica-Bold').text(period.client_name || 'Client', margin, 80, { align: 'center', width: contentWidth });
    doc.fontSize(11).font('Helvetica').text(`${monthName(period.period_month)} ${period.period_year}`, margin, 100, { align: 'center', width: contentWidth });
    doc.moveDown(2);

    let y = doc.y + 20;

    for (const s of salaries || []) {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      doc.fontSize(12).font('Helvetica-Bold').text(s.full_name || 'Employee', margin, y);
      y += 22;

      const formulas = getFormulas(s);
      for (let idx = 0; idx < formulas.length; idx++) {
        const item = formulas[idx];
        if (y > 750) {
          doc.addPage();
          y = 50;
        }
        const labelW = 110;
        const amountW = 90;
        const rowHeight = 18;
        const isNetPay = item.label === 'Net Pay';

        if (isNetPay) {
          doc.rect(margin, y - 2, contentWidth, rowHeight + 4).fill('#FFFF00');
          doc.fillColor('#000000');
        }
        doc.fontSize(9).font('Helvetica').text(`${item.label}:`, margin, y, { width: labelW });
        doc.fontSize(8).font('Helvetica').text(item.formula, margin + labelW + 8, y, { width: contentWidth - labelW - amountW - 16 });
        doc.fontSize(9).font('Helvetica-Bold').text(formatCurrency(item.amount), margin + contentWidth - amountW, y, { width: amountW, align: 'right' });
        y += rowHeight;
      }

      y += 16;
    }

    doc.end();
  });
