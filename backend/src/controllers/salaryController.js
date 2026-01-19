import { z } from 'zod';
import { encryptField, decryptField } from '../services/encryptionService.js';
import { calculatePayroll } from '../services/payrollService.js';
import salaryRepo from '../repositories/salaryRepo.js';
import auditService from '../services/auditService.js';
import { notFound } from '../utils/httpError.js';
import { generatePayslipPdf } from '../services/payslipService.js';
import { sendSalaryProcessedEmail, sendPayslipEmail } from '../services/emailService.js';
import { generateMonthlyPayrollExcel } from '../services/excelService.js';

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

    // Prepare email preview data for frontend (don't auto-send)
    let emailPreviewData = null;
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

    return res.status(201).json({
      message: 'Salary record created successfully',
      data: salaryRecord,
      emailPreview: emailPreviewData, // Include email preview data
    });
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
    res.json({ data: report });
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
    // This ensures payslips show SOME data even if encryption is broken
    if (!decryptionSuccessful || decryptedComp.baseSalary === 0) {
      console.warn('⚠ WARNING: Decryption failed or returned zeros. Using fallback estimation.');
      console.warn('  This is a temporary workaround. The encrypted fields may be NULL in the database.');

      // Use gross salary as basic salary if we have nothing else
      // This is not ideal but better than showing all zeros
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
        workedDays: 26, // Default to 26, can be made configurable later
        ...decryptedComp,
      },
      payrollSnapshot,
    });

    // Optional: Send email if requested via query parameter
    const sendEmail = req.query.sendEmail === 'true';
    if (sendEmail && record.email) {
      const filename = `payslip-${record.full_name.replace(/\s+/g, '-').toLowerCase()}-${record.pay_period}.pdf`;

      // Calculate payment date
      const payDate = new Date(record.pay_period);
      payDate.setDate(payDate.getDate() + 2);
      const formattedPayDate = payDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      sendPayslipEmail({
        employeeEmail: record.email,
        employeeName: record.full_name,
        employeeId: record.employee_id,
        payPeriod: new Date(record.pay_period).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
        netSalary: new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(payrollSnapshot.netSalary),
        payDate: formattedPayDate,
        pdfBuffer,
        filename,
      }).catch((err) => console.error('Failed to send payslip email:', err));
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=\"payslip-${record.full_name.replace(/\s+/g, '-').toLowerCase()}-${record.pay_period
      }.pdf\"`,
    );
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

    // Decrypt existing values to use as defaults
    const existingValues = {
      baseSalary: existing.basic_salary_enc ? Number(decryptField('basic_salary_enc', existing.basic_salary_enc)) : 0,
      transportAllowance: existing.transport_allow_enc ? Number(decryptField('transport_allow_enc', existing.transport_allow_enc)) : 0,
      housingAllowance: existing.housing_allow_enc ? Number(decryptField('housing_allow_enc', existing.housing_allow_enc)) : 0,
      variableAllowance: existing.variable_allow_enc ? Number(decryptField('variable_allow_enc', existing.variable_allow_enc)) : 0,
      performanceAllowance: existing.performance_allow_enc ? Number(decryptField('performance_allow_enc', existing.performance_allow_enc)) : 0,
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

