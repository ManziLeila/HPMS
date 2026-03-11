import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Activity,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogIn,
  ShieldCheck,
  Upload,
  UserPlus,
  FileText,
  Mail,
  ChevronDown,
  ChevronUp,
  Globe,
  Pencil,
  Trash2,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import managementApi from '../api/managementApi';
import './ManagementConsolePage.css';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users & Access', icon: Users },
  { id: 'activity', label: 'Activity Log', icon: Activity },
  { id: 'permissions', label: 'Permissions', icon: Shield },
  { id: 'docs', label: 'Docs & Runbook', icon: FileText },
];

const ROLE_LABELS = {
  Admin: 'Admin',
  TechAdmin: 'Tech Admin',
  FinanceOfficer: 'Finance Officer',
  HR: 'HR Manager',
  ManagingDirector: 'Managing Director',
  Employee: 'Employee',
};

const ROLE_OPTIONS = ['Admin', 'TechAdmin', 'FinanceOfficer', 'HR', 'ManagingDirector'];

/** Human-readable labels for permission keys (matches backend ROLE_PERMISSIONS) */
const PERMISSION_LABELS = {
  all: 'Full access (all permissions)',
  create_employee: 'Create employee',
  view_employees: 'View employees',
  create_salary: 'Create salary',
  bulk_upload: 'Bulk upload salaries',
  view_reports: 'View reports',
  create_batch: 'Create payroll batch',
  submit_batch: 'Submit batch',
  send_to_bank: 'Send to bank',
  view_salaries: 'View salaries',
  view_batches: 'View batches',
  approve_batch: 'Approve batch (HR)',
  reject_batch: 'Reject batch',
  add_comments: 'Add comments',
  view_all: 'View all',
  view_financial_summary: 'View financial summary',
  final_approve: 'Final approve (MD)',
  final_reject: 'Final reject',
  authorize_bank_transfer: 'Authorize bank transfer',
  view_audit_trail: 'View audit trail',
  view_own_payslip: 'View own payslip',
};

/** What each role can access in the app (menu/sections). Use "Users & Access" to change a user's role. */
const ROLE_FEATURE_ACCESS = {
  Admin: 'All areas (Dashboard, Management Console, Approvals, Clients, Users, Employee Form, Bulk Upload, Payroll Run, Payroll Periods, HR Review, MD Approval, Contracts, Contract Templates, Reports, Email Settings, Settings)',
  TechAdmin: 'Management Console only (Overview, Users & Access, Activity Log, Role permissions)',
  FinanceOfficer: 'Dashboard, Approvals, Clients, Employee Form, Bulk Upload, Payroll Run, Payroll Periods, Contracts, Contract Templates, Reports, Email Settings, Settings',
  HR: 'Dashboard, Approvals, Clients, Users, Contracts, Contract Templates, HR Review, Reports, Email Settings, Settings',
  ManagingDirector: 'Dashboard, Approvals, Clients, Users, MD Approval, Contracts, Reports, Settings',
  Employee: 'Dashboard, Reports, Settings',
};

const ACTIVITY_ACTION_OPTIONS = [
  { value: '', label: 'All actions' },
  { value: 'LOGIN_REQUEST', label: 'Login request' },
  { value: 'MFA_CHALLENGE', label: 'MFA challenge' },
  { value: 'ACCESS_GRANTED', label: 'Access granted' },
  { value: 'CREATE_USER', label: 'Create user' },
  { value: 'UPDATE_USER', label: 'Update user' },
  { value: 'DELETE_USER', label: 'Delete user' },
  { value: 'UPDATE_USER_ROLE', label: 'Update user role' },
  { value: 'UPDATE_ROLE_PERMISSIONS', label: 'Update role permissions' },
  { value: 'BULK_UPLOAD_SALARIES', label: 'Bulk upload salaries' },
  { value: 'CREATE_EMPLOYEE', label: 'Create employee' },
  { value: 'UPDATE_EMPLOYEE', label: 'Update employee' },
  { value: 'CREATE_SALARY', label: 'Create salary' },
  { value: 'UPDATE_SALARY', label: 'Update salary' },
  { value: 'DOWNLOAD_PAYSLIP', label: 'Download payslip' },
];

function getActionIcon(actionType) {
  const map = {
    LOGIN_REQUEST: LogIn,
    MFA_CHALLENGE: Shield,
    ACCESS_GRANTED: ShieldCheck,
    BULK_UPLOAD_SALARIES: Upload,
    BULK_SEND_PAYSLIP_EMAILS: Mail,
    CREATE_EMPLOYEE: UserPlus,
    UPDATE_EMPLOYEE: UserPlus,
    CREATE_SALARY: FileText,
    UPDATE_SALARY: FileText,
    DOWNLOAD_PAYSLIP: FileText,
  };
  return map[actionType] || Activity;
}

