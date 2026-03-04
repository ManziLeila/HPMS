import { z } from 'zod';
import { createTransport } from 'nodemailer';
import { payslipDeliveryTemplate } from '../utils/emailTemplates.js';

const testEmailSchema = z.object({
    email: z.string().email('Invalid email address'),
    sampleData: z.object({
        employeeName: z.string().optional(),
        employeeId: z.string().optional(),
        payPeriod: z.string().optional(),
        netSalary: z.string().optional(),
        payDate: z.string().optional(),
    }).optional(),
});

/**
 * Send test email with sample data
 * POST /api/email/test
 */
export const sendTestEmailHandler = async (req, res, next) => {
    try {
        const { email, sampleData } = testEmailSchema.parse(req.body);

        // Use sample data or defaults
        const data = {
            employeeName: sampleData?.employeeName || 'John Doe',
            employeeId: sampleData?.employeeId || 'EMP001',
            payPeriod: sampleData?.payPeriod || 'January 2026',
            netSalary: sampleData?.netSalary || 'RWF 450,000',
            payDate: sampleData?.payDate || 'January 17, 2026',
        };

        // Generate HTML preview
        const htmlContent = payslipDeliveryTemplate({
            ...data,
            companyName: 'HC Solutions',
            hrContact: 'HR Department',
            responseDays: '5',
            senderName: 'Payroll Team',
            jobTitle: 'Payroll Administrator',
            companyEmail: 'payroll@hcsolutions.rw',
            companyPhone: '+250 788 000 000',
        });

        // Check SMTP configuration
        if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'SMTP is not configured. Please check your .env file and ensure SMTP_USER and SMTP_PASSWORD are set.',
                    hint: 'See EMAIL_SETUP_GUIDE.md for setup instructions',
                },
            });
        }

        // Create transporter using named import
        const transporter = createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
        const fromName = process.env.SMTP_FROM_NAME || 'HC Solutions Payroll';

        const mailOptions = {
            from: `"${fromName}" <${fromEmail}>`,
            to: email,
            subject: `Test Email - Your Payslip for ${data.payPeriod}`,
            html: htmlContent,
        };

        const info = await transporter.sendMail(mailOptions);

        res.json({
            success: true,
            message: `Test email sent successfully to ${email}`,
            messageId: info.messageId,
            preview: htmlContent,
        });
    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to send test email',
            },
        });
    }
};

/**
 * Get SMTP configuration status
 * GET /api/email/status
 */
export const getEmailStatus = async (req, res) => {
    const smtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD);

    res.json({
        configured: smtpConfigured,
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || '587',
        user: process.env.SMTP_USER || null,
        fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || null,
        fromName: process.env.SMTP_FROM_NAME || 'HC Solutions Payroll',
    });
};

/**
 * Get email template preview
 * POST /api/email/preview
 */
export const getEmailPreview = async (req, res, next) => {
    try {
        const { sampleData } = z.object({
            sampleData: z.object({
                employeeName: z.string().optional(),
                employeeId: z.string().optional(),
                payPeriod: z.string().optional(),
                netSalary: z.string().optional(),
                payDate: z.string().optional(),
            }).optional(),
        }).parse(req.body);

        const data = {
            employeeName: sampleData?.employeeName || 'John Doe',
            employeeId: sampleData?.employeeId || 'EMP001',
            payPeriod: sampleData?.payPeriod || 'January 2026',
            netSalary: sampleData?.netSalary || 'RWF 450,000',
            payDate: sampleData?.payDate || 'January 17, 2026',
        };

        const htmlContent = payslipDeliveryTemplate({
            ...data,
            companyName: 'HC Solutions',
            hrContact: 'HR Department',
            responseDays: '5',
            senderName: 'Payroll Team',
            jobTitle: 'Payroll Administrator',
            companyEmail: 'payroll@hcsolutions.rw',
            companyPhone: '+250 788 000 000',
        });

        res.json({
            success: true,
            preview: htmlContent,
            subject: `Your Payslip for ${data.payPeriod}`,
        });
    } catch (error) {
        next(error);
    }
};

export default {
    sendTestEmailHandler,
    getEmailStatus,
    getEmailPreview,
};
