import { useState, useEffect } from 'react';
import { Pencil, Trash2, AlertTriangle, UserPlus, X } from 'lucide-react';
import { apiClient } from '../api/client';
import useAuth from '../hooks/useAuth';
import './EmployeesPage.css';

const ROLE_LABELS = {
  FinanceOfficer: 'Finance Officer',
  HR: 'HR Manager',
  ManagingDirector: 'Managing Director',
};

const ROLE_COLORS = {
  FinanceOfficer: '#f5911f',
  HR: '#6366f1',
  ManagingDirector: '#10b981',
};

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    role: 'FinanceOfficer',
    department: '',
    temporaryPassword: '',
  });
  const [createError, setCreateError] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/users', { token });
      setUsers(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser({ ...user });
  };

  const handleSaveEdit = async () => {
    try {
      await apiClient.put(
        `/users/${editingUser.user_id}`,
        {
          fullName: editingUser.full_name,
          email: editingUser.email,
          role: editingUser.role,
          department: editingUser.department || null,
        },
        { token }
      );
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      alert('Failed to update user: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDelete = async (userId) => {
    try {
      await apiClient.delete(`/users/${userId}`, { token });
      setDeleteConfirm(null);
      fetchUsers();
    } catch (err) {
      alert('Failed to delete user: ' + (err.message || 'Unknown error'));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);
    try {
      await apiClient.post('/users', createForm, { token });
      setShowCreateForm(false);
      setCreateForm({ fullName: '', email: '', role: 'FinanceOfficer', department: '', temporaryPassword: '' });
      fetchUsers();
    } catch (err) {
      setCreateError(err.message || 'Failed to create user');
    } finally {
      setCreateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="employees-page">
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="employees-page">
        <div className="error-banner">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const grouped = {
    FinanceOfficer: users.filter(u => u.role === 'FinanceOfficer'),
    HR: users.filter(u => u.role === 'HR'),
    ManagingDirector: users.filter(u => u.role === 'ManagingDirector'),
  };

  return (
    <div className="employees-page">
      <div className="employees-header">
        <div>
          <h1 className="employees-title">User Management</h1>
          <p className="employees-subtitle">
            Manage system users: Finance Officers, HR Managers, and Managing Directors
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowCreateForm(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <UserPlus size={16} />
          Add User
        </button>
      </div>

      {/* Create User Modal */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2>Add New User</h2>
              <button className="modal-close" onClick={() => setShowCreateForm(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="edit-form" style={{ padding: '20px' }}>
              {createError && (
                <div className="error-banner" style={{ marginBottom: 12 }}>
                  <AlertTriangle size={16} />
                  <span>{createError}</span>
                </div>
              )}
              <label className="form-label">Full Name *</label>
              <input
                className="form-input"
                value={createForm.fullName}
                onChange={e => setCreateForm(p => ({ ...p, fullName: e.target.value }))}
                required
              />
              <label className="form-label">Email *</label>
              <input
                className="form-input"
                type="email"
                value={createForm.email}
                onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))}
                required
              />
              <label className="form-label">Role *</label>
              <select
                className="form-input"
                value={createForm.role}
                onChange={e => setCreateForm(p => ({ ...p, role: e.target.value }))}
              >
                <option value="FinanceOfficer">Finance Officer</option>
                <option value="HR">HR Manager</option>
                <option value="ManagingDirector">Managing Director</option>
              </select>
              <label className="form-label">Department</label>
              <input
                className="form-input"
                value={createForm.department}
                onChange={e => setCreateForm(p => ({ ...p, department: e.target.value }))}
                placeholder="e.g. Finance Department"
              />
              <label className="form-label">Temporary Password *</label>
              <input
                className="form-input"
                type="text"
                value={createForm.temporaryPassword}
                onChange={e => setCreateForm(p => ({ ...p, temporaryPassword: e.target.value }))}
                placeholder="Min 10 characters"
                required
                minLength={10}
              />
              <div className="edit-form-actions" style={{ marginTop: 20 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={createLoading}>
                  {createLoading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users grouped by role */}
      {Object.entries(grouped).map(([role, roleUsers]) => (
        <div key={role} style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: ROLE_COLORS[role],
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary, #1e293b)' }}>
              {ROLE_LABELS[role]}
              <span style={{ marginLeft: 8, fontSize: '0.85rem', fontWeight: 400, color: '#64748b' }}>
                ({roleUsers.length})
              </span>
            </h2>
          </div>

          {roleUsers.length === 0 ? (
            <p style={{ color: '#94a3b8', fontStyle: 'italic', paddingLeft: 22, fontSize: '0.9rem' }}>
              No {ROLE_LABELS[role]}s found.
            </p>
          ) : (
            <div className="employees-table-wrapper">
              <table className="employees-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roleUsers.map(user => (
                    <tr key={user.user_id}>
                      <td>{user.full_name}</td>
                      <td>{user.email || '—'}</td>
                      <td>{user.department || '—'}</td>
                      <td>
                        <span
                          className="status-badge"
                          style={{
                            background: user.status === 'ACTIVE' ? '#dcfce7' : '#fef2f2',
                            color: user.status === 'ACTIVE' ? '#16a34a' : '#dc2626',
                          }}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-icon"
                            title="Edit"
                            onClick={() => handleEdit(user)}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="btn-icon btn-icon--danger"
                            title="Delete"
                            onClick={() => setDeleteConfirm(user)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      {/* Edit Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2>Edit User</h2>
              <button className="modal-close" onClick={() => setEditingUser(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="edit-form" style={{ padding: '20px' }}>
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                value={editingUser.full_name}
                onChange={e => setEditingUser(p => ({ ...p, full_name: e.target.value }))}
              />
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                value={editingUser.email || ''}
                onChange={e => setEditingUser(p => ({ ...p, email: e.target.value }))}
              />
              <label className="form-label">Role</label>
              <select
                className="form-input"
                value={editingUser.role}
                onChange={e => setEditingUser(p => ({ ...p, role: e.target.value }))}
              >
                <option value="FinanceOfficer">Finance Officer</option>
                <option value="HR">HR Manager</option>
                <option value="ManagingDirector">Managing Director</option>
              </select>
              <label className="form-label">Department</label>
              <input
                className="form-input"
                value={editingUser.department || ''}
                onChange={e => setEditingUser(p => ({ ...p, department: e.target.value }))}
              />
              <label className="form-label">Status</label>
              <select
                className="form-input"
                value={editingUser.status}
                onChange={e => setEditingUser(p => ({ ...p, status: e.target.value }))}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              <div className="edit-form-actions" style={{ marginTop: 20 }}>
                <button className="btn-secondary" onClick={() => setEditingUser(null)}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleSaveEdit}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <AlertTriangle size={20} color="#dc2626" />
              <h2 style={{ color: '#dc2626', margin: 0 }}>Delete User</h2>
            </div>
            <p style={{ padding: '16px 20px', color: '#475569' }}>
              Are you sure you want to delete <strong>{deleteConfirm.full_name}</strong>? This action cannot be undone.
            </p>
            <div className="edit-form-actions" style={{ padding: '0 20px 20px' }}>
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={() => handleDelete(deleteConfirm.user_id)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
