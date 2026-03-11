import { z } from 'zod';
import config from '../config/env.js';
import { encryptField, decryptField } from '../services/encryptionService.js';
import { calculatePayroll } from '../services/payrollService.js';
import salaryRepo from '../repositories/salaryRepo.js';
import employeeRepo from '../repositories/employeeRepo.js';
import auditService from '../services/auditService.js';
import { notFound } from '../utils/httpError.js';
import { generatePayslipPdf } from '../services/payslipService.js';
import { sendSalaryProcessedEmail, sendFONotification } from '../services/emailService.js';
import { generateMonthlyPayrollExcel } from '../services/excelService.js';
import notificationService from '../services/notificationService.js';
import fileStorageService from '../services/fileStorageService.js';

const salarySchema = z.object({
  employeeId: z.coerce.number(),
  payPeriod: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  baseSalary: z.coerce.number(),
  variableAllowance: z.coerce.number().default(0),
  transportAllowance: z.coerce.number().default(0),
  housingAllowance: z.coerce.number().default(0),
  performanceAllowance: z.coerce.number().default(0),
  advanceAmount: z.coerce.number().default(0),
  frequency: z.enum(['monthly', 'weekly', 'daily']).default('monthly'),
  includeMedical: z.boolean().optional().default(true),
});

const salaryListParams = z.object({
  employeeId: z.coerce.number(),
});

const monthlyReportQuery = z.object({
  year: z.coerce.number().min(2000),
  month: z.coerce.number().min(1).max(12),
  frequency: z.enum(['all', 'monthly', 'weekly', 'daily']).optional(),
});

const salaryIdParams = z.object({
  salaryId: z.coerce.number(),
});

const hrReviewSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  comment: z.string().optional(),
});

const mdReviewSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  comment: z.string().optional(),
});

const bulkHrReviewSchema = z.object({
  year: z.coerce.number().min(2000),
  month: z.coerce.number().min(1).max(12),
  action: z.enum(['APPROVE', 'REJECT']),
  comment: z.string().optional(),
});

/**
 * POST /salaries/:salaryId/hr-review
 * HR approves or rejects a single computed salary.
 * Notifies the Finance Officer who computed it.
 */
