import { useState, useEffect } from 'react';
import { Bell, Save, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { apiClient } from '../api/client';
import useAuth from '../hooks/useAuth';
import './NotificationSettingsPage.css';

const FIELDS = [
  {
    key: 'hr_notification_email',
    label: 'HR Manager Email',
    description: 'Notified when Finance Officer submits a payroll for HR review.',
    placeholder: 'e.g. hr@company.com',
    badge: 'Step 1 → HR',
    badgeColor: '#6366f1',
  },
  {
    key: 'md_notification_email',
    label: 'Managing Director Email',
    description: 'Notified when HR approves and forwards payroll for final MD approval.',
    placeholder: 'e.g. md@company.com',
    badge: 'Step 2 → MD',
    badgeColor: '#10b981',
  },
  {
    key: 'fo_notification_email',
    label: 'Finance Officer Email',
    description: 'Notified when MD gives final approval (or rejection) so payments can be processed.',
    placeholder: 'e.g. finance@company.com',
    badge: 'Step 3 → FO',
    badgeColor: '#f5911f',
  },
];

const NotificationSettingsPage = () => {
  const { token } = useAuth();
  const [values, setValues] = useState({
    hr_notification_email: '',
    md_notification_email: '',
    fo_notification_email: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/settings/notifications', { token });
      if (res.success) setValues(res.data);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load notification settings.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, val) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    setMessage(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await apiClient.put('/settings/notifications', values, { token });
      setMessage({ type: 'success', text: 'Notification settings saved successfully.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="notif-settings-page">
      <div className="notif-settings-header">
        <div className="notif-settings-header__icon">
          <Bell size={22} />
        </div>
        <div>
          <h1>Notification Settings</h1>
          <p>Configure the email addresses that receive notifications at each payroll approval step.</p>
        </div>
      </div>

      {/* Flow diagram */}
      <div className="notif-flow">
        <div className="notif-flow__step" style={{ '--c': '#f5911f' }}>
          <span className="notif-flow__dot" />
          <span>Finance Officer submits</span>
        </div>
        <div className="notif-flow__arrow">→</div>
        <div className="notif-flow__step" style={{ '--c': '#6366f1' }}>
          <span className="notif-flow__dot" />
          <span>HR reviews &amp; approves</span>
        </div>
        <div className="notif-flow__arrow">→</div>
        <div className="notif-flow__step" style={{ '--c': '#10b981' }}>
          <span className="notif-flow__dot" />
          <span>MD gives final approval</span>
        </div>
        <div className="notif-flow__arrow">→</div>
        <div className="notif-flow__step" style={{ '--c': '#f5911f' }}>
          <span className="notif-flow__dot" />
          <span>Finance Officer processes</span>
        </div>
      </div>

      {loading ? (
        <div className="notif-settings-loading">Loading settings…</div>
      ) : (
        <form className="notif-settings-form" onSubmit={handleSave}>
          <div className="notif-info-banner">
            <Info size={15} />
            <span>
              Each email below receives an automatic notification email when the relevant step
              occurs. Leave a field empty to disable notifications for that step.
            </span>
          </div>

          {FIELDS.map((field) => (
            <div key={field.key} className="notif-field">
              <div className="notif-field__header">
                <label htmlFor={field.key}>{field.label}</label>
                <span
                  className="notif-field__badge"
                  style={{ background: field.badgeColor + '18', color: field.badgeColor, borderColor: field.badgeColor + '44' }}
                >
                  {field.badge}
                </span>
              </div>
              <p className="notif-field__desc">{field.description}</p>
              <input
                id={field.key}
                type="email"
                className="notif-field__input"
                placeholder={field.placeholder}
                value={values[field.key]}
                onChange={(e) => handleChange(field.key, e.target.value)}
              />
            </div>
          ))}

          {message && (
            <div className={`notif-message notif-message--${message.type}`}>
              {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span>{message.text}</span>
            </div>
          )}

          <button type="submit" className="notif-save-btn" disabled={saving}>
            <Save size={16} />
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </form>
      )}
    </div>
  );
};

export default NotificationSettingsPage;
