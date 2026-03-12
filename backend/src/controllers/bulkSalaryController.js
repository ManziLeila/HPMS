import XLSX from 'xlsx';
import { z } from 'zod';
import { encryptField, decryptField } from '../services/encryptionService.js';
import { calculatePayroll } from '../services/payrollService.js';
import salaryRepo from '../repositories/salaryRepo.js';
import employeeRepo from '../repositories/employeeRepo.js';
import auditService from '../services/auditService.js';
import { generatePayslipPdf } from '../services/payslipService.js';
import notificationService from '../services/notificationService.js';
import { sendPayslipEmail } from '../services/emailService.js';
import JSZip from 'jszip';

const bulkSalarySchema = z.object({
    payPeriod: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    frequency: z.enum(['monthly', 'weekly', 'daily']).default('monthly'),
    includeMedical: z.boolean().optional().default(true),
    clientId: z.string().optional().transform((v) => (v ? Number(v) : null)),
});

/**
 * Process bulk salary upload from Excel file
 * Expected Excel columns:
 * - Full Name (required)
 * - Email (optional - payslip emails only sent to employees with email)
 * - Basic Salary (required)
 * - Transport Allowance (optional)
 * - Housing Allowance (optional)
 * - Performance Allowance (optional)
 * - Variable Allowance (optional)
 * - Advance Amount (optional)
 * - Include RAMA (optional)
 * - RSSB Number (optional)
 */
