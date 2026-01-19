import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import useAuth from '../hooks/useAuth';
import './EmployeesPage.css';

const EmployeesPage = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const { token } = useAuth();

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/employees', { token });
            setEmployees(response.data || []);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to load employees');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (employee) => {
        setEditingEmployee({
            ...employee,
            phoneNumber: employee.phone_number || '',
            bankName: employee.bank_name || '',
            accountHolderName: employee.account_holder_name || '',
        });
    };

    const handleSaveEdit = async () => {
        try {
            await apiClient.put(
                `/employees/${editingEmployee.employee_id}`,
                {
                    fullName: editingEmployee.full_name,
                    email: editingEmployee.email,
                    phoneNumber: editingEmployee.phoneNumber,
                    bankName: editingEmployee.bankName,
                    accountHolderName: editingEmployee.accountHolderName,
                    role: editingEmployee.role,
                },
                { token }
            );

            setEditingEmployee(null);
            fetchEmployees();
        } catch (err) {
            alert('Failed to update employee: ' + (err.message || 'Unknown error'));
        }
    };

    const handleDelete = async (employeeId) => {
        try {
            await apiClient.delete(`/employees/${employeeId}`, { token });
            setDeleteConfirm(null);
            fetchEmployees();
        } catch (err) {
            alert('Failed to delete employee: ' + (err.message || 'Unknown error'));
        }
    };

    if (loading) {
        return (
            <div className="employees-page">
                <div className="loading">Loading employees...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="employees-page">
                <div className="error">Error: {error}</div>
                <button onClick={fetchEmployees}>Retry</button>
            </div>
        );
    }

    return (
        <div className="employees-page">
            <header className="page-header">
                <h1>Employee Management</h1>
                <p>Manage employee information and access</p>
            </header>

            <div className="employees-table-container">
                <table className="employees-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Phone</th>
                            <th>Bank</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((employee) => (
                            <tr key={employee.employee_id}>
                                <td>{employee.employee_id}</td>
                                <td>{employee.full_name}</td>
                                <td>{employee.email}</td>
                                <td>
                                    <span className={`role-badge role-${employee.role.toLowerCase()}`}>
                                        {employee.role}
                                    </span>
                                </td>
                                <td>{employee.phone_number || '—'}</td>
                                <td>{employee.bank_name || '—'}</td>
                                <td>{new Date(employee.created_at).toLocaleDateString()}</td>
                                <td className="actions">
                                    <button
                                        className="btn-edit"
                                        onClick={() => handleEdit(employee)}
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        className="btn-delete"
                                        onClick={() => setDeleteConfirm(employee)}
                                    >
                                        🗑️ Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {employees.length === 0 && (
                    <div className="empty-state">
                        <p>No employees found</p>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingEmployee && (
                <div className="modal-overlay" onClick={() => setEditingEmployee(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Edit Employee</h2>

                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                value={editingEmployee.full_name}
                                onChange={(e) => setEditingEmployee({
                                    ...editingEmployee,
                                    full_name: e.target.value
                                })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={editingEmployee.email}
                                onChange={(e) => setEditingEmployee({
                                    ...editingEmployee,
                                    email: e.target.value
                                })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Phone Number</label>
                            <input
                                type="tel"
                                value={editingEmployee.phoneNumber}
                                onChange={(e) => setEditingEmployee({
                                    ...editingEmployee,
                                    phoneNumber: e.target.value
                                })}
                                placeholder="+250 XXX XXX XXX"
                            />
                        </div>

                        <div className="form-group">
                            <label>Bank Name</label>
                            <input
                                type="text"
                                value={editingEmployee.bankName}
                                onChange={(e) => setEditingEmployee({
                                    ...editingEmployee,
                                    bankName: e.target.value
                                })}
                                placeholder="e.g. Bank of Kigali"
                            />
                        </div>

                        <div className="form-group">
                            <label>Account Holder Name</label>
                            <input
                                type="text"
                                value={editingEmployee.accountHolderName}
                                onChange={(e) => setEditingEmployee({
                                    ...editingEmployee,
                                    accountHolderName: e.target.value
                                })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Role</label>
                            <select
                                value={editingEmployee.role}
                                onChange={(e) => setEditingEmployee({
                                    ...editingEmployee,
                                    role: e.target.value
                                })}
                            >
                                <option value="Employee">Employee</option>
                                <option value="Admin">Admin (Legacy)</option>
                                <option value="HR">HR</option>
                                <option value="FinanceOfficer">Finance Officer</option>
                            </select>
                        </div>

                        <div className="modal-actions">
                            <button
                                className="btn-cancel"
                                onClick={() => setEditingEmployee(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-save"
                                onClick={handleSaveEdit}
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal-content modal-confirm" onClick={(e) => e.stopPropagation()}>
                        <h2>⚠️ Confirm Delete</h2>
                        <p>
                            Are you sure you want to delete <strong>{deleteConfirm.full_name}</strong>?
                        </p>
                        <p className="warning-text">
                            This action cannot be undone. All salary records for this employee will remain in the system.
                        </p>

                        <div className="modal-actions">
                            <button
                                className="btn-cancel"
                                onClick={() => setDeleteConfirm(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-delete-confirm"
                                onClick={() => handleDelete(deleteConfirm.employee_id)}
                            >
                                Delete Employee
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeesPage;
