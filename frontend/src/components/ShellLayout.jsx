import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import LanguageSelector from './LanguageSelector';
import NotificationBell from './NotificationBell';
import './ShellLayout.css';
import useAuth from '../hooks/useAuth.js';
import useSessionTimeout from '../hooks/useSessionTimeout.js';
import { useLanguage } from '../context/LanguageContext';

const ShellLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [sessionWarn, setSessionWarn] = useState(false);

  const pageTitle = (() => {
    if (location.pathname === '/dashboard') return t('dashboard');
    if (location.pathname.startsWith('/employees')) return t('employeeManagement');
    if (location.pathname.startsWith('/reports')) return t('payrollReports');
    if (location.pathname.startsWith('/bulk-upload')) return t('bulkEmployeeUpload');
    if (location.pathname.startsWith('/hr-review')) return 'HR Review Queue';
    if (location.pathname.startsWith('/md-approval')) return 'MD Final Approval';
    if (location.pathname.startsWith('/contract-templates')) return 'Contract Templates';
    if (location.pathname.startsWith('/contracts')) return 'Contract Management';
    return t('payrollManagement');
  })();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  /* ── auto-logout after 15 min inactivity ─────────────────── */
  useSessionTimeout({
    onWarn: () => setSessionWarn(true),
    onLogout: async () => {
      setSessionWarn(false);
      await logout();
      navigate('/login', { replace: true });
    },
  });

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-shell__content">
        <header className="app-shell__header">
          <div>
            <p className="app-shell__eyebrow">{t('payrollManagementSystem')}</p>
            <h1 className="app-shell__title">{pageTitle}</h1>
          </div>
          <div className="app-shell__user">
            <LanguageSelector />
            <NotificationBell />
            <div>
              <p className="app-shell__user-email">{user?.email}</p>
              <p className="app-shell__user-session">Session: {user?.sessionId?.slice(0, 8)}</p>
            </div>
            <button type="button" className="app-shell__logout" onClick={handleLogout}>
              {t('logout')}
            </button>
          </div>
        </header>

        {/* ── Session expiry warning banner ──────────────────── */}
        {sessionWarn && (
          <div className="app-shell__session-warn">
            <span>⚠️</span>
            <span>Your session will expire in <strong>2 minutes</strong> due to inactivity.</span>
            <button onClick={() => setSessionWarn(false)}>Stay Logged In</button>
          </div>
        )}

        <section className="app-shell__body">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default ShellLayout;