function getActionBadgeClass(actionType) {
  if (!actionType) return 'mgmt__action-badge--default';
  if (/LOGIN|ACCESS_GRANTED|MFA/.test(actionType)) return 'mgmt__action-badge--auth';
  if (/BULK|UPLOAD|CREATE|UPDATE/.test(actionType)) return 'mgmt__action-badge--data';
  return 'mgmt__action-badge--default';
}

function formatDetailsSummary(details) {
  if (details == null) return null;
  if (typeof details !== 'object') return String(details);
  const keys = Object.keys(details);
  if (keys.length === 0) return '{}';
  if (details.total != null && details.successful != null)
    return `${details.successful} of ${details.total} processed`;
  if (details.method) return details.method;
  if (details.payPeriod) return `Period: ${details.payPeriod}`;
  return `${keys.length} field(s)`;
}

export default function ManagementConsolePage() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [health, setHealth] = useState(null);
  const [emailStatus, setEmailStatus] = useState(null);

  const [usersData, setUsersData] = useState({ users: [] });
  const [usersLoading, setUsersLoading] = useState(false);
  const [roleSaving, setRoleSaving] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    full_name: '',
    email: '',
    role: 'FinanceOfficer',
    department: '',
    password: '',
    generate_password: true,
  });
  const [creatingUser, setCreatingUser] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: '', email: '', role: 'FinanceOfficer', department: '', password: '', generate_password: false });
  const [updatingUser, setUpdatingUser] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);

  const [activity, setActivity] = useState({ items: [], total: 0 });
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityOffset, setActivityOffset] = useState(0);
  const activityLimit = 25;
  const [activityFilters, setActivityFilters] = useState({ actionType: '', userId: '', fromDate: '', toDate: '' });
  const [expandedDetailsId, setExpandedDetailsId] = useState(null);
  const [activityExporting, setActivityExporting] = useState(false);

  const [permissions, setPermissions] = useState({ matrix: [], roles: [], permissionKeys: [] });
  const [permsLoading, setPermsLoading] = useState(false);
  const [permsSaving, setPermsSaving] = useState(null);
  const [permsDirty, setPermsDirty] = useState({});
  const [permsEdit, setPermsEdit] = useState({});

  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    if (activeTab === 'overview') {
      setOverviewLoading(true);
      setError(null);
      Promise.all([
        managementApi.getOverview(token),
        managementApi.getHealth(token).catch(() => ({ api: 'ok', database: 'error' })),
        managementApi.getEmailStatus(token).catch(() => ({ configured: false })),
      ])
        .then(([ov, h, e]) => {
          setOverview(ov);
          setHealth(h);
          setEmailStatus(e);
        })
        .catch((e) => setError(e.message || 'Failed to load overview'))
        .finally(() => setOverviewLoading(false));
    }
  }, [activeTab, token]);

  useEffect(() => {
    if (!token) return;
    if (activeTab === 'users') {
      setUsersLoading(true);
      setError(null);
      managementApi.getAllUsers(token)
        .then(setUsersData)
        .catch((e) => setError(e.message || 'Failed to load users'))
        .finally(() => setUsersLoading(false));
    }
  }, [activeTab, token]);

  useEffect(() => {
    if (!token) return;
    if (activeTab === 'activity') {
      setActivityLoading(true);
      setError(null);
      managementApi.getActivity(
        {
          limit: activityLimit,
          offset: activityOffset,
          ...(activityFilters.actionType && { actionType: activityFilters.actionType }),
          ...(activityFilters.userId && { userId: activityFilters.userId }),
          ...(activityFilters.fromDate && { fromDate: activityFilters.fromDate }),
          ...(activityFilters.toDate && { toDate: activityFilters.toDate }),
        },
        token
      )
        .then((data) => {
          const items = Array.isArray(data?.items) ? data.items : [];
          const total = typeof data?.total === 'number' ? data.total : 0;
          setActivity({ items, total });
        })
        .catch((e) => {
          setError(e.message || 'Failed to load activity log');
          setActivity({ items: [], total: 0 });
        })
        .finally(() => setActivityLoading(false));
    }
  }, [activeTab, token, activityOffset, activityFilters]);

  useEffect(() => {
    if (!token) return;
    if (activeTab === 'permissions') {
      setPermsLoading(true);
      setError(null);
      managementApi.getPermissions(token)
        .then((data) => {
          setPermissions({
            matrix: data.matrix || [],
            roles: data.roles || [],
            permissionKeys: data.permissionKeys || Object.keys(PERMISSION_LABELS),
          });
          const edit = {};
          (data.matrix || []).forEach((entry) => {
            edit[entry.role] = (entry.permissions || []).slice();
          });
          setPermsEdit(edit);
          setPermsDirty({});
        })
        .catch((e) => setError(e.message || 'Failed to load permissions'))
        .finally(() => setPermsLoading(false));
    }
  }, [activeTab, token]);

  const handleRoleChange = async (userId, newRole) => {
    if (!token) return;
    setRoleSaving(userId);
    try {
      await managementApi.updateUserRole(userId, newRole, token);
      setUsersData((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.user_id === userId ? { ...u, role: newRole } : u)),
      }));
    } catch (e) {
      setError(e.message || 'Failed to update role');
    } finally {
      setRoleSaving(null);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!token) return;
    const { full_name, email, role, department, password, generate_password } = addUserForm;
    if (!full_name?.trim() || !email?.trim()) {
      setError('Full name and email are required');
      return;
    }
    if (!generate_password && (!password || password.length < 8)) {
      setError('Password must be at least 8 characters, or check "Generate temporary password"');
      return;
    }
    setError(null);
    setCreatingUser(true);
    try {
      const payload = {
        full_name: full_name.trim(),
        email: email.trim(),
        role,
        department: department.trim() || undefined,
        generate_password: !!generate_password,
      };
      if (!generate_password) payload.password = password;
      const data = await managementApi.createUser(payload, token);
      setCreatedCredentials(data);
      setAddUserForm({ full_name: '', email: '', role: 'FinanceOfficer', department: '', password: '', generate_password: true });
      setShowAddUser(false);
      const refreshed = await managementApi.getAllUsers(token);
      setUsersData(refreshed);
    } catch (err) {
      setError(err.message || err.error?.message || 'Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };

  const copyToClipboard = (text, label) => {
    if (typeof text !== 'string') return;
    navigator.clipboard?.writeText(text).then(() => {
      /* could show a brief "Copied" toast */
    }).catch(() => {});
  };

  const openEditUser = (u) => {
    setEditingUser(u);
    setEditForm({
      full_name: u.full_name ?? '',
      email: u.email ?? '',
      role: u.role ?? 'FinanceOfficer',
      department: u.department ?? '',
      password: '',
      generate_password: false,
    });
    setError(null);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!token || !editingUser) return;
    const { full_name, email, role, department, password, generate_password } = editForm;
    if (!full_name?.trim() || !email?.trim()) {
      setError('Full name and email are required');
      return;
    }
    if (password && !generate_password && password.length < 8) {
      setError('New password must be at least 8 characters, or check "Generate temporary password"');
      return;
    }
    setError(null);
    setUpdatingUser(true);
    try {
      const payload = {
        full_name: full_name.trim(),
        email: email.trim(),
        role,
        department: department.trim() || undefined,
      };
      if (generate_password) payload.generate_password = true;
      else if (password && password.length >= 8) payload.password = password;
      const data = await managementApi.updateUser(editingUser.user_id, payload, token);
      setEditingUser(null);
      if (data.temporaryPassword) {
        setCreatedCredentials({
          user: { ...editingUser, full_name: data.full_name, email: data.email, role: data.role, department: data.department },
          temporaryPassword: data.temporaryPassword,
          mfaSecret: null,
        });
      }
      const refreshed = await managementApi.getAllUsers(token);
      setUsersData(refreshed);
    } catch (err) {
      setError(err.message || err.error?.message || 'Failed to update user');
    } finally {
      setUpdatingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!token || !userToDelete) return;
    setDeletingUser(true);
    setError(null);
    try {
      await managementApi.deleteUser(userToDelete.user_id, token);
      setUserToDelete(null);
      const refreshed = await managementApi.getAllUsers(token);
      setUsersData(refreshed);
    } catch (err) {
      setError(err.message || err.error?.message || 'Failed to delete user');
    } finally {
      setDeletingUser(false);
    }
  };

  const formatDate = (str) => {
    if (!str) return '—';
    const d = new Date(str);
    return d.toLocaleString();
  };

  const handleExportActivity = async () => {
    if (!token) return;
    setActivityExporting(true);
    setError(null);
    try {
      const params = {
        ...(activityFilters.actionType && { actionType: activityFilters.actionType }),
        ...(activityFilters.userId && { userId: activityFilters.userId }),
        ...(activityFilters.fromDate && { fromDate: activityFilters.fromDate }),
        ...(activityFilters.toDate && { toDate: activityFilters.toDate }),
      };
      const url = await managementApi.exportActivity(params, token);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'activity-log.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message || 'Export failed');
    } finally {
      setActivityExporting(false);
    }
  };

  const handlePermissionChange = (role, permission, checked) => {
    setPermsEdit((prev) => {
      const p = prev ?? {};
      const list = (p[role] || []).slice();
      if (permission === 'all') {
        return { ...p, [role]: checked ? ['all'] : [] };
      }
      if (checked) {
        if (!list.includes(permission)) list.push(permission);
        const withoutAll = list.filter((x) => x !== 'all');
        return { ...p, [role]: withoutAll };
      }
      const next = list.filter((x) => x !== permission);
      return { ...p, [role]: next };
    });
    setPermsDirty((prev) => ({ ...(prev ?? {}), [role]: true }));
  };

  const handleSaveRolePermissions = async (role) => {
    if (!token) return;
    const list = (permsEdit && permsEdit[role]) || [];
    setPermsSaving(role);
    setError(null);
    try {
      await managementApi.updateRolePermissions(role, list, token);
      setPermsDirty((prev) => ({ ...(prev ?? {}), [role]: false }));
    } catch (e) {
      setError(e.message || 'Failed to save permissions');
    } finally {
      setPermsSaving(null);
    }
  };

  const permissionKeysForRole = (role) => {
    const keys = permissions?.permissionKeys || Object.keys(PERMISSION_LABELS || {});
    return Array.isArray(keys) ? keys.filter((k) => k !== 'all') : [];
  };

  const permissionsMatrix = Array.isArray(permissions?.matrix) ? permissions.matrix : [];
  const permissionsRoles = Array.isArray(permissions?.roles) ? permissions.roles : [];
  const hasPermissionsData = permissionsMatrix.length > 0 || permissionsRoles.length > 0;

  return (
    <div className="mgmt">
      <div className="mgmt__tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`mgmt__tab ${activeTab === tab.id ? 'mgmt__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mgmt__error" role="alert">
          {error}
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="mgmt__panel">
          <h2 className="mgmt__panel-title">Site overview</h2>
          <p className="mgmt__panel-desc">Monitor system status, users, and activity.</p>
          {overviewLoading && <p className="mgmt__loading">Loading…</p>}
          {!overviewLoading && (overview != null || health != null) && (
            <>
              {(health != null) && (
                <div className="mgmt__overview-section">
                  <h3 className="mgmt__overview-section-title">System status</h3>
                  <div className="mgmt__overview-grid mgmt__overview-grid--status">
                    <div className={`mgmt__stat mgmt__stat--${health.database === 'ok' ? 'ok' : 'error'}`}>
                      <span className="mgmt__stat-value">{health.database === 'ok' ? '✓' : '✗'}</span>
                      <span className="mgmt__stat-label">Database</span>
                    </div>
                    <div className="mgmt__stat mgmt__stat--ok">
                      <span className="mgmt__stat-value">✓</span>
                      <span className="mgmt__stat-label">API</span>
                    </div>
                    {emailStatus != null && (
                      <div className={`mgmt__stat mgmt__stat--${emailStatus.configured ? 'ok' : 'warn'}`}>
                        <span className="mgmt__stat-value">{emailStatus.configured ? '✓' : '—'}</span>
                        <span className="mgmt__stat-label">Email (SMTP)</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {overview != null && (
                <div className="mgmt__overview-section">
                  <h3 className="mgmt__overview-section-title">Counts</h3>
                  <div className="mgmt__overview-grid">
                    <div className="mgmt__stat">
                      <span className="mgmt__stat-value">{overview.totalUsers ?? 0}</span>
                      <span className="mgmt__stat-label">System users</span>
                    </div>
                    <div className="mgmt__stat">
                      <span className="mgmt__stat-value">{overview.totalEmployees ?? 0}</span>
                      <span className="mgmt__stat-label">Employees</span>
                    </div>
                    <div className="mgmt__stat">
                      <span className="mgmt__stat-value">{overview.totalClients ?? 0}</span>
                      <span className="mgmt__stat-label">Clients</span>
                    </div>
                    <div className="mgmt__stat">
                      <span className="mgmt__stat-value">{overview.totalBatches ?? 0}</span>
                      <span className="mgmt__stat-label">Payroll batches</span>
                    </div>
                    <div className="mgmt__stat">
                      <span className="mgmt__stat-value">{overview.totalPeriods ?? 0}</span>
                      <span className="mgmt__stat-label">Payroll periods</span>
                    </div>
                    <div className="mgmt__stat">
                      <span className="mgmt__stat-value">{overview.activityLast24h ?? 0}</span>
                      <span className="mgmt__stat-label">Activity (24h)</span>
                    </div>
                  </div>
                </div>
              )}
              {overview != null && (overview.lastLoginAt != null || overview.failedLogins24h != null) && (
                <div className="mgmt__overview-section">
                  <h3 className="mgmt__overview-section-title">Security</h3>
                  <div className="mgmt__overview-grid">
                    {overview.lastLoginAt != null && (
                      <div className="mgmt__stat">
                        <span className="mgmt__stat-value">{formatDate(overview.lastLoginAt)}</span>
                        <span className="mgmt__stat-label">Last login</span>
                      </div>
                    )}
                    {overview.failedLogins24h != null && (
                      <div className="mgmt__stat">
                        <span className="mgmt__stat-value">{overview.failedLogins24h}</span>
                        <span className="mgmt__stat-label">Failed logins (24h)</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
          {!overviewLoading && overview == null && health == null && (
            <p className="mgmt__loading">No overview data. Check that you are logged in and the server is running.</p>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="mgmt__panel">
          <h2 className="mgmt__panel-title">Main users and roles</h2>
          <p className="mgmt__panel-desc">System users who can log in. Add users, assign roles, and manage permissions here.</p>

          {createdCredentials && (
            <div className="mgmt__credentials-box">
              <h3 className="mgmt__credentials-title">Login credentials — share with the user</h3>
              <p className="mgmt__credentials-warn">Save these now; the password will not be shown again.</p>
              <div className="mgmt__credentials-grid">
                <div className="mgmt__credential-row">
                  <span className="mgmt__credential-label">Email</span>
                  <code className="mgmt__credential-value">{createdCredentials.user?.email}</code>
                  <button type="button" className="mgmt__credential-copy" onClick={() => copyToClipboard(createdCredentials.user?.email)}>Copy</button>
                </div>
                <div className="mgmt__credential-row">
                  <span className="mgmt__credential-label">Password</span>
                  <code className="mgmt__credential-value">{createdCredentials.temporaryPassword ?? '(as entered)'}</code>
                  {createdCredentials.temporaryPassword && (
                    <button type="button" className="mgmt__credential-copy" onClick={() => copyToClipboard(createdCredentials.temporaryPassword)}>Copy</button>
                  )}
                </div>
                {createdCredentials.mfaSecret && (
                  <div className="mgmt__credential-row">
                    <span className="mgmt__credential-label">MFA secret (for authenticator app)</span>
                    <code className="mgmt__credential-value mgmt__credential-value--secret">{createdCredentials.mfaSecret}</code>
                    <button type="button" className="mgmt__credential-copy" onClick={() => copyToClipboard(createdCredentials.mfaSecret)}>Copy</button>
                  </div>
                )}
              </div>
                {createdCredentials.mfaSecret && (
                  <p className="mgmt__credentials-mfa-hint">User must add this secret to Google Authenticator, Authy, or similar to complete login.</p>
                )}
              <button type="button" className="mgmt__credentials-done" onClick={() => setCreatedCredentials(null)}>Done</button>
            </div>
          )}

          {!createdCredentials && (
            <>
              {showAddUser ? (
                <form className="mgmt__add-user-form" onSubmit={handleCreateUser}>
                  <h3 className="mgmt__add-user-heading">Add new user</h3>
                  <div className="mgmt__add-user-grid">
                    <label className="mgmt__add-user-label">
                      Full name
                      <input
                        type="text"
                        className="mgmt__add-user-input"
                        value={addUserForm.full_name}
                        onChange={(e) => setAddUserForm((f) => ({ ...f, full_name: e.target.value }))}
                        placeholder="e.g. Jane Doe"
                        required
                      />
                    </label>
                    <label className="mgmt__add-user-label">
                      Email
                      <input
                        type="email"
                        className="mgmt__add-user-input"
                        value={addUserForm.email}
                        onChange={(e) => setAddUserForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="jane@company.com"
                        required
                      />
                    </label>
                    <label className="mgmt__add-user-label">
                      Role
                      <select
                        className="mgmt__add-user-input"
                        value={addUserForm.role}
                        onChange={(e) => setAddUserForm((f) => ({ ...f, role: e.target.value }))}
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>{(ROLE_LABELS || {})[r] ?? r}</option>
                        ))}
                      </select>
                    </label>
                    <label className="mgmt__add-user-label">
                      Department
                      <input
                        type="text"
                        className="mgmt__add-user-input"
                        value={addUserForm.department}
                        onChange={(e) => setAddUserForm((f) => ({ ...f, department: e.target.value }))}
                        placeholder="Optional"
                      />
                    </label>
                  </div>
                  <div className="mgmt__add-user-password-row">
                    <label className="mgmt__add-user-check">
                      <input
                        type="checkbox"
                        checked={addUserForm.generate_password}
                        onChange={(e) => setAddUserForm((f) => ({ ...f, generate_password: e.target.checked }))}
                      />
                      Generate temporary password
                    </label>
                    {!addUserForm.generate_password && (
                      <label className="mgmt__add-user-label mgmt__add-user-label--inline">
                        Password (min 8 characters)
                        <input
                          type="password"
                          className="mgmt__add-user-input"
                          value={addUserForm.password}
                          onChange={(e) => setAddUserForm((f) => ({ ...f, password: e.target.value }))}
                          placeholder="••••••••"
                          minLength={8}
                        />
                      </label>
                    )}
                  </div>
                  <div className="mgmt__add-user-actions">
                    <button type="submit" className="mgmt__add-user-submit" disabled={creatingUser}>
                      {creatingUser ? 'Creating…' : 'Create user'}
                    </button>
                    <button type="button" className="mgmt__add-user-cancel" onClick={() => { setShowAddUser(false); setError(null); }}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button type="button" className="mgmt__add-user-btn" onClick={() => setShowAddUser(true)}>
                  <UserPlus size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  Add user
                </button>
              )}
            </>
          )}

          {usersLoading && <p className="mgmt__loading">Loading…</p>}
          {!usersLoading && usersData.users?.length > 0 && (
            <div className="mgmt__table-wrap">
              <table className="mgmt__table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>MFA</th>
                    <th>Change role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersData.users.map((u) => {
                    const adminCount = (usersData.users || []).filter((x) => x.role === 'Admin').length;
                    const isOnlyAdmin = adminCount <= 1 && u.role === 'Admin';
                    const cannotDelete = u.user_id === user?.id || isOnlyAdmin;
                    return (
                    <tr key={`user-${u.user_id}`}>
                      <td>{u.full_name ?? '—'}</td>
                      <td>{u.email ?? '—'}</td>
                      <td>{(ROLE_LABELS || {})[u.role] ?? u.role}</td>
                      <td>{u.department ?? '—'}</td>
                      <td>{u.mfa_enabled ? 'Yes' : 'No'}</td>
                      <td>
                        <select
                          className="mgmt__role-select"
                          value={u.role}
                          disabled={roleSaving === u.user_id || u.user_id === user?.id}
                          onChange={(e) => handleRoleChange(u.user_id, e.target.value)}
                        >
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r} value={r}>{(ROLE_LABELS || {})[r] ?? r}</option>
                          ))}
                        </select>
                        {roleSaving === u.user_id && ' Saving…'}
                      </td>
                      <td>
                        <div className="mgmt__user-actions">
                          <button
                            type="button"
                            className="mgmt__btn-icon mgmt__btn-icon--edit"
                            onClick={() => openEditUser(u)}
                            title="Edit user"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            className="mgmt__btn-icon mgmt__btn-icon--delete"
                            onClick={() => setUserToDelete(u)}
                            disabled={cannotDelete}
                            title={cannotDelete ? (isOnlyAdmin ? 'Cannot delete the last Administrator' : 'Cannot delete yourself') : 'Delete user'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!usersLoading && (!usersData.users?.length) && (
            <p className="mgmt__loading">No system users found.</p>
          )}
        </div>
      )}

      {/* Edit user modal */}
      {editingUser && (
        <div className="mgmt__modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="mgmt__modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="mgmt__modal-title">Edit user</h3>
            <form onSubmit={handleUpdateUser} className="mgmt__add-user-form">
              <div className="mgmt__add-user-grid">
                <label className="mgmt__add-user-label">
                  Full name
                  <input
                    type="text"
                    className="mgmt__add-user-input"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))}
                    required
                  />
                </label>
                <label className="mgmt__add-user-label">
                  Email
                  <input
                    type="email"
                    className="mgmt__add-user-input"
                    value={editForm.email}
                    onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                    required
                  />
                </label>
                <label className="mgmt__add-user-label">
                  Role
                  <select
                    className="mgmt__add-user-input"
                    value={editForm.role}
                    onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>{(ROLE_LABELS || {})[r] ?? r}</option>
                    ))}
                  </select>
                </label>
                <label className="mgmt__add-user-label">
                  Department
                  <input
                    type="text"
                    className="mgmt__add-user-input"
                    value={editForm.department}
                    onChange={(e) => setEditForm((f) => ({ ...f, department: e.target.value }))}
                  />
                </label>
              </div>
              <div className="mgmt__add-user-password-row">
                <span className="mgmt__add-user-hint">Optional: set a new password</span>
                <label className="mgmt__add-user-check">
                  <input
                    type="checkbox"
                    checked={editForm.generate_password}
                    onChange={(e) => setEditForm((f) => ({ ...f, generate_password: e.target.checked }))}
                  />
                  Generate temporary password
                </label>
                {!editForm.generate_password && (
                  <label className="mgmt__add-user-label mgmt__add-user-label--inline">
                    New password (min 8 characters)
                    <input
                      type="password"
                      className="mgmt__add-user-input"
                      value={editForm.password}
                      onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                      placeholder="Leave blank to keep current"
                    />
                  </label>
                )}
              </div>
              <div className="mgmt__add-user-actions">
                <button type="submit" className="mgmt__add-user-submit" disabled={updatingUser}>
                  {updatingUser ? 'Saving…' : 'Save changes'}
                </button>
                <button type="button" className="mgmt__add-user-cancel" onClick={() => setEditingUser(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete user confirm */}
      {userToDelete && (
        <div className="mgmt__modal-overlay" onClick={() => setUserToDelete(null)}>
          <div className="mgmt__modal mgmt__modal--sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="mgmt__modal-title">Delete user</h3>
            <p className="mgmt__modal-text">
              Delete <strong>{userToDelete.full_name}</strong> ({userToDelete.email})? This cannot be undone.
            </p>
            <div className="mgmt__add-user-actions">
              <button
                type="button"
                className="mgmt__add-user-cancel"
                onClick={() => setUserToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="mgmt__btn-delete"
                onClick={handleDeleteUser}
                disabled={deletingUser}
              >
                {deletingUser ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="mgmt__panel">
          <h2 className="mgmt__panel-title">Activity log</h2>
          <p className="mgmt__panel-desc">Actions performed by system users on the site.</p>

          <div className="mgmt__filters-bar">
            <div className="mgmt__filter-group">
              <label className="mgmt__filter-label">Action type</label>
              <select
                className="mgmt__filter-input mgmt__filter-select"
                value={activityFilters.actionType}
                onChange={(e) => setActivityFilters((f) => ({ ...f, actionType: e.target.value }))}
              >
                {ACTIVITY_ACTION_OPTIONS.map((opt) => (
                  <option key={opt.value || '_any'} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="mgmt__filter-group">
              <label className="mgmt__filter-label">User ID</label>
              <input
                type="text"
                className="mgmt__filter-input"
                placeholder="Filter by user ID"
                value={activityFilters.userId}
                onChange={(e) => setActivityFilters((f) => ({ ...f, userId: e.target.value }))}
              />
            </div>
            <div className="mgmt__filter-group">
              <label className="mgmt__filter-label">From</label>
              <input
                type="date"
                className="mgmt__filter-input"
                value={activityFilters.fromDate}
                onChange={(e) => setActivityFilters((f) => ({ ...f, fromDate: e.target.value || '' }))}
              />
            </div>
            <div className="mgmt__filter-group">
              <label className="mgmt__filter-label">To</label>
              <input
                type="date"
                className="mgmt__filter-input"
                value={activityFilters.toDate}
                onChange={(e) => setActivityFilters((f) => ({ ...f, toDate: e.target.value || '' }))}
              />
            </div>
            <div className="mgmt__filter-actions">
              <button
                type="button"
                className="mgmt__filter-apply"
                onClick={() => setActivityOffset(0)}
              >
                Apply filters
              </button>
              <button
                type="button"
                className="mgmt__filter-apply"
                onClick={handleExportActivity}
                disabled={activityExporting}
              >
                {activityExporting ? 'Exporting…' : 'Export CSV'}
              </button>
            </div>
          </div>

          {activityLoading && <p className="mgmt__loading">Loading…</p>}
          {!activityLoading && (
            <>
              {(activity.items?.length ?? 0) === 0 ? (
                <p className="mgmt__loading">No activity records.</p>
              ) : (
                <>
                  <div className="mgmt__table-wrap">
                    <table className="mgmt__table mgmt__activity-table">
                      <thead>
                        <tr>
                          <th>Date & time</th>
                          <th>User</th>
                          <th>Action</th>
                          <th>IP</th>
                          <th>Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activity.items.map((row) => {
                          const rowId = row.audit_id ?? `${row.timestamp}-${row.user_id}-${row.action_type}`;
                          const isExpanded = expandedDetailsId === rowId;
                          const Icon = getActionIcon(row.action_type);
                          const detailsObj = row.details != null && typeof row.details === 'object' ? row.details : null;
                          const hasDetails = detailsObj && Object.keys(detailsObj).length > 0;
                          const summary = formatDetailsSummary(row.details);
                          return (
                            <tr key={rowId} className="mgmt__activity-tr">
                              <td className="mgmt__activity-date">{formatDate(row.timestamp)}</td>
                              <td className="mgmt__activity-user">
                                {row.user_name || row.user_email || (row.user_id != null ? `User #${row.user_id}` : '—')}
                              </td>
                              <td>
                                <span className={`mgmt__action-badge ${getActionBadgeClass(row.action_type)}`}>
                                  <Icon size={14} className="mgmt__action-icon" />
                                  {row.action_type ?? '—'}
                                </span>
                              </td>
                              <td className="mgmt__activity-ip">
                                {row.ip_address != null && row.ip_address !== '' ? (
                                  <span className="mgmt__ip"><Globe size={12} /> {String(row.ip_address)}</span>
                                ) : '—'}
                              </td>
                              <td className="mgmt__activity-details-cell">
                                {hasDetails ? (
                                  <>
                                    <button
                                      type="button"
                                      className="mgmt__details-toggle"
                                      onClick={() => setExpandedDetailsId(isExpanded ? null : rowId)}
                                      aria-expanded={isExpanded}
                                    >
                                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                      <span>{summary}</span>
                                    </button>
                                    {isExpanded && (
                                      <pre className="mgmt__details-json">
                                        {JSON.stringify(detailsObj, null, 2)}
                                      </pre>
                                    )}
                                  </>
                                ) : summary ? (
                                  <span className="mgmt__details-inline">{summary}</span>
                                ) : (
                                  '—'
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="mgmt__pagination">
                    <button
                      type="button"
                      className="mgmt__pagination-btn"
                      disabled={activityOffset === 0}
                      onClick={() => setActivityOffset((o) => Math.max(0, o - activityLimit))}
                    >
                      <ChevronLeft size={16} style={{ verticalAlign: 'middle' }} /> Previous
                    </button>
                    <span className="mgmt__pagination-info">
                      {activity.items.length === 0
                        ? `0 of ${activity.total}`
                        : `${activityOffset + 1}–${Math.min(activityOffset + activityLimit, activity.total)} of ${activity.total}`}
                    </span>
                    <button
                      type="button"
                      className="mgmt__pagination-btn"
                      disabled={activityOffset + activityLimit >= activity.total}
                      onClick={() => setActivityOffset((o) => o + activityLimit)}
                    >
                      Next <ChevronRight size={16} style={{ verticalAlign: 'middle' }} />
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'permissions' && (
        <div className="mgmt__panel">
          <h2 className="mgmt__panel-title">Role permissions</h2>
          <p className="mgmt__panel-desc">
            Edit permissions for each role. Changes take effect immediately for access control. To change a user&apos;s role, use <strong>Users &amp; Access</strong>.
          </p>
          {permsLoading && <p className="mgmt__loading">Loading…</p>}
          {!permsLoading && hasPermissionsData && (
            <div className="mgmt__perms-grid">
              {(permissionsMatrix.length ? permissionsMatrix : permissionsRoles.map((r) => ({ role: r, permissions: [] })))
                .filter((entry) => entry.role !== 'Employee')
                .map((entry) => {
                const role = entry.role;
                const current = (permsEdit && permsEdit[role]) || entry.permissions || [];
                const hasAll = Array.isArray(current) && current.includes('all');
                const keys = permissionKeysForRole(role);
                return (
                  <div key={role} className="mgmt__perms-card">
                    <div className="mgmt__perms-card-header">
                      <span className="mgmt__perms-role">{(ROLE_LABELS || {})[role] ?? role}</span>
                      {(permsDirty?.[role] || permsSaving === role) && (
                        <span className="mgmt__perms-actions">
                          {permsSaving === role ? (
                            <span className="mgmt__perms-saving">Saving…</span>
                          ) : (
                            <button
                              type="button"
                              className="mgmt__perms-save-btn"
                              onClick={() => handleSaveRolePermissions(role)}
                            >
                              Save
                            </button>
                          )}
                        </span>
                      )}
                    </div>
                    <div className="mgmt__perms-card-section">
                      <label className="mgmt__perms-check-row">
                        <input
                          type="checkbox"
                          checked={hasAll}
                          onChange={(e) => handlePermissionChange(role, 'all', e.target.checked)}
                        />
                        <span className="mgmt__perm-label">{(PERMISSION_LABELS || {}).all || 'Full access (all permissions)'}</span>
                      </label>
                    </div>
                    {!hasAll && (
                      <div className="mgmt__perms-card-section">
                        <span className="mgmt__perms-section-title">Permission capabilities</span>
                        <div className="mgmt__perms-check-list">
                          {keys.map((p) => (
                            <label key={p} className="mgmt__perms-check-row">
                              <input
                                type="checkbox"
                                checked={Array.isArray(permsEdit?.[role]) && permsEdit[role].includes(p)}
                                onChange={(e) => handlePermissionChange(role, p, e.target.checked)}
                              />
                              <span className="mgmt__perm-label">{(PERMISSION_LABELS || {})[p] || p}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mgmt__perms-card-section">
                      <span className="mgmt__perms-section-title">Can access in the app</span>
                      <p className="mgmt__perms-access">{(ROLE_FEATURE_ACCESS || {})[role] ?? '—'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {!permsLoading && !hasPermissionsData && (
            <p className="mgmt__loading">No permission data.</p>
          )}
        </div>
      )}

      {activeTab === 'docs' && (
        <div className="mgmt__panel">
          <h2 className="mgmt__panel-title">Docs &amp; Runbook</h2>
          <p className="mgmt__panel-desc">Quick reference for Tech Admin tasks.</p>
          <div className="mgmt__docs-content">
            <section className="mgmt__docs-section">
              <h3 className="mgmt__docs-heading">Create Tech Admin user</h3>
              <p>From the server (backend folder):</p>
              <pre className="mgmt__docs-code">node scripts/create-tech-admin.mjs</pre>
              <p>Save the printed email, password, and MFA secret. Add the secret to Google Authenticator or Authy.</p>
            </section>
            <section className="mgmt__docs-section">
              <h3 className="mgmt__docs-heading">Run migrations</h3>
              <p>From the backend folder, with <code>DATABASE_URL</code> set:</p>
              <pre className="mgmt__docs-code">psql &quot;$DATABASE_URL&quot; -f migrations/014_add_tech_admin_role.sql
psql &quot;$DATABASE_URL&quot; -f migrations/015_add_management_audit_actions.sql</pre>
            </section>
            <section className="mgmt__docs-section">
              <h3 className="mgmt__docs-heading">Production URL</h3>
              <p>Site: <strong>https://payroll.hcsolutions-rw.com</strong>. Backend <code>CORS_ORIGINS</code> and <code>APP_URL</code> should match. Frontend: do not set <code>VITE_API_BASE_URL</code> when building so the app uses same-origin <code>/api</code>.</p>
            </section>
            <section className="mgmt__docs-section">
              <h3 className="mgmt__docs-heading">Restart backend</h3>
              <p>After changing <code>.env</code> or code:</p>
              <pre className="mgmt__docs-code">pm2 restart all
# or: sudo systemctl restart your-backend-service</pre>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