export const bulkUploadSalaries = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: { message: 'No file uploaded' } });
        }

        // Convert includeMedical from string to boolean (FormData sends strings)
        // clientId can come from req.body (FormData) or req.query (fallback for some clients)
        const bodyData = {
            ...req.body,
            includeMedical: req.body.includeMedical === 'true' || req.body.includeMedical === true,
            clientId: req.body.clientId ?? req.query.clientId ?? undefined,
        };

        const { payPeriod, frequency, includeMedical, clientId } = bulkSalarySchema.parse(bodyData);

        // Parse Excel file
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (!data || data.length === 0) {
            return res.status(400).json({ error: { message: 'Excel file is empty or invalid' } });
        }

        const results = {
            successful: [],
            failed: [],
            total: data.length,
        };

        // Process each row
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            try {
                // Validate required fields
                const fullName = row['Full Name'] || row['fullName'] || row['name'];
                const email = row['Email'] || row['email'] || null;
                const baseSalary = Number(row['Basic Salary'] || row['baseSalary'] || 0);

                if (!fullName || baseSalary <= 0) {
                    results.failed.push({
                        row: i + 2, // Excel row number (1-indexed + header)
                        fullName: fullName || 'N/A',
                        email: email || '—',
                        error: 'Missing required fields (Full Name, Basic Salary)',
                    });
                    continue;
                }

                // Get optional fields
                const transportAllowance = Number(row['Transport Allowance'] || row['transportAllowance'] || 0);
                const housingAllowance = Number(row['Housing Allowance'] || row['housingAllowance'] || 0);
                const performanceAllowance = Number(row['Performance Allowance'] || row['performanceAllowance'] || 0);
                const variableAllowance = Number(row['Variable Allowance'] || row['variableAllowance'] || 0);
                const advanceAmount = Number(row['Advance Amount'] || row['advanceAmount'] || 0);

                // Check for per-employee RAMA insurance setting
                // If "Include RAMA" column exists, use it; otherwise use global setting
                let employeeIncludeMedical = includeMedical; // Default to global setting
                const ramaColumn = row['Include RAMA'] || row['includeRAMA'] || row['include_rama'];
                if (ramaColumn !== undefined && ramaColumn !== null && ramaColumn !== '') {
                    // Handle various formats: "Yes"/"No", "TRUE"/"FALSE", 1/0, true/false
                    const ramaValue = String(ramaColumn).toLowerCase().trim();
                    employeeIncludeMedical = ramaValue === 'yes' || ramaValue === 'true' || ramaValue === '1' || ramaValue === 'y';
                }

                // Get optional RSSB Number
                const rssbNumber = row['RSSB Number'] || row['rssbNumber'] || row['rssb_number'] || row['SSB NUMBER'] || row['RSSB'] || null;

                // Create or get employee
                let employee;
                try {
                    // Try to find by email + client first (exact match), then fall back to email only
                    let existingEmployee = null;
                    if (email) {
                        if (clientId != null) {
                            existingEmployee = await employeeRepo.findByEmailAndClient(email, clientId);
                        }
                        if (!existingEmployee) {
                            // No match for this client — don't reuse employees from other clients
                            existingEmployee = null;
                        }
                    }
                    if (existingEmployee) {
                        employee = existingEmployee;
                        // Update RSSB number if missing
                        const needsRssb = rssbNumber && !existingEmployee.rssb_number;
                        if (needsRssb) {
                            employee = await employeeRepo.update({
                                employeeId: existingEmployee.employee_id,
                                rssbNumber: String(rssbNumber).trim(),
                            });
                        }
                    } else {
                        employee = await employeeRepo.create({
                            fullName,
                            email: email || null,
                            role: 'Employee',
                            rssbNumber: rssbNumber ? String(rssbNumber).trim() : null,
                            clientId: clientId != null ? clientId : undefined,
                        });
                    }
                } catch (err) {
                    results.failed.push({
                        row: i + 2,
                        fullName,
                        email: email || '—',
                        error: `Failed to create/find employee: ${err.message}`,
                    });
                    continue;
                }

                // Calculate payroll with per-employee RAMA setting
                const payrollSnapshot = calculatePayroll({
                    baseSalary,
                    transportAllowance,
                    housingAllowance,
                    performanceAllowance,
                    variableAllowance,
                    advanceAmount,
                    frequency,
                    includeMedical: employeeIncludeMedical,
                });

                // Encrypt fields
                const encryptedFields = {
                    basicSalaryEnc: encryptField('basic_salary_enc', baseSalary),
                    transportAllowEnc: encryptField('transport_allow_enc', transportAllowance),
                    housingAllowEnc: encryptField('housing_allow_enc', housingAllowance),
                    variableAllowEnc: encryptField('variable_allow_enc', variableAllowance),
                    performanceAllowEnc: encryptField('performance_allow_enc', performanceAllowance),
                    netPaidEnc: encryptField('net_paid_enc', payrollSnapshot.netPaidToBank),
                };

                // Create salary record
                const salaryRecord = await salaryRepo.create({
                    employeeId: employee.employee_id,
                    payPeriod,
                    encryptedFields,
                    payrollSnapshot,
                    createdBy: req.user.id,
                });

                results.successful.push({
                    row: i + 2,
                    fullName,
                    email: email || '—',
                    salaryId: salaryRecord.salary_id,
                    netSalary: payrollSnapshot.netSalary,
                });
            } catch (err) {
                results.failed.push({
                    row: i + 2,
                    fullName: row['Full Name'] || row['fullName'] || 'N/A',
                    email: row['Email'] || row['email'] || '—',
                    error: err.message || 'Unknown error',
                });
            }
        }

        // Log audit
        await auditService.log({
            userId: req.user.id,
            actionType: 'BULK_UPLOAD_SALARIES',
            details: {
                total: results.total,
                successful: results.successful.length,
                failed: results.failed.length,
                payPeriod,
            },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            correlationId: req.id,
        });

        res.json({
            message: `Processed ${results.total} records. ${results.successful.length} successful, ${results.failed.length} failed.`,
            results,
        });

        // ── async: notify HR about the completed bulk upload ──────────
        const uploadedByName = req.user.fullName || req.user.email || 'Finance Officer';
        const formattedPeriod = new Date(payPeriod).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

        notificationService.notifyBulkUploadComplete({
            totalProcessed: results.total,
            successful: results.successful.length,
            failed: results.failed.length,
            payPeriod: formattedPeriod,
            uploadedByName,
        }).catch((e) => console.error('[bulkUploadSalaries] notifyBulkUploadComplete failed:', e));

    } catch (error) {
        next(error);
    }
};

/**
 * Generate and download all payslips for a bulk upload as a ZIP file
 * Payslips are organized into folders by month (e.g., "January 2024", "February 2024")
 */
