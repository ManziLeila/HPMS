import contractRepo from '../repositories/contractRepo.js';
import nodemailer from 'nodemailer';
import logger from '../config/logger.js';

const FROM = `"HC Solutions Payroll" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`;

const getMailer = () => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) return null;
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });
};

/* ── Send one contract-expiry warning email ─────────────────── */
const sendExpiryEmail = async (contract, daysLeft) => {
    try {
        const transport = getMailer();
        if (!transport) return;

        const subject = `⚠️ Contract Expiry Notice — ${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining`;
        const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:8px">
        <h2 style="color:#002f6c">HC Solutions Payroll — Contract Expiry Alert</h2>
        <p>Dear <strong>${contract.full_name}</strong>,</p>
        <p>Your employment contract is due to expire in <strong style="color:#ef4444">${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr style="background:#f8fafc"><td style="padding:8px 12px;font-weight:600">Contract Type</td><td style="padding:8px 12px">${contract.contract_type}</td></tr>
          <tr><td style="padding:8px 12px;font-weight:600">Job Title</td><td style="padding:8px 12px">${contract.job_title}</td></tr>
          <tr style="background:#f8fafc"><td style="padding:8px 12px;font-weight:600">Department</td><td style="padding:8px 12px">${contract.department || '—'}</td></tr>
          <tr><td style="padding:8px 12px;font-weight:600">End Date</td><td style="padding:8px 12px;color:#ef4444;font-weight:700">${new Date(contract.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
        </table>
        <p>Please contact HR to discuss contract renewal or next steps.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>
        <p style="font-size:12px;color:#94a3b8">HC Solutions · Payroll Management System · Auto-generated notification</p>
      </div>`;

        await transport.sendMail({ from: FROM, to: contract.email, subject, html });
        logger.info(`Contract expiry email sent to ${contract.email} (${daysLeft}d remaining)`);
    } catch (err) {
        logger.error('Contract expiry email failed:', err.message);
    }
};

/* ── Also notify HR team ────────────────────────────────────── */
const notifyHR = async (contracts, daysLeft) => {
    try {
        const hrEmail = process.env.HR_NOTIFICATION_EMAIL || process.env.SMTP_FROM_EMAIL;
        const transport = getMailer();
        if (!transport || !hrEmail || contracts.length === 0) return;

        const rows = contracts.map(c =>
            `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9">${c.full_name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9">${c.job_title}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9">${c.department || '—'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#ef4444;font-weight:700">
          ${new Date(c.end_date).toLocaleDateString('en-GB')}
        </td>
       </tr>`
        ).join('');

        const html = `
      <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:24px">
        <h2 style="color:#002f6c">⚠️ ${contracts.length} Contract${contracts.length > 1 ? 's' : ''} Expiring in ${daysLeft} Days</h2>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
          <thead><tr style="background:#002f6c;color:#fff">
            <th style="padding:10px 12px;text-align:left">Employee</th>
            <th style="padding:10px 12px;text-align:left">Position</th>
            <th style="padding:10px 12px;text-align:left">Department</th>
            <th style="padding:10px 12px;text-align:left">End Date</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="color:#64748b;font-size:13px;margin-top:16px">Please take action to renew or terminate these contracts before expiry.</p>
      </div>`;

        await transport.sendMail({
            from: FROM,
            to: hrEmail,
            subject: `⚠️ HR Alert: ${contracts.length} contract${contracts.length > 1 ? 's' : ''} expire in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
            html,
        });
        logger.info(`HR expiry digest sent for ${contracts.length} contracts (${daysLeft}d)`);
    } catch (err) {
        logger.error('HR expiry digest failed:', err.message);
    }
};

/* ═══════════════════════════════════════════════════════════════
   Exported service
═══════════════════════════════════════════════════════════════ */
const contractService = {
    create: (data) => contractRepo.create(data),
    list: (opts) => contractRepo.list(opts),
    findById: (id) => contractRepo.findById(id),
    findByEmployee: (id) => contractRepo.findByEmployee(id),
    update: (data) => contractRepo.update(data),
    stats: () => contractRepo.stats(),

    /* Expiring contracts dashboard endpoint */
    expiring: (days = 30) => contractRepo.findExpiring(days),

    /* ── Run expiry notifications (call via job / endpoint) ────── */
    async runNotifications() {
        let sent = 0;
        await contractRepo.expireOld();

        for (const days of [30, 14, 7]) {
            const pending = await contractRepo.findPendingNotification(days);
            for (const c of pending) {
                await sendExpiryEmail(c, days);
                await contractRepo.markNotified(c.contract_id, days);
                sent++;
            }
            if (pending.length > 0) await notifyHR(pending, days);
        }
        return { sent };
    },
};

export default contractService;
