import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Upload,
  FileText,
  CheckSquare,
  ShieldCheck,
  FileSignature,
  Pencil,
  Layers,
  Settings,
  Mail,
  Calculator,
  BarChart3,
  UserCog,
  X,
  Shield,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import './Sidebar.css';

const ROUTE_MAP = {
  FinanceOfficer: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/approval-dashboard', label: 'Approvals', icon: BarChart3 },
    { path: '/clients', label: 'Clients', icon: Users },
    { path: '/employees/new', label: 'Employee Form', icon: UserPlus },
    { path: '/bulk-upload', label: 'Bulk Upload', icon: Upload },
    { path: '/payroll-run', label: 'Payroll Run', icon: Calculator },
    { path: '/payroll-periods', label: 'Payroll Periods', icon: Layers },
    { path: '/contracts', label: 'Contracts', icon: FileSignature },
    { path: '/contract-templates', label: 'Contract Templates', icon: Pencil },
    { path: '/reports', label: 'Reports', icon: FileText },
    { path: '/email-settings', label: 'Email Settings', icon: Mail },
    { path: '/settings', label: 'Settings', icon: Settings },
  ],
  HR: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/approval-dashboard', label: 'Approvals', icon: BarChart3 },
    { path: '/clients', label: 'Clients', icon: Users },
    { path: '/users', label: 'Users', icon: UserCog },
    { path: '/contracts', label: 'Contracts', icon: FileSignature },
    { path: '/contract-templates', label: 'Contract Templates', icon: Pencil },
    { path: '/hr-review', label: 'HR Review', icon: CheckSquare },
    { path: '/reports', label: 'Reports', icon: FileText },
    { path: '/email-settings', label: 'Email Settings', icon: Mail },
    { path: '/settings', label: 'Settings', icon: Settings },
  ],
  ManagingDirector: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/approval-dashboard', label: 'Approvals', icon: BarChart3 },
    { path: '/clients', label: 'Clients', icon: Users },
    { path: '/users', label: 'Users', icon: UserCog },
    { path: '/md-approval', label: 'MD Approval', icon: ShieldCheck },
    { path: '/contracts', label: 'Contracts', icon: FileSignature },
    { path: '/reports', label: 'Reports', icon: FileText },
    { path: '/settings', label: 'Settings', icon: Settings },
  ],
  Admin: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/approval-dashboard', label: 'Approvals', icon: BarChart3 },
    { path: '/clients', label: 'Clients', icon: Users },
    { path: '/users', label: 'Users', icon: UserCog },
    { path: '/employees/new', label: 'Employee Form', icon: UserPlus },
    { path: '/bulk-upload', label: 'Bulk Upload', icon: Upload },
    { path: '/payroll-run', label: 'Payroll Run', icon: Calculator },
    { path: '/payroll-periods', label: 'Payroll Periods', icon: Layers },
    { path: '/hr-review', label: 'HR Review', icon: CheckSquare },
    { path: '/md-approval', label: 'MD Approval', icon: ShieldCheck },
    { path: '/contracts', label: 'Contracts', icon: FileSignature },
    { path: '/contract-templates', label: 'Contract Templates', icon: Pencil },
    { path: '/reports', label: 'Reports', icon: FileText },
    { path: '/email-settings', label: 'Email Settings', icon: Mail },
    { path: '/settings', label: 'Settings', icon: Settings },
  ],
  TechAdmin: [
    { path: '/management-console', label: 'Management Console', icon: Shield },
  ],
};

const ROLE_LABELS = {
  FinanceOfficer: 'Finance Officer',
  HR: 'HR Manager',
  ManagingDirector: 'Managing Director',
  Employee: 'Employee',
  Admin: 'Admin',
  TechAdmin: 'Tech Admin',
};

const STATUS_COLORS = {
  FinanceOfficer: '#f5911f',
  HR: '#6366f1',
  ManagingDirector: '#10b981',
  Employee: '#94a3b8',
  Admin: '#0f172a',
  TechAdmin: '#0f766e',
};

const Sidebar = ({ onClose }) => {
  const { user } = useAuth();
  const location = useLocation();
  const role = user?.role || 'Employee';
  const routes = (ROUTE_MAP && ROUTE_MAP[role]) || (role === 'Employee' ? [] : (ROUTE_MAP?.FinanceOfficer || []));

  return (
    <aside className="sidebar">
      <button
        type="button"
        className="sidebar__close"
        onClick={() => onClose?.()}
        aria-label="Close menu"
      >
        <X size={20} />
      </button>
      <div className="sidebar__brand">
        <div className="sidebar__logo-wrap">
          <img src="/assets/hc-logo.png" alt="HC Solutions" className="sidebar__logo" />
        </div>
        <p className="sidebar__subtitle">Payroll Suite</p>
      </div>

      <nav className="sidebar__nav">
        {routes.map((route) => (
          <NavLink
            key={route.path}
            to={route.path}
            end={route.path === '/clients'}
            className={({ isActive }) => {
              const clientsActive = route.path === '/clients' && (isActive || location.pathname.startsWith('/clients/'));
              return clientsActive || isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link';
            }}
            onClick={() => onClose?.()}
          >
            <route.icon className="sidebar__link-icon" size={18} />
            <span>{route.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div
          className="sidebar__role-badge"
          style={{ background: ((STATUS_COLORS || {})[role] || '#94a3b8') + '22', borderColor: ((STATUS_COLORS || {})[role] || '#94a3b8') + '55' }}
        >
          <span
            className="sidebar__role-dot"
            style={{ background: (STATUS_COLORS || {})[role] || '#94a3b8' }}
          />
          <span style={{ color: (STATUS_COLORS || {})[role] || '#94a3b8' }}>{(ROLE_LABELS || {})[role] || role}</span>
        </div>
        <p className="sidebar__email">{user?.email}</p>
      </div>
    </aside>
  );
};

export default Sidebar;
