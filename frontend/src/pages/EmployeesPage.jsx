import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import useAuth from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import './EmployeesPage.css';

const EmployeesPage = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const { token } = useAuth();
    const { t } = useLanguage();

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/employees', { token });
            // Hide system login accounts — only show payroll employees
            const SYSTEM_ROLES = ['FinanceOfficer', 'HR', 'ManagingDirector', 'Admin'];
            setEmployees((response.data || []).filter(e => !SYSTEM_ROLES.includes(e.role)));
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
            nationalId: employee.national_id || '',
        });
    };

    const handleSaveEdit = async () => {
        try {
            await apiClient.put(
                `/employees/${editingEmployee.employee_id}`,
                {
                    fullName: editingEmployee.full_name,
                    email: editingEmployee.email || undefined,
                    phoneNumber: editingEmployee.phoneNumber,
                    bankName: editingEmployee.bankName,
                    accountHolderName: editingEmployee.accountHolderName,
                    nationalId: editingEmployee.nationalId,
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
                <div className="loading">{t('loadingEmployees')}</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="employees-page">
                <div className="error">{t('error')}: {error}</div>
                <button onClick={fetchEmployees}>{t('retry')}</button>
            </div>
        );
    }

    return (
        <div className="employees-page">
            <header className="page-header">
                <h1>{t('employeeManagement')}</h1>
                <p>{t('manageEmployeeInfo')}</p>
            </header>

            <div className="employees-table-container">
                <table className="employees-table">
                    <thead>
                        <tr>
                            <th>{t('id')}</th>
                            <th>{t('name')}</th>
                            <th>{t('email')}</th>
                            <th>{t('role')}</th>
                            <th>{t('phone')}</th>
                            <th>{t('bank')}</th>
                            <th>National ID</th>
                            <th>{t('created')}</th>
                            <th>{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((employee) => (
                            <tr key={employee.employee_id}>
                                <td>{employee.employee_id}</td>
                                <td>{employee.full_name}</td>
                                <td>{employee.email || '—'}</td>
                                <td>
                                    <span className={`role-badge role-${employee.role.toLowerCase()}`}>
                                        {employee.role}
                                    </span>
                                </td>
                                <td>{employee.phone_number || '—'}</td>
                                <td>{employee.bank_name || '—'}</td>
                                <td>{employee.national_id || '—'}</td>
                                <td>{new Date(employee.created_at).toLocaleDateString()}</td>
                                <td className="actions">
                                    <button
                                        className="btn-edit"
                                        onClick={() => handleEdit(employee)}
                                    >
                                        ✏️ {t('edit')}
                                    </button>
                                    <button
                                        className="btn-delete"
                                        onClick={() => setDeleteConfirm(employee)}
                                    >
                                        🗑️ {t('delete')}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {employees.length === 0 && (
                    <div className="empty-state">
                        <p>{t('noEmployeesFound')}</p>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingEmployee && (
                <div className="modal-overlay" onClick={() => setEditingEmployee(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{t('editEmployee')}</h2>

                        <div className="form-group">
                            <label>{t('fullName')}</label>
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
                            <label>{t('email')} <span style={{ fontSize: '0.8em', color: '#94a3b8' }}>(optional)</span></label>
                            <input
                                type="email"
                                value={editingEmployee.email || ''}
                                onChange={(e) => setEditingEmployee({
                                    ...editingEmployee,
                                    email: e.target.value
                                })}
                            />
                        </div>

                        <div className="form-group">
                            <label>{t('phoneNumber')}</label>
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
                            <label>{t('bankName')}</label>
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
                            <label>{t('accountHolderName')}</label>
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
                            <label>National ID <span style={{ fontSize: '0.8em', color: '#94a3b8' }}>(optional)</span></label>
                            <input
                                type="text"
                                value={editingEmployee.nationalId}
                                onChange={(e) => setEditingEmployee({
                                    ...editingEmployee,
                                    nationalId: e.target.value
                                })}
                            />
                        </div>

                        <div className="form-group">
                            <label>{t('role')}</label>
                            <select
                                value={editingEmployee.role}
                                onChange={(e) => setEditingEmployee({
                                    ...editingEmployee,
                                    role: e.target.value
                                })}
                            >
                                <option value="Employee">{t('employee')}</option>
                                <option value="Admin">{t('adminLegacy')}</option>
                                <option value="HR">{t('hr')}</option>
                                <option value="FinanceOfficer">{t('financeOfficer')}</option>
                            </select>
                        </div>

                        <div className="modal-actions">
                            <button
                                className="btn-cancel"
                                onClick={() => setEditingEmployee(null)}
                            >
                                {t('cancel')}
                            </button>
                            <button
                                className="btn-save"
                                onClick={handleSaveEdit}
                            >
                                {t('saveChanges')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal-content modal-confirm" onClick={(e) => e.stopPropagation()}>
                        <h2>⚠️ {t('confirmDelete')}</h2>
                        <p>
                            {t('deleteConfirmation')} <strong>{deleteConfirm.full_name}</strong>?
                        </p>
                        <p className="warning-text">
                            {t('deleteWarning')}
                        </p>

                        <div className="modal-actions">
                            <button
                                className="btn-cancel"
                                onClick={() => setDeleteConfirm(null)}
                            >
                                {t('cancel')}
                            </button>
                            <button
                                className="btn-delete-confirm"
                                onClick={() => handleDelete(deleteConfirm.employee_id)}
                            >
                                {t('deleteEmployeeButton')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeesPage;
