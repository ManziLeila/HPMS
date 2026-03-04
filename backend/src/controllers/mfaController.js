import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { z } from 'zod';
import employeeRepo from '../repositories/employeeRepo.js';
import auditService from '../services/auditService.js';
import { notFound, forbidden } from '../utils/httpError.js';
import config from '../config/env.js';

const generateMfaSchema = z.object({
    employeeId: z.coerce.number(),
});

const resetMfaSchema = z.object({
    employeeId: z.coerce.number(),
});

/**
 * Generate MFA secret and QR code for an employee (HR only)
 * This allows HR to set up MFA for Finance Officers and other users
 */
export const generateMfaForEmployee = async (req, res, next) => {
    try {
        const { employeeId } = generateMfaSchema.parse(req.body);

        // Only HR can generate MFA for others
        if (req.user.role !== 'HR' && req.user.role !== 'Admin') {
            throw forbidden('Only HR can generate MFA credentials for employees');
        }

        const employee = await employeeRepo.findById(employeeId);
        if (!employee) {
            throw notFound('Employee not found');
        }

        // Generate new MFA secret
        const secret = authenticator.generateSecret();

        // Create OTP auth URL for QR code
        const otpauthUrl = authenticator.keyuri(
            employee.email,
            config.auth.mfaIssuer || 'HC Solutions Payroll',
            secret
        );

        // Generate QR code as data URL
        const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

        // Update employee with new MFA secret
        await employeeRepo.updateMfaSecret({ employeeId, mfaSecret: secret });

        await auditService.log({
            userId: req.user.id,
            actionType: 'MFA_GENERATED',
            details: { targetEmployeeId: employeeId, targetEmail: employee.email },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            correlationId: req.id,
        });

        res.json({
            message: 'MFA credentials generated successfully',
            data: {
                employeeId: employee.employee_id,
                employeeName: employee.full_name,
                employeeEmail: employee.email,
                secret,
                qrCode: qrCodeDataUrl,
                otpauthUrl,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Reset MFA for an employee (HR only)
 * This removes the MFA secret, requiring the user to set up MFA again
 */
export const resetMfaForEmployee = async (req, res, next) => {
    try {
        const { employeeId } = resetMfaSchema.parse(req.body);

        // Only HR can reset MFA for others
        if (req.user.role !== 'HR' && req.user.role !== 'Admin') {
            throw forbidden('Only HR can reset MFA for employees');
        }

        const employee = await employeeRepo.findById(employeeId);
        if (!employee) {
            throw notFound('Employee not found');
        }

        // Reset MFA secret to placeholder
        await employeeRepo.updateMfaSecret({
            employeeId,
            mfaSecret: 'PLACEHOLDER_MFA_SECRET_DISABLED'
        });

        await auditService.log({
            userId: req.user.id,
            actionType: 'MFA_RESET',
            details: { targetEmployeeId: employeeId, targetEmail: employee.email },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            correlationId: req.id,
        });

        res.json({
            message: 'MFA reset successfully. Employee will need to set up MFA on next login.',
            data: {
                employeeId: employee.employee_id,
                employeeName: employee.full_name,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get MFA status for an employee
 */
export const getMfaStatus = async (req, res, next) => {
    try {
        const { employeeId } = z.object({ employeeId: z.coerce.number() }).parse(req.params);

        // Users can check their own status, HR can check anyone's
        if (req.user.id !== employeeId && req.user.role !== 'HR' && req.user.role !== 'Admin') {
            throw forbidden('You can only check your own MFA status');
        }

        const employee = await employeeRepo.findById(employeeId);
        if (!employee) {
            throw notFound('Employee not found');
        }

        const mfaEnabled = employee.mfa_secret &&
            employee.mfa_secret !== 'PLACEHOLDER_MFA_SECRET_DISABLED';

        res.json({
            employeeId: employee.employee_id,
            mfaEnabled,
        });
    } catch (error) {
        next(error);
    }
};
