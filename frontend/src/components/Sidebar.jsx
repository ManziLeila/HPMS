import { NavLink } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import './Sidebar.css';

const routes = [
  { path: '/', label: 'Dashboard' },
  { path: '/employees', label: 'Employees' },
  { path: '/employees/new', label: 'Employee Form' },
  { path: '/reports', label: 'Reports' },
];

const Sidebar = () => {
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__logo">HPMS</span>
        <p className="sidebar__subtitle">HC Solutions</p>
      </div>
      <nav className="sidebar__nav">
        {routes.map((route) => (
          <NavLink
            key={route.path}
            to={route.path}
            end={route.path === '/'}
            className={({ isActive }) =>
              isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
            }
          >
            {route.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar__footer">
        <p className="sidebar__role-label">Role</p>
        <p className="sidebar__role-value">{user?.role || 'Employee'}</p>
      </div>
    </aside>
  );
};

export default Sidebar;

