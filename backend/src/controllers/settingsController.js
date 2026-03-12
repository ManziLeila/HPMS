import settingsRepo from '../repositories/settingsRepo.js';
import { sendApprovalNotification } from '../services/emailService.js';

const NOTIF_KEYS = ['hr_notification_email', 'md_notification_email', 'fo_notification_email'];

export const getNotificationSettings = async (req, res, next) => {
  try {
    const values = await settingsRepo.getMany(NOTIF_KEYS);
    res.json({
      success: true,
      data: {
        hr_notification_email: values.hr_notification_email || '',
        md_notification_email: values.md_notification_email || '',
        fo_notification_email: values.fo_notification_email || '',
      },
    });
  } catch (err) { next(err); }
};

export const updateNotificationSettings = async (req, res, next) => {
  try {
    const { hr_notification_email, md_notification_email, fo_notification_email } = req.body;
    await settingsRepo.setMany({
      hr_notification_email: hr_notification_email?.trim() || '',
      md_notification_email: md_notification_email?.trim() || '',
      fo_notification_email: fo_notification_email?.trim() || '',
    });
    res.json({ success: true, message: 'Notification settings saved.' });
  } catch (err) { next(err); }
};

/**
 * POST /settings/notifications/test
 * Send a test notification email to one of the configured role emails.
 * body: { role: 'hr' | 'md' | 'fo' }
 */
export const testNotificationEmail = async (req, res, next) => {
  try {
    const { role } = req.body;
    const keyMap = { hr: 'hr_notification_email', md: 'md_notification_email', fo: 'fo_notification_email' };
    const eventMap = { hr: 'SUBMITTED', md: 'HR_APPROVED', fo: 'MD_APPROVED' };
    const labelMap = { hr: 'HR Manager', md: 'Managing Director', fo: 'Finance Officer' };

    if (!keyMap[role]) {
      return res.status(400).json({ success: false, error: { message: 'Invalid role. Must be hr, md, or fo.' } });
    }

    const settings = await settingsRepo.getMany([keyMap[role]]);
    const email = settings[keyMap[role]];

    if (!email) {
      return res.status(400).json({
        success: false,
        error: { message: `No email configured for ${labelMap[role]}. Save an email address first.` },
      });
    }

    await sendApprovalNotification({
      toEmail: email,
      event: eventMap[role],
      clientName: 'Test Client',
      periodLabel: new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
      salaryCount: 5,
      actorName: req.user.fullName || req.user.email || 'System',
      comments: 'This is a test notification email to confirm your address is configured correctly.',
    });

    res.json({ success: true, message: `Test email sent to ${email}` });
  } catch (err) { next(err); }
};
