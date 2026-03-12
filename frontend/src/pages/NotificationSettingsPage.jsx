import { useState, useEffect } from 'react';
import { Bell, Save, CheckCircle, AlertCircle, Info, Send, Mail, ChevronRight } from 'lucide-react';
import { apiClient } from '../api/client';
import useAuth from '../hooks/useAuth';
import './NotificationSettingsPage.css';

const FIELDS = [
  {
    key: 'hr_notification_email',
    role: 'hr',
    label: 'HR Manager',
    trigger: 'Finance Officer submits payroll for review',
    description: 'This person receives an email the moment Finance Officer submits a payroll batch — reminding them to log in and review it.',
    placeholder: 'hr@company.com',
    badge: 'Step 1',
    badgeColor: '#6366f1',
    event: 'Payroll submitted → HR gets notified',
  },
  {
    key: 'md_notification_email',
    role: 'md',
    label: 'Managing Director',
    trigger: 'HR approves payroll and forwards to MD',
    description: 'This person receives an email once HR has approved the payroll — reminding them to log in and give final approval.',
    placeholder: 'md@company.com',
    badge: 'Step 2',
    badgeColor: '#10b981',
    event: 'HR approved → MD gets notified',
  },
  {
    key: 'fo_notification_email',
    role: 'fo',
    label: 'Finance Officer',
    trigger: 'MD gives final approval (or rejection)',
    description: 'This person receives an email when MD approves or rejects the payroll — so they can process payments or fix issues.',
    placeholder: 'finance@company.com',
    badge: 'Step 3',
    badgeColor: '#f5911f',
    event: 'MD decision → FO gets notified',
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
  const [testing, setTesting] = useState({});
  const [testResults, setTestResults] = useState({});

  useEffect(() => { fetchSettings(); }, []);

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
    setTestResults((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await apiClient.put('/settings/notifications', values, { token });
      setMessage({ type: 'success', text: 'Notification emails saved successfully. They will be used for all future workflow events.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (field) => {
    setTesting((prev) => ({ ...prev, [field.role]: true }));
    setTestResults((prev) => ({ ...prev, [field.key]: null }));
    try {
      const res = await apiClient.post('/settings/notifications/test', { role: field.role }, { token });
      setTestResults((prev) => ({
        ...prev,
        [field.key]: { type: 'success', text: res.message || `Test email sent to ${values[field.key]}` },
      }));
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [field.key]: { type: 'error', text: err.message || 'Failed to send test email' },
      }));
    } finally {
      setTesting((prev) => ({ ...prev, [field.role]: false }));
    }
  };

  return (
    <div className="notif-settings-page">
      <div className="notif-settings-header">
        <div className="notif-settings-header__icon">
          <Bell size={22} />
        </div>
        <div>
          <h1>Notification Emails</h1>
          <p>Configure the personal email addresses that get automatically notified at each payroll approval step.</p>
        </div>
      </div>

      {/* Workflow banner */}
      <div className="notif-workflow-banner">
        <div className="notif-workflow-step notif-workflow-step--fo">
          <span className="notif-workflow-icon"><Mail size={14} /></span>
          <div>
            <strong>Finance Officer</strong>
            <span>submits payroll</span>
          </div>
        </div>
        <ChevronRight size={18} className="notif-workflow-arrow" />
        <div className="notif-workflow-step notif-workflow-step--hr">
          <span className="notif-workflow-icon"><Mail size={14} /></span>
          <div>
            <strong>HR Manager</strong>
            <span>gets email reminder</span>
          </div>
        </div>
        <ChevronRight size={18} className="notif-workflow-arrow" />
        <div className="notif-workflow-step notif-workflow-step--hr">
          <span className="notif-workflow-icon"><Mail size={14} /></span>
          <div>
            <strong>HR approves</strong>
            <span>MD gets email</span>
          </div>
        </div>
        <ChevronRight size={18} className="notif-workflow-arrow" />
        <div className="notif-workflow-step notif-workflow-step--md">
          <span className="notif-workflow-icon"><Mail size={14} /></span>
          <div>
            <strong>MD approves</strong>
            <span>FO gets email</span>
          </div>
        </div>
      </div>

      <div className="notif-info-banner">
        <Info size={15} />
        <span>
          Enter the <strong>personal email address</strong> for each person. When they need to take action, they will automatically receive a reminder email — even if they are not logged in.
        </span>
      </div>

      {loading ? (
        <div className="notif-settings-loading">Loading settings…</div>
      ) : (
        <form className="notif-settings-form" onSubmit={handleSave}>
          {FIELDS.map((field) => (
            <div key={field.key} className="notif-field">
              <div className="notif-field__header">
                <div className="notif-field__title-row">
                  <span
                    className="notif-field__step"
                    style={{ background: field.badgeColor + '18', color: field.badgeColor, borderColor: field.badgeColor + '44' }}
                  >
                    {field.badge}
                  </span>
                  <label htmlFor={field.key}>{field.label} Personal Email</label>
                </div>
              </div>

              <p className="notif-field__trigger">
                <strong>When triggered:</strong> {field.trigger}
              </p>
              <p className="notif-field__desc">{field.description}</p>

              <div className="notif-field__input-row">
                <input
                  id={field.key}
                  type="email"
                  className="notif-field__input"
                  placeholder={field.placeholder}
                  value={values[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                />
                <button
                  type="button"
                  className="notif-test-btn"
                  disabled={testing[field.role] || !values[field.key]}
                  onClick={() => handleTest(field)}
                  title={values[field.key] ? `Send a test email to ${values[field.key]}` : 'Enter an email first'}
                >
                  <Send size={14} aria-hidden />
                  {testing[field.role] ? 'Sending…' : 'Test'}
                </button>
              </div>

              {testResults[field.key] && (
                <div className={`notif-test-result notif-test-result--${testResults[field.key].type}`}>
                  {testResults[field.key].type === 'success'
                    ? <CheckCircle size={14} aria-hidden />
                    : <AlertCircle size={14} aria-hidden />}
                  {testResults[field.key].text}
                </div>
              )}

              <p className="notif-field__event-hint">
                <Mail size={12} aria-hidden /> {field.event}
              </p>
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
            {saving ? 'Saving…' : 'Save Notification Emails'}
          </button>
        </form>
      )}
    </div>
  );
};

export default NotificationSettingsPage;