export const downloadBulkPayslips = async (req, res, next) => {
    try {
        const { salaryIds } = req.body;

        if (!salaryIds || !Array.isArray(salaryIds) || salaryIds.length === 0) {
            return res.status(400).json({ error: { message: 'No salary IDs provided' } });
        }

        const zip = new JSZip();
        const errors = [];
        let successCount = 0;

        // Track folders by month to organize payslips
        const monthFolders = new Map();

        for (const salaryId of salaryIds) {
            try {
                const record = await salaryRepo.findByIdWithEmployee(salaryId);
                if (!record) {
                    errors.push({ salaryId, error: 'Record not found' });
                    continue;
                }

                // Decrypt compensation data — prefer payroll_snapshot_enc (matches salaryRepo storage)
                let decryptedComp = {
                    baseSalary: 0,
                    transportAllowance: 0,
                    housingAllowance: 0,
                    variableAllowance: 0,
                    performanceAllowance: 0,
                };
                let payrollSnapshot = null;

                if (record.payroll_snapshot_enc) {
                    try {
                        const raw = decryptField('payroll_snapshot_enc', record.payroll_snapshot_enc);
                        if (raw) {
                            const snap = JSON.parse(raw);
                            const sa = snap.allowances || snap;
                            decryptedComp.baseSalary = snap.basicSalary ?? snap.baseSalary ?? snap.base_salary ?? 0;
                            decryptedComp.transportAllowance = sa.transport ?? sa.transportAllowance ?? sa.transport_allowance ?? 0;
                            decryptedComp.housingAllowance = sa.housing ?? sa.housingAllowance ?? sa.housing_allowance ?? 0;
                            decryptedComp.performanceAllowance = sa.performance ?? sa.performanceAllowance ?? sa.performance_allowance ?? 0;
                            decryptedComp.variableAllowance = sa.variable ?? sa.variableAllowance ?? sa.variable_allowance ?? 0;
                            payrollSnapshot = snap;
                        }
                    } catch (e) {
                        console.warn(`[downloadBulkPayslips] payroll_snapshot_enc failed for salary ${salaryId}:`, e.message);
                    }
                }

                if (!payrollSnapshot) {
                    try {
                        decryptedComp.baseSalary = record.basic_salary_enc ? Number(decryptField('basic_salary_enc', record.basic_salary_enc)) : 0;
                        decryptedComp.transportAllowance = record.transport_allow_enc ? Number(decryptField('transport_allow_enc', record.transport_allow_enc)) : 0;
                        decryptedComp.housingAllowance = record.housing_allow_enc ? Number(decryptField('housing_allow_enc', record.housing_allow_enc)) : 0;
                        decryptedComp.variableAllowance = record.variable_allow_enc ? Number(decryptField('variable_allow_enc', record.variable_allow_enc)) : 0;
                        decryptedComp.performanceAllowance = record.performance_allow_enc ? Number(decryptField('performance_allow_enc', record.performance_allow_enc)) : 0;
                    } catch (e) {
                        console.warn(`[downloadBulkPayslips] individual field decryption failed for salary ${salaryId}:`, e.message);
                    }
                }

                // Fallback: use gross_salary if decryption yielded zero base
                if (decryptedComp.baseSalary === 0 && record.gross_salary > 0) {
                    decryptedComp.baseSalary = record.gross_salary;
                }

                payrollSnapshot = calculatePayroll({
                    ...decryptedComp,
                    advanceAmount: record.advance_amount || 0,
                    frequency: record.pay_frequency,
                    includeMedical: record.include_medical !== false,
                });

                // Override with authoritative stored net salary
                if (record.net_paid_enc) {
                    try {
                        const storedNet = Number(decryptField('net_paid_enc', record.net_paid_enc)) || 0;
                        if (storedNet > 0) {
                            payrollSnapshot.storedNetSalary = storedNet;
                            payrollSnapshot.netPaidToBank = storedNet;
                            payrollSnapshot.netSalary = storedNet;
                        }
                    } catch { /* fall through */ }
                }

                let bankAccountNumber = 'N/A';
                if (record.account_number_enc) {
                    try {
                        bankAccountNumber = decryptField('account_number_enc', record.account_number_enc);
                    } catch { /* ignore */ }
                }

                // Generate PDF
                const pdfBuffer = await generatePayslipPdf({
                    employee: {
                        fullName: record.full_name || 'N/A',
                        email: record.email,
                        bankName: record.bank_name || 'N/A',
                        accountNumber: bankAccountNumber,
                        accountHolderName: record.account_holder_name || record.full_name || 'N/A',
                        role: record.role || 'Employee',
                        department: record.department || 'N/A',
                        dateOfJoining: record.date_of_joining || record.employee_created_at || record.created_at,
                    },
                    salary: {
                        payPeriod: record.pay_period,
                        frequency: record.pay_frequency,
                        workedDays: 26,
                        ...decryptedComp,
                    },
                    payrollSnapshot,
                });

                // Create folder name based on pay period (e.g., "January 2024")
                const payPeriodDate = new Date(record.pay_period);
                const monthName = payPeriodDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

                // Get or create folder for this month
                if (!monthFolders.has(monthName)) {
                    monthFolders.set(monthName, zip.folder(monthName));
                }
                const monthFolder = monthFolders.get(monthName);

                const periodStr = record.pay_period
                    ? new Date(record.pay_period).toISOString().slice(0, 10)
                    : 'unknown';
                const safeName = (record.full_name || 'employee').replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
                const filename = `payslip-${safeName}-${periodStr}.pdf`;
                monthFolder.file(filename, pdfBuffer);
                successCount++;
            } catch (err) {
                console.error(`Failed to generate payslip for salary ID ${salaryId}:`, err);
                errors.push({ salaryId, error: err.message });
            }
        }

        // If no payslips were generated, return error
        if (successCount === 0) {
            return res.status(500).json({
                error: {
                    message: 'Failed to generate any payslips',
                    details: errors
                }
            });
        }

        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="payslips.zip"');
        res.send(zipBuffer);
    } catch (error) {
        next(error);
    }
};

