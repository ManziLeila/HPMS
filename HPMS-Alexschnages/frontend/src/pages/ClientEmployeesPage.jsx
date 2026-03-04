import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Pencil, Trash2, AlertTriangle, ArrowLeft, UserPlus, FileSpreadsheet, FileText, Eye, Download } from 'lucide-react';
import { apiClient, API_BASE_URL } from '../api/client';
import useAuth from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import './EmployeesPage.css';
import './ClientEmployeesPage.css';

const ClientEmployeesPage = () => {
    const { clientId } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [clientContracts, setClientContracts] = useState([]);
    const [clientContractModal, setClientContractModal] = useState(null); // null | 'add' | contract for edit
    const [clientContractForm, setClientContractForm] = useState({ contractType: 'service-agreement', startDate: '', endDate: '', notes: '', contractDocument: null });
    const [savingContract, setSavingContract] = useState(false);
    const [viewContractDetails, setViewContractDetails] = useState(null); // 'client' | { employee } for employee contract
    const { token } = useAuth();
    const { t } = useLanguage();

    useEffect(() => {
        if (clientId) {
            fetchClientAndEmployees();
        }
    }, [clientId]);

    const fetchClientAndEmployees = async () => {
        try {
            setLoading(true);
            const [clientRes, employeesRes, contractsRes] = await Promise.all([
                apiClient.get(`/clients/${clientId}`, { token }),
                apiClient.get(`/clients/${clientId}/employees`, { token }),
                apiClient.get(`/clients/${clientId}/contracts`, { token }),
            ]);
            setClient(clientRes);
            const list = employeesRes.data || [];
            setClientContracts(contractsRes?.data || []);
            const SYSTEM_ROLES = ['FinanceOfficer', 'HR', 'ManagingDirector', 'Admin'];
            setEmployees(list.filter((e) => !SYSTEM_ROLES.includes(e.role)));
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to load data');
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
                    email: editingEmployee.email || undefined,
                    phoneNumber: editingEmployee.phoneNumber,
                    bankName: editingEmployee.bankName,
                    accountHolderName: editingEmployee.accountHolderName,
                    role: editingEmployee.role,
                },
                { token }
            );
            setEditingEmployee(null);
            fetchClientAndEmployees();
        } catch (err) {
            alert('Failed to update employee: ' + (err.message || 'Unknown error'));
        }
    };

    const handleDelete = async (employeeId) => {
        try {
            await apiClient.delete(`/employees/${employeeId}`, { token });
            setDeleteConfirm(null);
            fetchClientAndEmployees();
        } catch (err) {
            alert('Failed to delete employee: ' + (err.message || 'Unknown error'));
        }
    };

    const openAddClientContract = () => {
        setClientContractForm({ contractType: 'service-agreement', startDate: '', endDate: '', notes: '', contractDocument: null });
        setClientContractModal('add');
    };
    const openEditClientContract = (contract) => {
        setClientContractForm({
            contractType: contract.contract_type || 'service-agreement',
            startDate: contract.start_date?.slice(0, 10) || '',
            endDate: contract.end_date?.slice(0, 10) || '',
            notes: contract.notes || '',
            contractDocument: null,
        });
        setClientContractModal(contract);
    };
    const saveClientContract = async () => {
        if (!clientContractForm.startDate) {
            alert(t('clientContractStartRequired') || 'Start date is required.');
            return;
        }
        setSavingContract(true);
        try {
            const hasFile = !!clientContractForm.contractDocument;
            if (hasFile) {
                const formData = new FormData();
                formData.append('contractType', clientContractForm.contractType);
                formData.append('startDate', clientContractForm.startDate);
                if (clientContractForm.endDate) formData.append('endDate', clientContractForm.endDate);
                if (clientContractForm.notes) formData.append('notes', clientContractForm.notes);
                formData.append('contractDocument', clientContractForm.contractDocument);
                if (clientContractModal === 'add') {
                    await apiClient.postForm(`/clients/${clientId}/contracts`, formData, { token });
                } else {
                    await apiClient.putForm(`/clients/${clientId}/contracts/${clientContractModal.contract_id}`, formData, { token });
                }
            } else {
                if (clientContractModal === 'add') {
                    await apiClient.post(`/clients/${clientId}/contracts`, {
                        contractType: clientContractForm.contractType,
                        startDate: clientContractForm.startDate,
                        endDate: clientContractForm.endDate || null,
                        notes: clientContractForm.notes || null,
                    }, { token });
                } else {
                    await apiClient.put(`/clients/${clientId}/contracts/${clientContractModal.contract_id}`, {
                        contractType: clientContractForm.contractType,
                        startDate: clientContractForm.startDate,
                        endDate: clientContractForm.endDate || null,
                        notes: clientContractForm.notes || null,
                    }, { token });
                }
            }
            setClientContractModal(null);
            fetchClientAndEmployees();
        } catch (err) {
            alert(err.message || 'Failed to save client contract');
        } finally {
            setSavingContract(false);
        }
    };

    const downloadContractDocument = async (type, contractId, filename = 'contract.pdf') => {
        const url = type === 'client'
            ? `${API_BASE_URL}/clients/${clientId}/contracts/${contractId}/download`
            : `${API_BASE_URL}/contracts/${contractId}/download`;
        try {
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error('Download failed');
            const blob = await res.blob();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            a.click();
            URL.revokeObjectURL(a.href);
        } catch (err) {
            alert(err.message || 'Failed to download document');
        }
    };

    const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');
    const getRemainingDays = (endDate) => {
        if (!endDate) return null;
        const end = new Date(endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        return Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    };

    // Use client contract as fallback so table matches summary when employee has no individual contract
    const clientContractStart = clientContracts[0]?.start_date ?? null;
    const clientContractEnd = clientContracts[0]?.end_date ?? null;
    const displayContractStart = (emp) => emp.contract_start_date ?? clientContractStart;
    const displayContractEnd = (emp) => emp.contract_end_date ?? clientContractEnd;

    if (loading) {
        return (
            <div className="employees-page client-employees-page">
                <div className="loading">{t('loadingEmployees')}</div>
            </div>
        );
    }

    if (error || !client) {
        return (
            <div className="employees-page client-employees-page">
                <div className="error">{t('error')}: {error || 'Client not found'}</div>
                <button type="button" className="back-link" onClick={() => navigate('/clients')}>
                    <ArrowLeft size={18} /> Back to Clients
                </button>
            </div>
        );
    }

    return (
        <div className="employees-page client-employees-page">
            <nav className="client-breadcrumb">
                <button type="button" className="back-link" onClick={() => navigate('/clients')}>
                    <ArrowLeft size={18} /> Clients
                </button>
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-current">{client.name}</span>
            </nav>

            <header className="page-header page-header--row">
                <div>
                    <h1>{client.name} — {t('employees') || 'Employees'}</h1>
                    <p>{t('manageEmployeeInfo') || 'Manage employee information and access.'}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        type="button"
                        className="btn-add-employee"
                        onClick={() => navigate(`/employees/new?clientId=${clientId}`)}
                    >
                        <UserPlus size={20} aria-hidden /> {t('addEmployee') || 'Add employee'}
                    </button>
                    <button
                        type="button"
                        className="btn-bulk-upload"
                        onClick={() => navigate(`/clients/${clientId}/bulk-upload`)}
                    >
                        <FileSpreadsheet size={20} aria-hidden /> Bulk Upload
                    </button>
                </div>
            </header>

            <div className="client-employees-summary">
                <div className="client-employees-summary__stats">
                    <article className="client-employees-summary__stat">
                        <p className="client-employees-summary__stat-label">{t('numberOfEmployees') || 'Number of employees'}</p>
                        <p className="client-employees-summary__stat-value" style={{ color: '#10b981' }}>{employees.length}</p>
                    </article>
                    <article className="client-employees-summary__stat">
                        <p className="client-employees-summary__stat-label">{t('contractStart') || 'Contract start'}</p>
                        <p className="client-employees-summary__stat-value">
                            {clientContracts.length > 0 ? formatDate(clientContracts[0].start_date) : '—'}
                        </p>
                    </article>
                    <article className="client-employees-summary__stat">
                        <p className="client-employees-summary__stat-label">{t('contractEnd') || 'Contract end'}</p>
                        <p className="client-employees-summary__stat-value">
                            {clientContracts.length > 0 ? formatDate(clientContracts[0].end_date) : '—'}
                        </p>
                    </article>
                    <article className="client-employees-summary__stat">
                        <p className="client-employees-summary__stat-label">{t('daysRemaining') || 'Days remaining'}</p>
                        <p className="client-employees-summary__stat-value" style={{
                            color: clientContracts.length > 0 && clientContracts[0].end_date
                                ? getRemainingDays(clientContracts[0].end_date) < 0
                                    ? '#ef4444'
                                    : getRemainingDays(clientContracts[0].end_date) <= 30
                                        ? '#f59e0b'
                                        : '#10b981'
                                : '#94a3b8',
                        }}>
                            {clientContracts.length > 0 && clientContracts[0].end_date
                                ? getRemainingDays(clientContracts[0].end_date) < 0
                                    ? (t('expired') || 'Expired')
                                    : getRemainingDays(clientContracts[0].end_date) + 'd'
                                : '—'}
                        </p>
                    </article>
                </div>
                <div className="client-employees-summary__actions">
                    {clientContracts.length > 0 && (
                        <button type="button" className="client-employees-summary__btn-contract client-employees-summary__btn-contract--view" onClick={() => setViewContractDetails('client')}>
                            <Eye size={18} /> {t('viewContractDetails') || 'View contract details'}
                        </button>
                    )}
                    <button type="button" className="client-employees-summary__btn-contract" onClick={clientContracts.length === 0 ? openAddClientContract : () => openEditClientContract(clientContracts[0])}>
                        {clientContracts.length === 0 ? (t('addClientContract') || 'Add client contract') : (t('edit') || 'Edit') + ' contract'}
                    </button>
                </div>
            </div>

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
                            <th>{t('created')}</th>
                            <th>{t('contractStart') || 'Contract start'}</th>
                            <th>{t('contractEnd') || 'Contract end'}</th>
                            <th>{t('daysRemaining') || 'Days remaining'}</th>
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
                                    <span className={`role-badge role-${(employee.role || '').toLowerCase()}`}>
                                        {employee.role}
                                    </span>
                                </td>
                                <td>{employee.phone_number || '—'}</td>
                                <td>{employee.bank_name || '—'}</td>
                                <td>{employee.created_at ? new Date(employee.created_at).toLocaleDateString() : '—'}</td>
                                <td>{formatDate(displayContractStart(employee))}</td>
                                <td>{formatDate(displayContractEnd(employee))}</td>
                                <td style={{
                                    color: (() => {
                                        const endDate = displayContractEnd(employee);
                                        const days = endDate ? getRemainingDays(endDate) : null;
                                        if (days === null) return '#94a3b8';
                                        if (days < 0) return '#ef4444';
                                        if (days <= 30) return '#f59e0b';
                                        return '#10b981';
                                    })(),
                                }}>
                                    {(() => {
                                        const endDate = displayContractEnd(employee);
                                        const days = endDate ? getRemainingDays(endDate) : null;
                                        if (days === null) return '—';
                                        if (days < 0) return t('expired') || 'Expired';
                                        return days;
                                    })()}
                                </td>
                                <td className="actions">
                                    <button
                                        type="button"
                                        className="btn-edit"
                                        onClick={() => setViewContractDetails({ employee })}
                                        title={t('viewContractDetails') || 'View contract details'}
                                    >
                                        <Eye size={16} aria-hidden /> {t('view') || 'View'}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-edit"
                                        onClick={() => handleEdit(employee)}
                                    >
                                        <Pencil size={16} aria-hidden /> {t('edit')}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-delete"
                                        onClick={() => setDeleteConfirm(employee)}
                                    >
                                        <Trash2 size={16} aria-hidden /> {t('delete')}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {employees.length === 0 && (
                    <div className="empty-state">
                        <p>{t('noEmployeesFound') || 'No employees found for this client.'}</p>
                    </div>
                )}
                {employees.length > 0 && !clientContracts.length && employees.every((e) => !e.contract_start_date && !e.contract_end_date) && (
                    <p className="client-employees-contract-hint">
                        {t('contractDatesHint') || 'Contract start and end dates appear after contracts are added. Go to'}
                        {' '}<button type="button" className="client-employees-contract-link" onClick={() => navigate('/contracts')}>{t('contracts') || 'Contracts'}</button>
                        {' '}{t('toAddContracts') || 'to add or manage contracts.'}
                    </p>
                )}
            </div>

            {/* Edit Modal - same as EmployeesPage */}
            {editingEmployee && (
                <div className="modal-overlay" onClick={() => setEditingEmployee(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{t('editEmployee')}</h2>
                        <div className="form-group">
                            <label>{t('fullName')}</label>
                            <input
                                type="text"
                                value={editingEmployee.full_name}
                                onChange={(e) => setEditingEmployee({ ...editingEmployee, full_name: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('email')} <span style={{ fontSize: '0.8em', color: '#94a3b8' }}>(optional)</span></label>
                            <input
                                type="email"
                                value={editingEmployee.email || ''}
                                onChange={(e) => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('phoneNumber')}</label>
                            <input
                                type="tel"
                                value={editingEmployee.phoneNumber}
                                onChange={(e) => setEditingEmployee({ ...editingEmployee, phoneNumber: e.target.value })}
                                placeholder="+250 XXX XXX XXX"
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('bankName')}</label>
                            <input
                                type="text"
                                value={editingEmployee.bankName}
                                onChange={(e) => setEditingEmployee({ ...editingEmployee, bankName: e.target.value })}
                                placeholder="e.g. Bank of Kigali"
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('accountHolderName')}</label>
                            <input
                                type="text"
                                value={editingEmployee.accountHolderName}
                                onChange={(e) => setEditingEmployee({ ...editingEmployee, accountHolderName: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('role')}</label>
                            <select
                                value={editingEmployee.role}
                                onChange={(e) => setEditingEmployee({ ...editingEmployee, role: e.target.value })}
                            >
                                <option value="Employee">{t('employee')}</option>
                                <option value="Admin">{t('adminLegacy')}</option>
                                <option value="HR">{t('hr')}</option>
                                <option value="FinanceOfficer">{t('financeOfficer')}</option>
                            </select>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn-cancel" onClick={() => setEditingEmployee(null)}>{t('cancel')}</button>
                            <button type="button" className="btn-save" onClick={handleSaveEdit}>{t('saveChanges')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Client contract add/edit modal */}
            {clientContractModal && (
                <div className="modal-overlay" onClick={() => setClientContractModal(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{clientContractModal === 'add' ? (t('addClientContract') || 'Add client contract') : (t('editClientContract') || 'Edit client contract')}</h2>
                        <div className="form-group">
                            <label>{t('contractType') || 'Contract type'}</label>
                            <select
                                value={clientContractForm.contractType}
                                onChange={(e) => setClientContractForm({ ...clientContractForm, contractType: e.target.value })}
                            >
                                <option value="service-agreement">Service agreement</option>
                                <option value="master">Master</option>
                                <option value="renewal">Renewal</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>{t('contractStart') || 'Contract start'} *</label>
                            <input
                                type="date"
                                value={clientContractForm.startDate}
                                onChange={(e) => setClientContractForm({ ...clientContractForm, startDate: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('contractEnd') || 'Contract end'}</label>
                            <input
                                type="date"
                                value={clientContractForm.endDate}
                                onChange={(e) => setClientContractForm({ ...clientContractForm, endDate: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('notes') || 'Notes'}</label>
                            <textarea
                                rows={2}
                                value={clientContractForm.notes}
                                onChange={(e) => setClientContractForm({ ...clientContractForm, notes: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label><FileText size={16} style={{ verticalAlign: 'middle' }} /> {t('contractDocument') || 'Upload contract document'}</label>
                            <input
                                type="file"
                                accept=".pdf,.doc,.docx,image/*"
                                onChange={(e) => setClientContractForm({ ...clientContractForm, contractDocument: e.target.files?.[0] || null })}
                            />
                            {clientContractForm.contractDocument && (
                                <span className="form-hint">{clientContractForm.contractDocument.name}</span>
                            )}
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn-cancel" onClick={() => setClientContractModal(null)} disabled={savingContract}>{t('cancel')}</button>
                            <button type="button" className="btn-save" onClick={saveClientContract} disabled={savingContract}>
                                {savingContract ? (t('saving') || 'Saving…') : t('save') || 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View contract details modal */}
            {viewContractDetails && (
                <div className="modal-overlay" onClick={() => setViewContractDetails(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2><FileText size={20} style={{ verticalAlign: 'middle' }} /> {t('viewContractDetails') || 'View contract details'}</h2>
                        {viewContractDetails === 'client' ? (
                            clientContracts.length > 0 && (
                                <div className="contract-details">
                                    <p><strong>{client.name}</strong> — {t('clientContract') || 'Client contract'}</p>
                                    <p><strong>{t('contractStart') || 'Start'}:</strong> {formatDate(clientContracts[0].start_date)}</p>
                                    <p><strong>{t('contractEnd') || 'End'}:</strong> {formatDate(clientContracts[0].end_date)}</p>
                                    <p><strong>{t('daysRemaining') || 'Days remaining'}:</strong> {clientContracts[0].end_date ? (getRemainingDays(clientContracts[0].end_date) < 0 ? (t('expired') || 'Expired') : getRemainingDays(clientContracts[0].end_date) + 'd') : '—'}</p>
                                    {clientContracts[0].contract_document_path && (
                                        <button type="button" className="btn-add-employee" style={{ marginTop: '1rem' }} onClick={() => downloadContractDocument('client', clientContracts[0].contract_id, 'client-contract.pdf')}>
                                            <Download size={18} /> {t('downloadContract') || 'Download contract document'}
                                        </button>
                                    )}
                                </div>
                            )
                        ) : viewContractDetails.employee && (
                            <div className="contract-details">
                                <p><strong>{viewContractDetails.employee.full_name}</strong> — {t('employeeContract') || 'Employee contract'}</p>
                                <p><strong>{t('contractStart') || 'Start'}:</strong> {formatDate(displayContractStart(viewContractDetails.employee))}</p>
                                <p><strong>{t('contractEnd') || 'End'}:</strong> {formatDate(displayContractEnd(viewContractDetails.employee))}</p>
                                <p><strong>{t('daysRemaining') || 'Days remaining'}:</strong> {displayContractEnd(viewContractDetails.employee) ? (getRemainingDays(displayContractEnd(viewContractDetails.employee)) < 0 ? (t('expired') || 'Expired') : getRemainingDays(displayContractEnd(viewContractDetails.employee)) + 'd') : '—'}</p>
                                {viewContractDetails.employee.contract_id && viewContractDetails.employee.contract_document_path && (
                                    <button type="button" className="btn-add-employee" style={{ marginTop: '1rem' }} onClick={() => downloadContractDocument('employee', viewContractDetails.employee.contract_id, `contract-${viewContractDetails.employee.full_name}.pdf`)}>
                                        <Download size={18} /> {t('downloadContract') || 'Download contract document'}
                                    </button>
                                )}
                                {(!viewContractDetails.employee.contract_id || !viewContractDetails.employee.contract_document_path) && (
                                    <p className="form-hint" style={{ marginTop: '1rem' }}>{t('noContractDocument') || 'No contract document uploaded.'}</p>
                                )}
                            </div>
                        )}
                        <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                            <button type="button" className="btn-cancel" onClick={() => setViewContractDetails(null)}>{t('close') || 'Close'}</button>
                        </div>
                    </div>
                </div>
            )}

            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal-content modal-confirm" onClick={(e) => e.stopPropagation()}>
                        <h2><AlertTriangle size={20} aria-hidden /> {t('confirmDelete')}</h2>
                        <p>{t('deleteConfirmation')} <strong>{deleteConfirm.full_name}</strong>?</p>
                        <p className="warning-text">{t('deleteWarning')}</p>
                        <div className="modal-actions">
                            <button type="button" className="btn-cancel" onClick={() => setDeleteConfirm(null)}>{t('cancel')}</button>
                            <button type="button" className="btn-delete-confirm" onClick={() => handleDelete(deleteConfirm.employee_id)}>{t('deleteEmployeeButton')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientEmployeesPage;
