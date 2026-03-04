-- Fix notifications sequence when it's out of sync (duplicate key on notifications_pkey)
-- Run: psql -d your_database -f backend/scripts/fix-notifications-sequence.sql

-- setval(x) means next nextval() returns x+1
SELECT setval(
    'hpms_core.notifications_notification_id_seq',
    COALESCE((SELECT MAX(notification_id) FROM hpms_core.notifications), 0)
);