/**
 * Send payslip emails to all employees from bulk upload
 */
export const sendBulkPayslipEmails = async (req, res, next) => {
    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
            return res.status(503).json({
                error: {
                    message: 'SMTP is not configured. Please add SMTP_USER and SMTP_PASSWORD to the backend .env file.',
                },
            });
        }

        // Verify SMTP connection before trying to send any emails
        try {
            const nodemailer = (await import('nodemailer')).default;
            const verifyTransport = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT || '587', 10),
                secure: process.env.SMTP_SECURE === 'true',
                auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
            });
            await verifyTransport.verify();
        } catch (smtpErr) {
            return res.status(503).json({
                error: {
                    message: `SMTP connection failed: ${smtpErr.message}. Check your SMTP_HOST, SMTP_USER and SMTP_PASSWORD settings.`,
                },
            });
        }

        const { salaryIds } = req.body;

        if (!salaryIds || !Array.isArray(salaryIds) || salaryIds.length === 0) {
            return res.status(400).json({ error: { message: 'No salary IDs provided' } });
        }

        const results = {
            successful: [],
            failed: [],
            total: salaryIds.length,
        };

        for (const salaryId of salaryIds) {
            try {
                const record = await salaryRepo.findByIdWithEmployee(salaryId);
                if (!record) {
                    results.failed.push({
                        salaryId,
                        error: 'Employee record not found',
                    });
                    continue;
                }

                // Skip employees without email
                if (!record.email) {
                    results.failed.push({
                        salaryId,
                        fullName: record.full_name,
                        error: 'No email address — payslip not sent',
                    });
                    continue;
                }

                // Decrypt compensation data — prefer payroll_snapshot_enc (same as downloadBulkPayslips)
                let decryptedComp = {
                    baseSalary: 0,
                    transportAllowance: 0,
                    housingAllowance: 0,
                    variableAllowance: 0,
                    performanceAllowance: 0,
                };
                if (record.payroll_snapshot_enc) {
                    try {
                        const raw = decryptField('payroll_snapshot_enc', record.payroll_snapshot_enc);
                        if (raw) {
                            const snap = JSON.parse(raw);
                            const sa = snap.allowances || snap;
                            decryptedComp.baseSalary = snap.basicSalary ?? snap.baseSalary ?? snap.base_salary ?? 0;
                            decryptedComp.transportAllowance = sa.transport ?? sa.transportAllowance ?? sa.transport_allowance ?? 0;
                            decryptedComp.housingAllowance = sa.housing ?? sa.housingAllowance ?? sa.housing_allowance ?? 0;
                            decryptedComp.performanceAllowance = sa.performance ?? sa.performanceAllowance ?? sa.performance_allowance ?? 0;
                            decryptedComp.variableAllowance = sa.variable ?? sa.variableAllowance ?? sa.variable_allowance ?? 0;
                        }
                    } catch (e) {
                        console.warn(`[sendBulkPayslipEmails] payroll_snapshot_enc failed for salary ${salaryId}:`, e.message);
                    }
                }
                if (decryptedComp.baseSalary === 0) {
                    try {
                        decryptedComp.baseSalary = record.basic_salary_enc ? Number(decryptField('basic_salary_enc', record.basic_salary_enc)) : 0;
                        decryptedComp.transportAllowance = record.transport_allow_enc ? Number(decryptField('transport_allow_enc', record.transport_allow_enc)) : 0;
                        decryptedComp.housingAllowance = record.housing_allow_enc ? Number(decryptField('housing_allow_enc', record.housing_allow_enc)) : 0;
                        decryptedComp.variableAllowance = record.variable_allow_enc ? Number(decryptField('variable_allow_enc', record.variable_allow_enc)) : 0;
                        decryptedComp.performanceAllowance = record.performance_allow_enc ? Number(decryptField('performance_allow_enc', record.performance_allow_enc)) : 0;
                    } catch (e) {
                        console.warn(`[sendBulkPayslipEmails] individual field decryption failed for salary ${salaryId}:`, e.message);
                    }
                }
                if (decryptedComp.baseSalary === 0 && record.gross_salary > 0) {
                    decryptedComp.baseSalary = record.gross_salary;
                }

                const payrollSnapshot = calculatePayroll({
                    ...decryptedComp,
                    advanceAmount: record.advance_amount || 0,
                    frequency: record.pay_frequency,
                    includeMedical: record.include_medical !== false,
                });

                // Override with authoritative stored net salary
                if (record.net_paid_enc) {
                    try {
                        const storedNet = Number(decryptField('net_paid_enc', record.net_paid_enc)) || 0;
                        if (storedNet > 0) {
                            payrollSnapshot.storedNetSalary = storedNet;
                            payrollSnapshot.netPaidToBank = storedNet;
                            payrollSnapshot.netSalary = storedNet;
                        }
                    } catch { /* fall through */ }
                }

                let bankAccountNumber = null;
                if (record.account_number_enc) {
                    try {
                        bankAccountNumber = decryptField('account_number_enc', record.account_number_enc);
                    } catch { /* ignore */ }
                }

                // Generate PDF
                const pdfBuffer = await generatePayslipPdf({
                    employee: {
                        fullName: record.full_name,
                        email: record.email,
                        bankName: record.bank_name,
                        accountNumber: bankAccountNumber,
                        accountHolderName: record.account_holder_name,
                        role: record.role,
                        department: record.department,
                        dateOfJoining: record.date_of_joining,
                    },
                    salary: {
                        payPeriod: record.pay_period,
                        frequency: record.pay_frequency,
                        workedDays: 26,
                        ...decryptedComp,
                    },
                    payrollSnapshot,
                });

                const periodStr = record.pay_period
                    ? new Date(record.pay_period).toISOString().slice(0, 10)
                    : 'unknown';
                const safeName = (record.full_name || 'employee').replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
                const filename = `payslip-${safeName}-${periodStr}.pdf`;

                // Calculate payment date
                const payDate = new Date(record.pay_period);
                payDate.setDate(payDate.getDate() + 2);
                const formattedPayDate = payDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                });
                const displayMonth = record.pay_period
                    ? new Date(record.pay_period).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                    : periodStr;
                const formattedNetSalary = new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(payrollSnapshot.netSalary);

                // Send email
                const emailResult = await sendPayslipEmail({
                    employeeEmail: record.email,
                    employeeName: record.full_name,
                    employeeId: record.employee_id,
                    payPeriod: displayMonth,
                    netSalary: formattedNetSalary,
                    payDate: formattedPayDate,
                    pdfBuffer,
                    filename,
                    companyName: process.env.SMTP_FROM_NAME || 'HC Solutions Payroll',
                    senderName: req.user?.email || 'Payroll Team',
                });

                if (!emailResult.success) {
                    throw new Error(emailResult.error || emailResult.reason || 'Failed to send email');
                }

                results.successful.push({
                    salaryId,
                    email: record.email,
                    fullName: record.full_name,
                });
            } catch (err) {
                results.failed.push({
                    salaryId,
                    error: err.message || 'Unknown error',
                });
            }
        }

        // Log audit
        await auditService.log({
            userId: req.user.id,
            actionType: 'BULK_SEND_PAYSLIP_EMAILS',
            details: {
                total: results.total,
                successful: results.successful.length,
                failed: results.failed.length,
            },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            correlationId: req.id,
        });

        // When ALL emails failed, return 503 so user sees the actual error (e.g. SMTP auth failed)
        if (results.failed.length === results.total && results.failed.length > 0) {
            const firstError = results.failed[0].error || 'Unknown error';
            return res.status(503).json({
                error: {
                    message: `All ${results.total} emails failed to send. First error: ${firstError}`,
                    results,
                },
            });
        }

        res.json({
            message: `Sent ${results.successful.length} of ${results.total} emails successfully.`,
            results,
        });
    } catch (error) {
        next(error);
    }
};
