import PDFDocument from 'pdfkit';

/* ── Available placeholders ──────────────────────────────────── */
export const PLACEHOLDERS = {
    full_name: 'Employee full name',
    email: 'Employee email',
    department: 'Department',
    job_title: 'Job title',
    contract_type: 'Contract type',
    start_date: 'Contract start date',
    end_date: 'Contract end date (or "Open-ended")',
    gross_salary: 'Gross monthly salary',
    salary_grade: 'Salary grade',
    notes: 'Additional notes',
};

/**
 * Replace {{placeholders}} in a template body with actual values.
 * Any unused placeholder is left blank.
 */
export const fillTemplate = (body, data = {}) => {
    const fmt = (v) => (v == null || v === '' ? '' : String(v));
    return body
        .replace(/{{full_name}}/g, fmt(data.full_name))
        .replace(/{{email}}/g, fmt(data.email))
        .replace(/{{department}}/g, fmt(data.department || '—'))
        .replace(/{{job_title}}/g, fmt(data.job_title))
        .replace(/{{contract_type}}/g, fmt(data.contract_type))
        .replace(/{{start_date}}/g, fmt(data.start_date ? new Date(data.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''))
        .replace(/{{end_date}}/g, fmt(data.end_date ? new Date(data.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Open-ended'))
        .replace(/{{gross_salary}}/g, fmt(data.gross_salary ? Number(data.gross_salary).toLocaleString() : ''))
        .replace(/{{salary_grade}}/g, fmt(data.salary_grade || '—'))
        .replace(/{{notes}}/g, fmt(data.notes || ''));
};

/**
 * Stream a PDF of the filled contract to the Express response.
 */
export const streamContractPDF = (res, { fileName, body, headerLine }) => {
    const doc = new PDFDocument({ size: 'A4', margin: 60, bufferPages: true });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    doc.pipe(res);

    const lines = body.split('\n');
    let firstLine = true;

    for (const line of lines) {
        if (firstLine) {
            // Treat the first non-empty line as the document title
            if (line.trim()) {
                doc.fontSize(15).font('Helvetica-Bold').text(line.trim(), { align: 'center' });
                doc.moveDown(0.5);
                doc.fontSize(10).font('Helvetica')
                    .fillColor('#64748b').text(headerLine, { align: 'center' });
                doc.fillColor('#000000');
                doc.moveDown(1);
                firstLine = false;
            }
            continue;
        }
        const trimmed = line.trimEnd();
        if (trimmed.startsWith('──') || trimmed.startsWith('—')) {
            // Section divider — draw a rule
            doc.moveDown(0.3);
            doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#cbd5e1').lineWidth(0.5).stroke();
            doc.moveDown(0.3);
        } else if (/^\d+\.\s/.test(trimmed) || /^[A-Z\s]{5,}$/.test(trimmed.trim())) {
            doc.fontSize(10).font('Helvetica-Bold').text(trimmed || ' ');
            doc.font('Helvetica');
        } else {
            doc.fontSize(9.5).font('Helvetica').text(trimmed || ' ', { lineGap: 2 });
        }
    }

    doc.end();
};
