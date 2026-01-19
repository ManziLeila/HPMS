import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import './ShellLayout.css';
import useAuth from '../hooks/useAuth.js';

const ShellLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const pageTitle = (() => {
    if (location.pathname === '/') return 'Executive Dashboard';
    if (location.pathname.startsWith('/employees')) return 'Employee Management';
    if (location.pathname.startsWith('/reports')) return 'Payroll Reports';
    return 'Employee Compensation';
  })();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-shell__content">
        <header className="app-shell__header">
          <div>
            <p className="app-shell__eyebrow">Secure Payroll Portal</p>
            <h1 className="app-shell__title">{pageTitle}</h1>
          </div>
          <div className="app-shell__user">
            <div>
              <p className="app-shell__user-email">{user?.email}</p>
              <p className="app-shell__user-session">Session: {user?.sessionId?.slice(0, 8)}</p>
            </div>
            <button type="button" className="app-shell__logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>
        <section className="app-shell__body">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default ShellLayout;

