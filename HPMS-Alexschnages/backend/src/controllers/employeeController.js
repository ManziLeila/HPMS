import { z } from 'zod';
import { encryptField } from '../services/encryptionService.js';
import auditService from '../services/auditService.js';
import userService from '../services/userService.js';
import notificationService from '../services/notificationService.js';
import { sendWelcomeEmail } from '../services/emailService.js';
import { badRequest } from '../utils/httpError.js';

const createEmployeeSchema = z.object({
  fullName: z.string().min(3),
  email: z.string().email().optional().or(z.literal('')).transform(v => v || null),
  role: z.enum(['Employee']).default('Employee'),
  bankAccountNumber: z.string().min(6).optional(),
  temporaryPassword: z.string().min(10).optional(),
  rssbNumber: z.string().max(20).optional(),
  clientId: z.coerce.number().int().positive().optional().nullable(),
  phoneNumber: z.string().max(50).optional().nullable().transform(v => v || null),
  bankName: z.string().max(200).optional().nullable().transform(v => v || null),
  accountHolderName: z.string().max(200).optional().nullable().transform(v => v || null),
});

export const createEmployee = async (req, res, next) => {
  try {
    const payload = createEmployeeSchema.parse(req.body);

    // Only encrypt bank account if provided
    const encryptedBank = payload.bankAccountNumber
      ? encryptField('bank_account_enc', payload.bankAccountNumber)
      : null;

    // Use temporary password if provided, otherwise generate a default one
    const password = payload.temporaryPassword || `Temp${Date.now()}!`;

    const newEmployee = await userService.createEmployee({
      fullName: payload.fullName,
      email: payload.email,
      password: password,
      bankAccountEnc: encryptedBank,
      role: payload.role,
      rssbNumber: payload.rssbNumber,
      clientId: payload.clientId ?? undefined,
      phoneNumber: payload.phoneNumber,
      bankName: payload.bankName,
      accountHolderName: payload.accountHolderName,
    });

    await auditService.log({
      userId: req.user.id,
      actionType: 'CREATE_EMPLOYEE',
      details: { employeeId: newEmployee.employee_id },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      correlationId: req.id,
    });

    // Respond immediately — notifications fire async
    res.status(201).json(newEmployee);

    // ── async side-effects (don't block the response) ──────────
    const createdByName = req.user.fullName || req.user.email || 'A staff member';

    // In-app notification to HR + Admin, welcome ping to new employee
    notificationService.notifyNewEmployee({
      newEmployee,
      createdByName,
    }).catch((e) => console.error('notifyNewEmployee failed:', e));

    // Welcome email with temporary password (only if employee has email)
    if (newEmployee.email) {
      sendWelcomeEmail({
        employeeEmail: newEmployee.email,
        employeeName: newEmployee.full_name,
        temporaryPassword: password,
        role: newEmployee.role,
      }).catch((e) => console.error('sendWelcomeEmail failed:', e));
    }
  } catch (error) {
    next(error);
  }
};

export const listEmployees = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 25;
    const offset = Number(req.query.offset) || 0;
    const employees = await userService.listEmployees({ limit, offset });
    res.json({ data: employees, pagination: { limit, offset } });
  } catch (error) {
    next(error);
  }
};

export const listEmployeesByClient = async (req, res, next) => {
  try {
    const clientId = Number(req.params.clientId);
    const limit = Number(req.query.limit) || 25;
    const offset = Number(req.query.offset) || 0;
    const employees = await userService.listEmployeesByClient(clientId, { limit, offset });
    res.json({ data: employees, pagination: { limit, offset } });
  } catch (error) {
    next(error);
  }
};

const employeeIdSchema = z.object({
  employeeId: z.coerce.number(),
});

export const getEmployee = async (req, res, next) => {
  try {
    const { employeeId } = employeeIdSchema.parse(req.params);
    const employee = await userService.getEmployeeById(employeeId);

    if (!employee) {
      return res.status(404).json({ error: { message: 'Employee not found' } });
    }

    res.json(employee);
  } catch (error) {
    next(error);
  }
};

const updateEmployeeSchema = z.object({
  fullName: z.string().min(3).optional(),
  email: z.string().email().optional(),
  role: z.enum(['Employee']).optional(),
  phoneNumber: z.string().optional(),
  bankName: z.string().optional(),
  accountHolderName: z.string().optional(),
  rssbNumber: z.string().max(20).optional(),
  clientId: z.coerce.number().int().positive().optional().nullable(),
});

export const updateEmployee = async (req, res, next) => {
  try {
    const { employeeId } = employeeIdSchema.parse(req.params);
    const payload = updateEmployeeSchema.parse(req.body);

    console.log('=== UPDATE EMPLOYEE DEBUG ===');
    console.log('Employee ID from params:', employeeId, 'Type:', typeof employeeId);
    console.log('Payload:', payload);

    const updatedEmployee = await userService.updateEmployee(employeeId, payload);

    console.log('Updated employee result:', updatedEmployee);

    if (!updatedEmployee) {
      console.log('❌ Employee not found for ID:', employeeId);
      return res.status(404).json({ error: { message: 'Employee not found' } });
    }

    await auditService.log({
      userId: req.user.id,
      actionType: 'UPDATE_EMPLOYEE',
      details: { employeeId, changes: payload },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      correlationId: req.id,
    });

    res.json(updatedEmployee);
  } catch (error) {
    console.error('Update employee error:', error);
    next(error);
  }
};

export const deleteEmployee = async (req, res, next) => {
  try {
    const { employeeId } = employeeIdSchema.parse(req.params);

    console.log('=== DELETE EMPLOYEE DEBUG ===');
    console.log('Employee ID from params:', employeeId, 'Type:', typeof employeeId);

    // Prevent employees from deleting their own record (system users have user_id, not employee_id)
    if (req.user.userType === 'employee' && Number(employeeId) === Number(req.user.id)) {
      throw badRequest('Cannot delete your own account');
    }

    const deletedEmployee = await userService.deleteEmployee(employeeId);

    console.log('Deleted employee result:', deletedEmployee);

    if (!deletedEmployee) {
      console.log('❌ Employee not found for ID:', employeeId);
      return res.status(404).json({ error: { message: 'Employee not found' } });
    }

    await auditService.log({
      userId: req.user.id,
      actionType: 'DELETE_EMPLOYEE',
      details: { employeeId, employeeName: deletedEmployee.full_name },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      correlationId: req.id,
    });

    res.json({ message: 'Employee deleted successfully', employee: deletedEmployee });
  } catch (error) {
    console.error('Delete employee error:', error);
    next(error);
  }
};

