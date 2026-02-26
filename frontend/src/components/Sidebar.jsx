import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserPlus, Upload,
  FileText, CheckSquare, ShieldCheck, FileSignature, Pencil,
  Layers, Settings, Mail,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import './Sidebar.css';

/* ── Route definitions per role ─────────────────────────────────── */
const ROUTE_MAP = {
  // Finance Officer — full access
  FinanceOfficer: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/employees', label: 'Employees', icon: Users },
    { path: '/employees/new', label: 'Employee Form', icon: UserPlus },
    { path: '/bulk-upload', label: 'Bulk Upload', icon: Upload },
    { path: '/my-batches', label: 'My Batches', icon: Layers },
    { path: '/hr-review', label: 'Review Queue', icon: CheckSquare },
    { path: '/contracts', label: 'Contracts', icon: FileSignature },
    { path: '/reports', label: 'Reports', icon: FileText },
    { path: '/email-settings', label: 'Email Settings', icon: Mail },
    { path: '/settings', label: 'Settings', icon: Settings },
  ],
  // HR — auditor view
  HR: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/employees', label: 'Employees', icon: Users },
    { path: '/contracts', label: 'Contracts', icon: FileSignature },
    { path: '/contract-templates', label: 'Contract Templates', icon: Pencil },
    { path: '/hr-review', label: 'Review Queue', icon: CheckSquare },
    { path: '/reports', label: 'Reports', icon: FileText },
    { path: '/email-settings', label: 'Email Settings', icon: Mail },
    { path: '/settings', label: 'Settings', icon: Settings },
  ],
  // Managing Director — decision-maker view
  ManagingDirector: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/md-approval', label: 'Final Auth.', icon: ShieldCheck },
    { path: '/contracts', label: 'Contracts', icon: FileSignature },
    { path: '/reports', label: 'Reports', icon: FileText },
    { path: '/settings', label: 'Settings', icon: Settings },
  ],
  // Admin — same as Finance Officer but with everything
  Admin: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/employees', label: 'Employees', icon: Users },
    { path: '/employees/new', label: 'Employee Form', icon: UserPlus },
    { path: '/bulk-upload', label: 'Bulk Upload', icon: Upload },
    { path: '/my-batches', label: 'My Batches', icon: Layers },
    { path: '/contracts', label: 'Contracts', icon: FileSignature },
    { path: '/contract-templates', label: 'Contract Templates', icon: Pencil },
    { path: '/hr-review', label: 'HR Review', icon: CheckSquare },
    { path: '/md-approval', label: 'MD Approval', icon: ShieldCheck },
    { path: '/reports', label: 'Reports', icon: FileText },
    { path: '/email-settings', label: 'Email Settings', icon: Mail },
    { path: '/settings', label: 'Settings', icon: Settings },
  ],
  // Employee — minimal
  Employee: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/reports', label: 'My Payslips', icon: FileText },
    { path: '/settings', label: 'Settings', icon: Settings },
  ],
};

const ROLE_LABELS = {
  FinanceOfficer: 'Finance Officer',
  HR: 'HR Manager',
  ManagingDirector: 'Managing Director',
  Admin: 'Administrator',
  Employee: 'Employee',
};

const STATUS_COLORS = {
  FinanceOfficer: '#f5911f',
  HR: '#6366f1',
  ManagingDirector: '#10b981',
  Admin: '#ef4444',
  Employee: '#94a3b8',
};

const Sidebar = () => {
  const { user } = useAuth();
  const role = user?.role || 'Employee';
  const routes = ROUTE_MAP[role] || ROUTE_MAP.Employee;

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <img src="/assets/hc-logo.png" alt="HC Solutions" className="sidebar__logo" />
        <p className="sidebar__subtitle">Payroll Suite</p>
      </div>

      <nav className="sidebar__nav">
        {routes.map((route) => (
          <NavLink
            key={route.path}
            to={route.path}
            end={route.path === '/employees'}
            className={({ isActive }) =>
              isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
            }
          >
            <route.icon className="sidebar__link-icon" size={18} />
            <span>{route.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div
          className="sidebar__role-badge"
          style={{ background: STATUS_COLORS[role] + '22', borderColor: STATUS_COLORS[role] + '55' }}
        >
          <span
            className="sidebar__role-dot"
            style={{ background: STATUS_COLORS[role] }}
          />
          <span style={{ color: STATUS_COLORS[role] }}>{ROLE_LABELS[role] || role}</span>
        </div>
        <p className="sidebar__email">{user?.email}</p>
      </div>
    </aside>
  );
};

export default Sidebar;
