import { useCallback, useEffect, useMemo, useState } from 'react';
import { Send, Trash2, Eye, Pencil, AlertTriangle } from 'lucide-react';
import './ReportsPage.css';
import { apiClient, API_BASE_URL } from '../api/client';
import useAuth from '../hooks/useAuth.js';
import { formatCurrency } from '../utils/payroll';

const current = new Date();

const STATUS_META = {
    PENDING: { label: 'Pending', color: '#f59e0b' },
    HR_APPROVED: { label: 'HR Approved', color: '#10b981' },
    HR_REJECTED: { label: 'HR Rejected', color: '#ef4444' },
    MD_APPROVED: { label: 'MD Approved', color: '#6366f1' },
    REJECTED: { label: 'Rejected', color: '#ef4444' },
    SENT_TO_BANK: { label: 'Paid', color: '#0ea5e9' },
};

const Badge = ({ status }) => {
    const m = STATUS_META[status] || { label: status, color: '#94a3b8' };
    return (
        <span className="reports-page__badge" style={{
            background: m.color + '22',
            color: m.color,
            borderColor: m.color + '55',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '0.7rem',
            fontWeight: '700',
            border: '1px solid',
            textTransform: 'uppercase'
        }}>
            {m.label}
        </span>
    );
};

const PayrollManagementPage = () => {
    const { token } = useAuth();
    const [filters, setFilters] = useState({
        year: current.getFullYear(),
        month: current.getMonth() + 1,
        frequency: 'all',
    });
    const [monthlyReport, setMonthlyReport] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [actionMsg, setActionMsg] = useState(null);
    const [editingSalary, setEditingSalary] = useState(null);
    const [viewingSalary, setViewingSalary] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [resetConfirm, setResetConfirm] = useState(false);
    const [editLoading, setEditLoading] = useState(false);

    const { year, month } = filters;

    const loadData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            const query = new URLSearchParams({ year, month, frequency: filters.frequency }).toString();
            const response = await apiClient.get(`/salaries/reports/monthly?${query}`, { token });
            setMonthlyReport(response.data || []);
        } catch (err) {
            setMonthlyReport([]);
            setError(err.message || 'Failed to load report data');
        } finally {
            setLoading(false);
        }
    }, [token, year, month, filters.frequency]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSubmitMonth = async () => {
        if (!token) return;
        if (!window.confirm(`Confirm all records for ${year}/${month} are correct and notify HR?`)) return;

        try {
            setActionMsg('Submitting to HR…');
            await apiClient.post(`/salaries/reports/monthly/submit`, { year, month }, { token });
            setActionMsg('Monthly payroll submitted to HR successfully');
            setTimeout(() => setActionMsg(null), 5000);
            loadData();
        } catch (err) {
            setActionMsg(`${err.response?.data?.message || err.message}`);
            setTimeout(() => setActionMsg(null), 8000);
        }
    };

    const handleEditSalary = (salary) => {
        setEditLoading(true);
        apiClient.get(`/salaries/${salary.salary_id}`, { token }).then(res => {
            // res.data is expected to be the salary object or { data: salary }
            const d = res.data.data || res.data;
            const s = d.snapshot || {};
            const al = s.allowances || {};
            setEditingSalary({
                salary_id: d.salary_id,
                employee_name: d.employee?.full_name || salary.full_name,
                pay_period: d.pay_period,
                baseSalary: s.basicSalary ?? 0,
                transportAllowance: al.transport ?? 0,
                housingAllowance: al.housing ?? 0,
                variableAllowance: al.variable ?? 0,
                performanceAllowance: al.performance ?? 0,
                advanceAmount: d.advance_amount ?? 0,
                frequency: d.pay_frequency || 'monthly',
                hr_comment: d.hr_comment
            });
        }).catch(err => {
            setError("Failed to load details for editing: " + err.message);
        }).finally(() => {
            setEditLoading(false);
        });
    };

    const handleViewDetails = async (salary) => {
        try {
            setActionMsg('Loading breakdown…');
            const res = await apiClient.get(`/salaries/${salary.salary_id}`, { token });
            setViewingSalary(res.data.data || res.data);
            setActionMsg(null);
        } catch (err) {
            setActionMsg('Error loading details: ' + err.message);
            setTimeout(() => setActionMsg(null), 3000);
        }
    };

    const handleSaveEdit = async () => {
        if (!token || !editingSalary) return;
        try {
            setEditLoading(true);
            setActionMsg('Updating salary record…');
            await apiClient.put(
                `/salaries/${editingSalary.salary_id}`,
                {
                    baseSalary: Number(editingSalary.baseSalary),
                    transportAllowance: Number(editingSalary.transportAllowance),
                    housingAllowance: Number(editingSalary.housingAllowance),
                    variableAllowance: Number(editingSalary.variableAllowance),
                    performanceAllowance: Number(editingSalary.performanceAllowance),
                    advanceAmount: Number(editingSalary.advanceAmount),
                    frequency: editingSalary.frequency,
                },
                { token }
            );
            setActionMsg('Salary record updated!');
            setTimeout(() => setActionMsg(null), 4000);
            setEditingSalary(null);
            loadData();
        } catch (err) {
            setActionMsg('Failed to update: ' + (err.message || 'Unknown error'));
        } finally {
            setEditLoading(false);
        }
    };

    const handleDeleteSalary = async (salaryId) => {
        if (!token) return;
        try {
            setActionMsg('Deleting salary record…');
            await apiClient.delete(`/salaries/${salaryId}`, { token });
            setActionMsg('Record deleted!');
            setTimeout(() => setActionMsg(null), 3000);
            setDeleteConfirm(null);
            loadData();
        } catch (err) {
            setActionMsg('Failed to delete: ' + (err.message || 'Unknown error'));
        }
    };

    const handleResetPeriod = async () => {
        if (!token) return;
        try {
            setActionMsg('Resetting period…');
            const query = new URLSearchParams({ year, month, frequency: filters.frequency }).toString();
            await apiClient.delete(`/salaries/reports/monthly/reset?${query}`, { token });
            setActionMsg('Period reset successfully');
            setTimeout(() => setActionMsg(null), 4000);
            setResetConfirm(false);
            loadData();
        } catch (err) {
            setActionMsg('Failed to reset: ' + (err.message || 'Unknown error'));
        }
    };

    return (
        <div className="reports-page">
            <section className="reports-page__filters">
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div>
                        <p className="reports-page__eyebrow">Payroll Management</p>
                        <h3>Current Period: {year}/{month}</h3>
                    </div>
                </div>
                <div className="reports-page__filter-controls">
                    <label>Year <input type="number" value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })} /></label>
                    <label>Month
                        <select value={filters.month} onChange={e => setFilters({ ...filters, month: e.target.value })}>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </label>
                    <button onClick={loadData} disabled={loading}>{loading ? '...' : 'Refresh'}</button>

                    <button
                        type="button"
                        onClick={handleSubmitMonth}
                        disabled={loading || monthlyReport.length === 0}
                        style={{ backgroundColor: '#10b981', color: 'white' }}
                    >
                        <Send size={16} aria-hidden /> Submit Month to HR
                    </button>

                    <button
                        type="button"
                        onClick={() => setResetConfirm(true)}
                        disabled={loading || monthlyReport.length === 0}
                        style={{ backgroundColor: '#dc2626', color: 'white' }}
                    >
                        <Trash2 size={16} aria-hidden /> Reset Period
                    </button>
                </div>
            </section>

            {actionMsg && (
                <div className="reports-page__status" style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                    {actionMsg}
                </div>
            )}

            <div className="reports-page__monthly">
                <div className="reports-page__table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Gross (RWF)</th>
                                <th>PAYE (RWF)</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlyReport.map((row) => (
                                <tr key={row.salary_id}>
                                    <td>
                                        <strong>{row.full_name}</strong>
                                        <br /><small>{row.email}</small>
                                    </td>
                                    <td>{formatCurrency(row.gross_salary)}</td>
                                    <td>{formatCurrency(row.paye)}</td>
                                    <td><Badge status={row.hr_status || 'PENDING'} /></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                            <button onClick={() => handleViewDetails(row)} className="reports-page__action-btn" style={{ background: '#3b82f6', color: 'white' }}><Eye size={16} aria-hidden /> Details</button>
                                            {row.hr_status !== 'HR_APPROVED' && (
                                                <button onClick={() => handleEditSalary(row)} className="reports-page__action-btn" style={{ background: '#f59e0b', color: 'white' }}><Pencil size={16} aria-hidden /> Edit</button>
                                            )}
                                            <button onClick={() => setDeleteConfirm(row)} className="reports-page__action-btn" style={{ background: '#ef4444', color: 'white' }}><Trash2 size={16} aria-hidden /> Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals from previous version */}
            {editingSalary && (
                <div className="modal-overlay" onClick={() => !editLoading && setEditingSalary(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Edit Salary Amounts</h2>
                        {editingSalary.hr_comment && (
                            <div style={{ padding: '10px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', marginBottom: '15px' }}>
                                <p style={{ color: '#991b1b', fontWeight: 'bold' }}>HR Feedback:</p>
                                <p>{editingSalary.hr_comment}</p>
                            </div>
                        )}
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Basic Salary</label>
                                <input type="number" value={editingSalary.baseSalary} onChange={e => setEditingSalary({ ...editingSalary, baseSalary: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Transport</label>
                                <input type="number" value={editingSalary.transportAllowance} onChange={e => setEditingSalary({ ...editingSalary, transportAllowance: e.target.value })} />
                            </div>
                            {/* Simplified inputs for space */}
                            <div className="form-group">
                                <label>Housing</label>
                                <input type="number" value={editingSalary.housingAllowance} onChange={e => setEditingSalary({ ...editingSalary, housingAllowance: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Performance</label>
                                <input type="number" value={editingSalary.performanceAllowance} onChange={e => setEditingSalary({ ...editingSalary, performanceAllowance: e.target.value })} />
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button disabled={editLoading} onClick={() => setEditingSalary(null)}>Cancel</button>
                            <button disabled={editLoading} onClick={handleSaveEdit} className="btn-save">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {viewingSalary && (
                <div className="reports-page__modal">
                    <div className="reports-page__modal-content" style={{ maxWidth: '500px' }}>
                        <h3>Breakdown for {viewingSalary.employee?.full_name || viewingSalary.full_name}</h3>
                        <div style={{ margin: '20px 0' }}>
                            <p>Gross: {formatCurrency(viewingSalary.gross_salary)}</p>
                            <p>Tax: {formatCurrency(viewingSalary.paye)}</p>
                            <p>Net: {formatCurrency(viewingSalary.snapshot?.netPaidToBank || viewingSalary.net_salary)}</p>
                        </div>
                        <button onClick={() => setViewingSalary(null)} className="reports-page__modal-btn">Close</button>
                    </div>
                </div>
            )}

            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <h3>Confirm Delete?</h3>
                        <p>Delete payroll record for {deleteConfirm.full_name}?</p>
                        <div className="modal-actions">
                            <button onClick={() => setDeleteConfirm(null)}>No</button>
                            <button onClick={() => handleDeleteSalary(deleteConfirm.salary_id)} style={{ background: '#dc2626', color: 'white' }}>Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {resetConfirm && (
                <div className="modal-overlay" onClick={() => setResetConfirm(false)}>
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <h3><AlertTriangle size={20} aria-hidden /> Wipe All Data?</h3>
                        <p>This will delete ALL payroll records for {year}/{month}. This cannot be undone.</p>
                        <div className="modal-actions">
                            <button onClick={() => setResetConfirm(false)}>Cancel</button>
                            <button onClick={handleResetPeriod} style={{ background: '#dc2626', color: 'white' }}>Wipe Records</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PayrollManagementPage;
