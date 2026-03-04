import ExcelJS from 'exceljs';
import dayjs from 'dayjs';

/**
 * Generate a monthly payroll report in Excel format
 * @param {Object} params - Report parameters
 * @param {Array} params.data - Payroll data array
 * @param {number} params.year - Report year
 * @param {number} params.month - Report month
 * @returns {Promise<Buffer>} Excel file buffer
 */
export const generateMonthlyPayrollExcel = async ({ data, year, month }) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Payroll Report');

    // Set up metadata
    workbook.creator = 'HC Solutions Payroll System';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Company header
    worksheet.mergeCells('A1:I1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'HC SOLUTIONS - PAYROLL MANAGEMENT SYSTEM';
    titleCell.font = { size: 16, bold: true, color: { argb: 'FF0EA5E9' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 30;

    // Report period
    worksheet.mergeCells('A2:I2');
    const periodCell = worksheet.getCell('A2');
    periodCell.value = `Monthly Payroll Report - ${dayjs(`${year}-${month}-01`).format('MMMM YYYY')}`;
    periodCell.font = { size: 12, bold: true };
    periodCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(2).height = 25;

    // Add empty row
    worksheet.addRow([]);

    // Column headers
    const headerRow = worksheet.addRow([
        'Employee Name',
        'Email',
        'Pay Period',
        'Frequency',
        'Gross Salary',
        'PAYE Tax',
        'Total Deductions',
        'Net Salary',
        'Employer Contributions',
    ]);

    // Style header row
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0EA5E9' },
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;

    // Add borders to header
    headerRow.eachCell((cell) => {
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
        };
    });

    // Initialize totals
    let totalGross = 0;
    let totalPaye = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    let totalEmployer = 0;

    // Add data rows
    data.forEach((record) => {
        const gross = Number(record.gross_salary || 0);
        const paye = Number(record.paye || 0);
        const deductions = gross - paye; // Simplified - should include all deductions
        const net = gross - paye;
        const employer = Number(record.total_employer_contrib || 0);

        totalGross += gross;
        totalPaye += paye;
        totalDeductions += deductions;
        totalNet += net;
        totalEmployer += employer;

        const dataRow = worksheet.addRow([
            record.full_name,
            record.email,
            dayjs(record.pay_period).format('DD/MM/YYYY'),
            record.pay_frequency,
            gross,
            paye,
            deductions,
            net,
            employer,
        ]);

        // Format currency columns
        [5, 6, 7, 8, 9].forEach((colNum) => {
            const cell = dataRow.getCell(colNum);
            cell.numFmt = 'RF #,##0';
            cell.alignment = { horizontal: 'right' };
        });

        // Add borders
        dataRow.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            };
        });
    });

    // Add totals row
    const totalsRow = worksheet.addRow([
        'TOTALS',
        '',
        '',
        '',
        totalGross,
        totalPaye,
        totalDeductions,
        totalNet,
        totalEmployer,
    ]);

    // Style totals row
    totalsRow.font = { bold: true };
    totalsRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0F9FF' },
    };

    // Format currency in totals
    [5, 6, 7, 8, 9].forEach((colNum) => {
        const cell = totalsRow.getCell(colNum);
        cell.numFmt = 'RF #,##0';
        cell.alignment = { horizontal: 'right' };
        cell.font = { bold: true };
    });

    // Add borders to totals
    totalsRow.eachCell((cell) => {
        cell.border = {
            top: { style: 'double' },
            left: { style: 'thin' },
            bottom: { style: 'double' },
            right: { style: 'thin' },
        };
    });

    // Auto-fit columns
    worksheet.columns = [
        { key: 'name', width: 25 },
        { key: 'email', width: 30 },
        { key: 'period', width: 15 },
        { key: 'frequency', width: 12 },
        { key: 'gross', width: 18 },
        { key: 'paye', width: 18 },
        { key: 'deductions', width: 20 },
        { key: 'net', width: 18 },
        { key: 'employer', width: 22 },
    ];

    // Freeze header rows
    worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }];

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
};
