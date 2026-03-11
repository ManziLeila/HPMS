import settingsRepo from '../repositories/settingsRepo.js';

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