export const hrReviewSalary = async (req, res, next) => {
  try {
    const { salaryId } = salaryIdParams.parse(req.params);
    const { action, comment } = hrReviewSchema.parse(req.body);

    const newStatus = action === 'APPROVE' ? 'HR_APPROVED' : 'HR_REJECTED';
    const reviewedBy = req.user.id;
    const reviewerName = req.user.email || 'HR';

    const updated = await salaryRepo.hrReview({ salaryId, status: newStatus, comment, reviewedBy });
    if (!updated) throw new Error('Salary record not found');

    // Look up the Finance Officer who created this salary
    const creator = await salaryRepo.getCreatedBy(salaryId);
    const record = await salaryRepo.findByIdWithEmployee(salaryId);

    if (creator?.employee_id) {
      // In-app notification
      await notificationService.notifyFOSalaryReviewed({
        foUserId: creator.employee_id,
        employeeName: record?.full_name || 'Employee',
        payPeriod: updated.pay_period,
        status: newStatus,
        comment,
        reviewedByName: reviewerName,
      });

      // Email notification
      const appUrl = config.appUrl;
      await sendFONotification({
        foEmail: creator.email,
        foName: creator.full_name,
        period: new Date(updated.pay_period).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
        status: newStatus,
        count: 1,
        reviewedBy: reviewerName,
        comment,
        actionUrl: `${appUrl}/hr-review`,
      });
    }

    res.json({ success: true, salary: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /salaries/:salaryId/md-review
 * MD approves or rejects a single HR-approved salary.
 */
export const mdReviewSalary = async (req, res, next) => {
  try {
    const { salaryId } = salaryIdParams.parse(req.params);
    const { action, comment } = mdReviewSchema.parse(req.body);

    const newStatus = action === 'APPROVE' ? 'MD_APPROVED' : 'MD_REJECTED';
    const reviewedBy = req.user.id;

    const updated = await salaryRepo.mdReview({ salaryId, status: newStatus, comment, reviewedBy });
    if (!updated) throw notFound('Salary record not found or not yet HR-approved');

    res.json({ success: true, salary: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /salaries/hr-review/bulk
 * HR approves (or rejects) all PENDING salary records for a given month/year.
 * Notifies each Finance Officer who computed records in that period.
 */
export const bulkHrReviewSalaries = async (req, res, next) => {
  try {
    const { year, month, action, comment } = bulkHrReviewSchema.parse(req.body);

    const newStatus = action === 'APPROVE' ? 'HR_APPROVED' : 'HR_REJECTED';
    const reviewedBy = req.user.id;
    const reviewerName = req.user.email || 'HR';

    const updated = await salaryRepo.bulkHrReview({ year, month, status: newStatus, comment, reviewedBy });

    if (updated.length > 0) {
      // Notify each unique FO who computed any of these records
      const foIds = [...new Set(updated.map(r => r.created_by).filter(Boolean))];
      const periodLabel = new Date(year, month - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

      // In-app notifications
      await notificationService.notifyFOBulkReviewed({
        foUserIds: foIds,
        period: periodLabel,
        count: updated.length,
        reviewedByName: reviewerName,
      });

      // Email notifications to all unique FOs
      if (foIds.length > 0) {
        const fos = await employeeRepo.findByIds(foIds);
        const appUrl = config.appUrl;
        const emailPromises = fos.map(fo => sendFONotification({
          foEmail: fo.email,
          foName: fo.full_name,
          period: periodLabel,
          status: newStatus,
          count: updated.filter(r => r.created_by === fo.employee_id).length,
          reviewedBy: reviewerName,
          comment,
          actionUrl: `${appUrl}/hr-review`,
        }));
        await Promise.allSettled(emailPromises);
      }
    }

    res.json({ success: true, updatedCount: updated.length, records: updated });
  } catch (error) {
    next(error);
  }
};

export const createSalary = async (req, res, next) => {
  try {
    const payload = salarySchema.parse(req.body);
    const payrollSnapshot = calculatePayroll({
      ...payload,
      includeMedical: payload.includeMedical !== false,
    });

    const encryptedFields = {
      basicSalaryEnc: encryptField('basic_salary_enc', payload.baseSalary),
      transportAllowEnc: encryptField('transport_allow_enc', payload.transportAllowance),
      housingAllowEnc: encryptField('housing_allow_enc', payload.housingAllowance),
      variableAllowEnc: encryptField('variable_allow_enc', payload.variableAllowance),
      performanceAllowEnc: encryptField('performance_allow_enc', payload.performanceAllowance),
      netPaidEnc: encryptField('net_paid_enc', payrollSnapshot.netPaidToBank),
    };

    const salaryRecord = await salaryRepo.create({
      employeeId: payload.employeeId,
      payPeriod: payload.payPeriod,
      encryptedFields,
      payrollSnapshot,
      createdBy: req.user.id,
    });

    await auditService.log({
      userId: req.user.id,
      actionType: 'CREATE_SALARY',
      details: { salaryId: salaryRecord.salary_id },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      correlationId: req.id,
    });

    // Prepare email preview data for frontend when env allows (EMPLOYEE_FORM_EMAIL_PREVIEW=true)
    let emailPreviewData = null;
    if (config.employeeFormEmailPreview) {
      const employeeData = await salaryRepo.findByIdWithEmployee(salaryRecord.salary_id);
      if (employeeData && employeeData.email_notifications_enabled !== false) {
        const formattedPayPeriod = new Date(payload.payPeriod).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        const formattedNetSalary = new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(payrollSnapshot.netSalary);

        const payDate = new Date(payload.payPeriod);
        payDate.setDate(payDate.getDate() + 2);
        const formattedPayDate = payDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        emailPreviewData = {
          employeeEmail: employeeData.email,
          employeeName: employeeData.full_name,
          employeeId: employeeData.employee_id,
          payPeriod: formattedPayPeriod,
          netSalary: formattedNetSalary,
          payDate: formattedPayDate,
          pdfFilename: `payslip-${employeeData.full_name.replace(/\s+/g, '-').toLowerCase()}-${payload.payPeriod}.pdf`,
        };
      }
    }

    // Respond immediately — notifications fire async
    res.status(201).json({
      message: 'Salary record created successfully',
      data: salaryRecord,
      emailPreview: emailPreviewData,
    });

    // ── async: notify HR that a salary was computed ──────────────────
    const computedByName = req.user.fullName || req.user.email || 'Finance Officer';
    const employeeInfo = emailPreviewData
      ? { name: emailPreviewData.employeeName, period: emailPreviewData.payPeriod }
      : { name: `Employee #${payload.employeeId}`, period: payload.payPeriod };

    notificationService.notifySalaryComputed({
      employeeName: employeeInfo.name,
      payPeriod: employeeInfo.period,
      salaryId: salaryRecord.salary_id,
      computedByName,
    }).catch((e) => console.error('[createSalary] notifySalaryComputed failed:', e));

  } catch (error) {
    next(error);
  }
};

export const previewSalary = async (req, res, next) => {
  try {
    const payload = salarySchema
      .omit({ employeeId: true, payPeriod: true })
      .parse(req.body);
    const result = calculatePayroll(payload);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getSalary = async (req, res, next) => {
  try {
    const { salaryId } = salaryIdParams.parse(req.params);
    const record = await salaryRepo.findByIdWithEmployee(salaryId);

    if (!record) {
      throw notFound('Salary record not found');
    }

    res.json(record);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /salaries/:salaryId/detail
 * Returns a fully-decrypted salary breakdown for HR review.
 * Strategy:
 *   1. Try to decrypt individual encrypted columns.
 *   2. Fall back to payroll_snapshot_enc blob (always present, used by payslip PDF).
 * Accessible to HR, Admin, FinanceOfficer.
 */
export const getSalaryDetail = async (req, res, next) => {
  try {
    const { salaryId } = salaryIdParams.parse(req.params);
    const record = await salaryRepo.findByIdWithEmployee(salaryId);

    if (!record) {
      throw notFound('Salary record not found');
    }

    // ── Helper: decrypt one field gracefully ──────────────────
    const safeDecrypt = (col, val) => {
      if (!val) return null;
      try { return Number(decryptField(col, val)) || 0; } catch { return null; }
    };

    // Initialize variables as null
    let baseSalary = null;
    let transportAllowance = null;
    let housingAllowance = null;
    let variableAllowance = null;
    let performanceAllowance = null;
    let netPaid = null;

    // ── Primary Source: payroll_snapshot_enc ─────────────────
    // This blob contains all computed values and is the most reliable source.
    if (record.payroll_snapshot_enc) {
      try {
        const raw = decryptField('payroll_snapshot_enc', record.payroll_snapshot_enc);
        if (raw) {
          const snap = JSON.parse(raw);
          const sa = snap.allowances || snap;

          baseSalary = snap.basicSalary ?? snap.baseSalary ?? snap.base_salary;
          transportAllowance = sa.transport ?? sa.transportAllowance ?? sa.transport_allowance;
          housingAllowance = sa.housing ?? sa.housingAllowance ?? sa.housing_allowance;
          variableAllowance = sa.variable ?? sa.variableAllowance ?? sa.variable_allowance;
          performanceAllowance = sa.performance ?? sa.performanceAllowance ?? sa.performance_allowance;
          netPaid = snap.netPaidToBank ?? snap.netSalary ?? snap.net_salary;

          console.log(`[getSalaryDetail] Data loaded from snapshot for salary ${salaryId}`);
        }
      } catch (err) {
        console.warn(`[getSalaryDetail] Snapshot fallback error for ${salaryId}:`, err.message);
      }
    }

    // ── Fallback: individual encrypted columns ────────────────
    // Only used if snapshot was missing or didn't contain specific fields.
    if (baseSalary === null || baseSalary === undefined) {
      baseSalary = safeDecrypt('basic_salary_enc', record.basic_salary_enc);
    }
    if (transportAllowance === null || transportAllowance === undefined) {
      transportAllowance = safeDecrypt('transport_allow_enc', record.transport_allow_enc);
    }
    if (housingAllowance === null || housingAllowance === undefined) {
      housingAllowance = safeDecrypt('housing_allow_enc', record.housing_allow_enc);
    }
    if (variableAllowance === null || variableAllowance === undefined) {
      variableAllowance = safeDecrypt('variable_allow_enc', record.variable_allow_enc);
    }
    if (performanceAllowance === null || performanceAllowance === undefined) {
      performanceAllowance = safeDecrypt('performance_allow_enc', record.performance_allow_enc);
    }
    if (netPaid === null || netPaid === undefined) {
      netPaid = safeDecrypt('net_paid_enc', record.net_paid_enc);
    }

    res.json({
      salary_id: record.salary_id,
      pay_period: record.pay_period,
      pay_frequency: record.pay_frequency,
      // Employee
      employee_id: record.employee_id,
      full_name: record.full_name,
      email: record.email,
      // Earnings (decrypted)
      base_salary: baseSalary,
      transport_allowance: transportAllowance,
      housing_allowance: housingAllowance,
      variable_allowance: variableAllowance,
      performance_allowance: performanceAllowance,
      advance_amount: record.advance_amount || 0,
      // Computed plain columns
      gross_salary: Number(record.gross_salary) || 0,
      paye: Number(record.paye) || 0,
      rssb_pension: Number(record.rssb_pension) || 0,
      rssb_maternity: Number(record.rssb_maternity) || 0,
      rama_insurance: Number(record.rama_insurance) || 0,
      total_employer_contrib: Number(record.total_employer_contrib) || 0,
      net_salary: netPaid,
      // HR annotation fields
      hr_comment: record.hr_comment || null,
      hr_reviewed_at: record.hr_reviewed_at || null,
      hr_status: record.hr_status || 'PENDING',
    });
  } catch (error) {
    next(error);
  }
};


export const listSalariesByEmployee = async (req, res, next) => {
  try {
    const { employeeId } = salaryListParams.parse(req.params);
    const salaries = await salaryRepo.listByEmployee(employeeId);
    res.json({ data: salaries });
  } catch (error) {
    next(error);
  }
};

export const getMonthlyReport = async (req, res, next) => {
  try {
    const now = new Date();
    const defaultParams = { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
    const params = monthlyReportQuery.parse({
      year: req.query.year ?? defaultParams.year,
      month: req.query.month ?? defaultParams.month,
      frequency: req.query.frequency ?? 'all',
    });
    const report = await salaryRepo.monthlyReport(params);

    // Decrypt net_paid_enc per row — catch decryption failures gracefully
    // so a single corrupt record doesn't crash the whole report.
    const decryptedReport = report.map(row => {
      let net_salary = null;

      // Try primary source
      if (row.net_paid_enc) {
        try {
          net_salary = decryptField('net_paid_enc', row.net_paid_enc);
        } catch {
          net_salary = null;
        }
      }

      // Try fallback source: payroll_snapshot_enc
      if ((net_salary === null || net_salary === undefined) && row.payroll_snapshot_enc) {
        try {
          const raw = decryptField('payroll_snapshot_enc', row.payroll_snapshot_enc);
          if (raw) {
            const snap = JSON.parse(raw);
            net_salary = snap.netPaidToBank ?? snap.netSalary ?? snap.net_salary ?? null;
          }
        } catch (err) {
          console.warn(`[getMonthlyReport] Snapshot fallback failed for ${row.salary_id}`);
        }
      }

      return { ...row, net_salary };
    });

    res.json({ data: decryptedReport });
  } catch (error) {
    next(error);
  }
};

export const listRecentSalaries = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const rows = await salaryRepo.listRecent(limit);
    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
};

export const downloadPayslip = async (req, res, next) => {
  try {
    const { salaryId } = salaryIdParams.parse(req.params);
    const record = await salaryRepo.findByIdWithEmployee(salaryId);

    if (!record) {
      throw notFound('Salary record not found');
    }

    console.log('=== PAYSLIP DOWNLOAD DEBUG ===');
    console.log('Record found:', {
      salary_id: record.salary_id,
      employee_id: record.employee_id,
      pay_period: record.pay_period,
      gross_salary: record.gross_salary,
      paye: record.paye,
      net_paid: record.net_paid,
      basic_enc_exists: !!record.basic_salary_enc,
      transport_enc_exists: !!record.transport_allow_enc,
      housing_enc_exists: !!record.housing_allow_enc,
      performance_enc_exists: !!record.performance_allow_enc,
    });

    // Try to decrypt compensation data
    let decryptedComp = {
      baseSalary: 0,
      transportAllowance: 0,
      housingAllowance: 0,
      variableAllowance: 0,
      performanceAllowance: 0,
    };

    let decryptionSuccessful = false;

    // Attempt decryption
    if (record.basic_salary_enc) {
      try {
        decryptedComp.baseSalary = Number(decryptField('basic_salary_enc', record.basic_salary_enc)) || 0;
        if (decryptedComp.baseSalary > 0) decryptionSuccessful = true;
        console.log('✓ Decrypted basic_salary:', decryptedComp.baseSalary);
      } catch (err) {
        console.error('✗ Failed to decrypt basic_salary_enc:', err.message);
      }
    } else {
      console.warn('⚠ basic_salary_enc is NULL in database');
    }

    if (record.transport_allow_enc) {
      try {
        decryptedComp.transportAllowance = Number(decryptField('transport_allow_enc', record.transport_allow_enc)) || 0;
        console.log('✓ Decrypted transport_allowance:', decryptedComp.transportAllowance);
      } catch (err) {
        console.error('✗ Failed to decrypt transport_allow_enc:', err.message);
      }
    }

    if (record.housing_allow_enc) {
      try {
        decryptedComp.housingAllowance = Number(decryptField('housing_allow_enc', record.housing_allow_enc)) || 0;
        console.log('✓ Decrypted housing_allowance:', decryptedComp.housingAllowance);
      } catch (err) {
        console.error('✗ Failed to decrypt housing_allow_enc:', err.message);
      }
    }

    if (record.variable_allow_enc) {
      try {
        decryptedComp.variableAllowance = Number(decryptField('variable_allow_enc', record.variable_allow_enc)) || 0;
        console.log('✓ Decrypted variable_allowance:', decryptedComp.variableAllowance);
      } catch (err) {
        console.error('✗ Failed to decrypt variable_allow_enc:', err.message);
      }
    }

    if (record.performance_allow_enc) {
      try {
        decryptedComp.performanceAllowance = Number(decryptField('performance_allow_enc', record.performance_allow_enc)) || 0;
        console.log('✓ Decrypted performance_allowance:', decryptedComp.performanceAllowance);
      } catch (err) {
        console.error('✗ Failed to decrypt performance_allow_enc:', err.message);
      }
    }

    console.log('Decryption successful:', decryptionSuccessful);
    console.log('Decrypted compensation:', decryptedComp);

    // FALLBACK: If decryption failed completely, estimate from gross salary
    if (!decryptionSuccessful || decryptedComp.baseSalary === 0) {
      console.warn('⚠ WARNING: Decryption failed or returned zeros. Using fallback estimation.');
      console.warn('  This is a temporary workaround. The encrypted fields may be NULL in the database.');

      if (record.gross_salary && record.gross_salary > 0) {
        decryptedComp.baseSalary = record.gross_salary;
        console.warn(`  Using gross_salary (${record.gross_salary}) as basic_salary`);
      }
    }

    // Calculate payroll snapshot from decrypted values
    const payrollSnapshot = calculatePayroll({
      ...decryptedComp,
      advanceAmount: record.advance_amount || 0,
      frequency: record.pay_frequency,
      includeMedical: record.include_medical !== false,
    });

    console.log('Calculated payroll snapshot:', {
      grossSalary: payrollSnapshot.grossSalary,
      netSalary: payrollSnapshot.netSalary,
      paye: payrollSnapshot.paye,
    });

    // Decrypt bank account number if available
    let bankAccountNumber = null;
    if (record.account_number_enc) {
      try {
        bankAccountNumber = decryptField('account_number_enc', record.account_number_enc);
      } catch (err) {
        console.error('Failed to decrypt bank account number:', err.message);
      }
    }

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

    // Save to filesystem (organized by months) — use safe filename (no colons/spaces for Windows)
    const periodStr = record.pay_period ? new Date(record.pay_period).toISOString().slice(0, 10) : 'unknown';
    const safeName = (record.full_name || 'employee').replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
    const filename = `payslip-${safeName}-${periodStr}.pdf`;
    await fileStorageService.savePayslip(pdfBuffer, filename, record.pay_period);

    // Payslip emails are now sent only after all approvals and after send-to-bank, not here.

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

export const exportMonthlyReportToExcel = async (req, res, next) => {
  try {
    const now = new Date();
    const defaultParams = { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
    const params = monthlyReportQuery.parse({
      year: req.query.year ?? defaultParams.year,
      month: req.query.month ?? defaultParams.month,
      frequency: req.query.frequency ?? 'all',
    });

    const report = await salaryRepo.monthlyReport(params);

    if (!report || report.length === 0) {
      return res.status(404).json({ error: { message: 'No payroll data found for this period' } });
    }

    const excelBuffer = await generateMonthlyPayrollExcel({
      data: report,
      year: params.year,
      month: params.month,
    });

    const filename = `payroll-report-${params.year}-${String(params.month).padStart(2, '0')}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

// Download all payslips for a month as a ZIP
export const downloadMonthPayslips = async (req, res, next) => {
  try {
    const { year, month } = monthlyReportQuery.parse({
      year: req.query.year,
      month: req.query.month,
    });

    const fs = (await import('fs/promises'));
    const path = (await import('path')).default;
    const dayjs = (await import('dayjs')).default;

    // 1. Get all records for this period
    const records = await salaryRepo.findByPeriodWithEmployee({ year, month });

    console.log(`[downloadMonthPayslips] Found ${records?.length || 0} records for ${year}-${month}`);

    if (!records || records.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No salary records found for ${year}-${String(month).padStart(2, '0')}.`,
      });
    }

    // 2. Ensuring all payslips exist in storage
    const yearStr = year.toString();
    const monthStr = month.toString().padStart(2, '0');

    for (const record of records) {
      // Consistent date formatting for filenames (Windows-safe: no colons, special chars)
      const periodDate = dayjs(record.pay_period).format('YYYY-MM-DD');
      const safeName = (record.full_name || 'employee').replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
      const filename = `payslip-${safeName}-${periodDate}.pdf`;

      const filePath = path.join(fileStorageService.payslipsDir, yearStr, monthStr, filename);

      try {
        await fs.access(filePath);
      } catch {
        // File doesn't exist, generate it from the snapshot
        console.log(`[downloadMonthPayslips] Generating missing payslip for: ${record.full_name}`);

        let decryptedComp = {
          baseSalary: 0,
          transportAllowance: 0,
          housingAllowance: 0,
          variableAllowance: 0,
          performanceAllowance: 0,
        };

        // Decryption Logic
        let snap = null;
        if (record.payroll_snapshot_enc) {
          try {
            const raw = decryptField('payroll_snapshot_enc', record.payroll_snapshot_enc);
            if (raw) snap = JSON.parse(raw);
          } catch (e) {
            console.error(`[downloadMonthPayslips] Snap decryption failed for ${record.full_name}:`, e.message);
          }
        }

        if (snap) {
          const sa = snap.allowances || snap;
          decryptedComp.baseSalary = snap.basicSalary ?? snap.baseSalary ?? snap.base_salary ?? 0;
          decryptedComp.transportAllowance = sa.transport ?? sa.transportAllowance ?? sa.transport_allowance ?? 0;
          decryptedComp.housingAllowance = sa.housing ?? sa.housingAllowance ?? sa.housing_allowance ?? 0;
          decryptedComp.performanceAllowance = sa.performance ?? sa.performanceAllowance ?? sa.performance_allowance ?? 0;
          decryptedComp.variableAllowance = sa.variable ?? sa.variableAllowance ?? sa.variable_allowance ?? 0;
        } else {
          // Fallback to individual encrypted columns
          try { decryptedComp.baseSalary = Number(decryptField('basic_salary_enc', record.basic_salary_enc)) || 0; } catch { }
          try { decryptedComp.transportAllowance = Number(decryptField('transport_allow_enc', record.transport_allow_enc)) || 0; } catch { }
          try { decryptedComp.housingAllowance = Number(decryptField('housing_allow_enc', record.housing_allow_enc)) || 0; } catch { }
          try { decryptedComp.variableAllowance = Number(decryptField('variable_allow_enc', record.variable_allow_enc)) || 0; } catch { }
          try { decryptedComp.performanceAllowance = Number(decryptField('performance_allow_enc', record.performance_allow_enc)) || 0; } catch { }
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

        let bankAccountNumber = null;
        if (record.account_number_enc) {
          try { bankAccountNumber = decryptField('account_number_enc', record.account_number_enc); } catch { }
        }

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

        await fileStorageService.savePayslip(pdfBuffer, filename, record.pay_period);
      }
    }

    // 3. Generate the ZIP
    console.log(`[downloadMonthPayslips] Packing ZIP for ${yearStr}/${monthStr}`);
    const zipBuffer = await fileStorageService.generateMonthZip(yearStr, monthStr);

    if (!zipBuffer) {
      console.error(`[downloadMonthPayslips] ZIP generation returned null for ${yearStr}/${monthStr}`);
      return res.status(404).json({
        success: false,
        message: `No files found to ZIP for ${yearStr}-${monthStr}.`,
      });
    }

    const filenameBase = `payslips-${year}-${monthStr}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}"`);
    res.send(zipBuffer);
  } catch (error) {
    console.error('[downloadMonthPayslips] Fatal Error:', error);
    next(error);
  }
};

// Submit a whole month for HR review (Finance Officer confirmation step)
export const submitMonthForReview = async (req, res, next) => {
  try {
    const { year, month } = req.body;
    if (!year || !month) return res.status(400).json({ message: 'Year and month are required' });

    const records = await salaryRepo.monthlyReport({ year, month });
    if (records.length === 0) {
      return res.status(404).json({ message: 'No records found to submit for this month' });
    }

    // Check if any are rejected
    const rejected = records.filter(r => r.hr_status === 'HR_REJECTED');
    if (rejected.length > 0) {
      return res.status(400).json({
        message: 'Cannot submit. Some records were rejected by HR and must be corrected first.',
        rejectedCount: rejected.length
      });
    }

    // Log the submission
    await auditService.log({
      userId: req.user.id,
      actionType: 'SUBMIT_MONTH_TO_HR',
      details: { year, month, recordCount: records.length },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Notify HR
    try {
      await sendFONotification('HR', {
        title: 'Payroll Month Ready for Review',
        body: `Finance has confirmed the payroll for ${year}/${month} is ready for HR review.`
      });
    } catch (e) {
      console.warn('Notification failed but month was submitted', e.message);
    }

    res.json({ success: true, message: 'Monthly payroll submitted for HR review' });
  } catch (err) {
    next(err);
  }
};

const updateSalarySchema = z.object({
  baseSalary: z.coerce.number().optional(),
  variableAllowance: z.coerce.number().optional(),
  transportAllowance: z.coerce.number().optional(),
  housingAllowance: z.coerce.number().optional(),
  performanceAllowance: z.coerce.number().optional(),
  advanceAmount: z.coerce.number().optional(),
  frequency: z.enum(['monthly', 'weekly', 'daily']).optional(),
  includeMedical: z.boolean().optional(),
});

export const updateSalary = async (req, res, next) => {
  try {
    const { salaryId } = salaryIdParams.parse(req.params);
    const payload = updateSalarySchema.parse(req.body);

    // Get existing record to merge with updates
    const existing = await salaryRepo.findByIdWithEmployee(salaryId);
    if (!existing) {
      throw notFound('Salary record not found');
    }

    // Decrypt existing values to use as defaults (graceful fallback if decryption fails)
    const safeDecrypt = (col, val) => {
      if (!val) return 0;
      try {
        return Number(decryptField(col, val)) || 0;
      } catch (e) {
        console.warn(`[updateSalary] Decrypt failed for ${col}:`, e.message);
        return 0;
      }
    };
    let baseSalary = existing.basic_salary_enc ? safeDecrypt('basic_salary_enc', existing.basic_salary_enc) : 0;
    const transportAllowance = existing.transport_allow_enc ? safeDecrypt('transport_allow_enc', existing.transport_allow_enc) : 0;
    const housingAllowance = existing.housing_allow_enc ? safeDecrypt('housing_allow_enc', existing.housing_allow_enc) : 0;
    const variableAllowance = existing.variable_allow_enc ? safeDecrypt('variable_allow_enc', existing.variable_allow_enc) : 0;
    const performanceAllowance = existing.performance_allow_enc ? safeDecrypt('performance_allow_enc', existing.performance_allow_enc) : 0;
    if (baseSalary === 0 && existing.gross_salary > 0) {
      baseSalary = existing.gross_salary;
    }
    const existingValues = {
      baseSalary,
      transportAllowance,
      housingAllowance,
      variableAllowance,
      performanceAllowance,
    };

    // Merge with updates
    const mergedPayload = {
      baseSalary: payload.baseSalary ?? existingValues.baseSalary,
      transportAllowance: payload.transportAllowance ?? existingValues.transportAllowance,
      housingAllowance: payload.housingAllowance ?? existingValues.housingAllowance,
      variableAllowance: payload.variableAllowance ?? existingValues.variableAllowance,
      performanceAllowance: payload.performanceAllowance ?? existingValues.performanceAllowance,
      advanceAmount: payload.advanceAmount ?? existing.advance_amount ?? 0,
      frequency: payload.frequency ?? existing.pay_frequency,
      includeMedical: payload.includeMedical ?? existing.include_medical ?? true,
    };

    // Recalculate payroll
    const payrollSnapshot = calculatePayroll(mergedPayload);

    // Re-encrypt all fields
    const encryptedFields = {
      basicSalaryEnc: encryptField('basic_salary_enc', mergedPayload.baseSalary),
      transportAllowEnc: encryptField('transport_allow_enc', mergedPayload.transportAllowance),
      housingAllowEnc: encryptField('housing_allow_enc', mergedPayload.housingAllowance),
      variableAllowEnc: encryptField('variable_allow_enc', mergedPayload.variableAllowance),
      performanceAllowEnc: encryptField('performance_allow_enc', mergedPayload.performanceAllowance),
      netPaidEnc: encryptField('net_paid_enc', payrollSnapshot.netPaidToBank),
    };

    const updatedRecord = await salaryRepo.update({
      salaryId,
      encryptedFields,
      payrollSnapshot,
    });

    await auditService.log({
      userId: req.user.id,
      actionType: 'UPDATE_SALARY',
      details: { salaryId, changes: payload },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      correlationId: req.id,
    });

    res.json({ salary: updatedRecord, payrollSnapshot });
  } catch (error) {
    next(error);
  }
};

export const deleteSalary = async (req, res, next) => {
  try {
    const { salaryId } = salaryIdParams.parse(req.params);

    const deletedSalary = await salaryRepo.delete(salaryId);

    if (!deletedSalary) {
      throw notFound('Salary record not found');
    }

    await auditService.log({
      userId: req.user.id,
      actionType: 'DELETE_SALARY',
      details: { salaryId, employeeId: deletedSalary.employee_id, payPeriod: deletedSalary.pay_period },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      correlationId: req.id,
    });

    res.json({ message: 'Salary record deleted successfully', salary: deletedSalary });
  } catch (error) {
    next(error);
  }
};

export const resetPeriod = async (req, res, next) => {
  try {
    const params = monthlyReportQuery.parse({
      year: req.query.year,
      month: req.query.month,
      frequency: req.query.frequency ?? 'all',
    });

    const deletedRecords = await salaryRepo.deletePeriod(params);

    await auditService.log({
      userId: req.user.id,
      actionType: 'RESET_PERIOD',
      details: {
        year: params.year,
        month: params.month,
        frequency: params.frequency,
        deletedCount: deletedRecords.length
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      correlationId: req.id,
    });

    res.json({
      message: `Successfully deleted ${deletedRecords.length} salary record(s) for ${params.year}-${String(params.month).padStart(2, '0')}`,
      deletedCount: deletedRecords.length,
      deletedRecords
    });
  } catch (error) {
    next(error);
  }
};
