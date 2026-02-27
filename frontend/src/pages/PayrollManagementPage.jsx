import { useCallback, useEffect, useMemo, useState } from 'react';
import './ReportsPage.css'; // Shared styles
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
    const [submitConfirm, setSubmitConfirm] = useState(false);
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

    const handleSubmitMonth = () => {
        if (monthlyReport.length === 0) return;
        setSubmitConfirm(true);
    };

    const handleConfirmSubmit = async () => {
        if (!token) return;
        setSubmitConfirm(false);
        try {
            setActionMsg('🚀 Submitting to HR for verification…');
            await apiClient.post(`/salaries/reports/monthly/submit`, { year, month }, { token });
            setActionMsg('✅ Monthly payroll submitted to HR successfully');
            setTimeout(() => setActionMsg(null), 5000);
            loadData();
        } catch (err) {
            setActionMsg(`❌ ${err.response?.data?.message || err.message}`);
            setTimeout(() => setActionMsg(null), 8000);
        }
    };

    const handleEditSalary = (salary) => {
        setEditLoading(true);
        apiClient.get(`/salaries/${salary.salary_id}/detail`, { token }).then(res => {
            // res is the fully decrypted salary breakdown from getSalaryDetail
            const d = res;
            setEditingSalary({
                salary_id: d.salary_id,
                employee_name: d.full_name || salary.full_name,
                pay_period: d.pay_period,
                baseSalary: d.base_salary ?? 0,
                transportAllowance: d.transport_allowance ?? 0,
                housingAllowance: d.housing_allowance ?? 0,
                variableAllowance: d.variable_allowance ?? 0,
                performanceAllowance: d.performance_allowance ?? 0,
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
            const res = await apiClient.get(`/salaries/${salary.salary_id}/detail`, { token });
            setViewingSalary(res);
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
            setActionMsg('✅ Salary record updated!');
            setTimeout(() => setActionMsg(null), 4000);
            setEditingSalary(null);
            loadData();
        } catch (err) {
            setActionMsg('❌ Failed to update: ' + (err.message || 'Unknown error'));
        } finally {
            setEditLoading(false);
        }
    };

    const handleDeleteSalary = async (salaryId) => {
        if (!token) return;
        try {
            setActionMsg('Deleting salary record…');
            await apiClient.delete(`/salaries/${salaryId}`, { token });
            setActionMsg('✅ Record deleted!');
            setTimeout(() => setActionMsg(null), 3000);
            setDeleteConfirm(null);
            loadData();
        } catch (err) {
            setActionMsg('❌ Failed to delete: ' + (err.message || 'Unknown error'));
        }
    };

    const handleResetPeriod = async () => {
        if (!token) return;
        try {
            setActionMsg('Resetting period…');
            const query = new URLSearchParams({ year, month, frequency: filters.frequency }).toString();
            await apiClient.delete(`/salaries/reports/monthly/reset?${query}`, { token });
            setActionMsg(`✅ Period reset successfully`);
            setTimeout(() => setActionMsg(null), 4000);
            setResetConfirm(false);
            loadData();
        } catch (err) {
            setActionMsg('❌ Failed to reset: ' + (err.message || 'Unknown error'));
        }
    };

    return (
        <div className="reports-page">
            <section className="reports-page__filters">
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div>
                        <p className="reports-page__eyebrow">Payroll Step 1: Draft Review</p>
                        <h3>Review & Computation: {year}/{month}</h3>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0' }}>
                            FO role: Review, Edit, or Delete records before submitting for HR verification.
                        </p>
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
                        title="This will notify HR that the payroll is ready for their verification."
                    >
                        📤 Submit Month to HR
                    </button>

                    <button
                        type="button"
                        onClick={() => setResetConfirm(true)}
                        disabled={loading || monthlyReport.length === 0}
                        style={{ backgroundColor: '#dc2626', color: 'white' }}
                    >
                        🗑️ Reset Period
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
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button onClick={() => handleViewDetails(row)} className="reports-page__action-btn reports-page__action-btn--view">
                                                <span>🔍</span> Details
                                            </button>
                                            <button onClick={() => handleEditSalary(row)} className="reports-page__action-btn reports-page__action-btn--edit">
                                                <span>✏️</span> EDIT
                                            </button>
                                            <button onClick={() => setDeleteConfirm(row)} className="reports-page__action-btn reports-page__action-btn--delete">
                                                <span>🗑️</span> Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Enhanced Edit Modal ─────────────────── */}
            {editingSalary && (
                <div className="reports-page__modal-overlay" onClick={() => !editLoading && setEditingSalary(null)}>
                    <div className="reports-page__modal-content--edit" onClick={(e) => e.stopPropagation()}>
                        <header className="reports-page__modal-header">
                            <div>
                                <p className="reports-page__eyebrow">Editing Salary Draft</p>
                                <h3>{editingSalary.employee_name}</h3>
                            </div>
                            <button className="reports-page__modal-close" onClick={() => setEditingSalary(null)}>✕</button>
                        </header>

                        <div className="reports-page__modal-body">
                            {editingSalary.hr_comment && (
                                <div className="reports-page__modal-hr-feedback">
                                    <strong>HR Rejection Reason:</strong>
                                    <p>{editingSalary.hr_comment}</p>
                                </div>
                            )}

                            <div className="reports-page__form-section-title">💰 Earnings & Allowances</div>
                            <div className="reports-page__filter-controls" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '32px' }}>
                                <label>
                                    Basic Salary (RWF)
                                    <input type="number" value={editingSalary.baseSalary} onChange={e => setEditingSalary({ ...editingSalary, baseSalary: e.target.value })} />
                                </label>
                                <label>
                                    Transport Allowance (RWF)
                                    <input type="number" value={editingSalary.transportAllowance} onChange={e => setEditingSalary({ ...editingSalary, transportAllowance: e.target.value })} />
                                </label>
                                <label>
                                    Housing Allowance (RWF)
                                    <input type="number" value={editingSalary.housingAllowance} onChange={e => setEditingSalary({ ...editingSalary, housingAllowance: e.target.value })} />
                                </label>
                                <label>
                                    Performance Allowance (RWF)
                                    <input type="number" value={editingSalary.performanceAllowance} onChange={e => setEditingSalary({ ...editingSalary, performanceAllowance: e.target.value })} />
                                </label>
                                <label>
                                    Variable Allowance (RWF)
                                    <input type="number" value={editingSalary.variableAllowance} onChange={e => setEditingSalary({ ...editingSalary, variableAllowance: e.target.value })} />
                                </label>
                            </div>

                            <div className="reports-page__form-section-title">📉 Deductions & Settings</div>
                            <div className="reports-page__filter-controls" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                <label>
                                    Salary Advance (RWF)
                                    <input type="number" value={editingSalary.advanceAmount} onChange={e => setEditingSalary({ ...editingSalary, advanceAmount: e.target.value })} />
                                </label>
                                <label>
                                    Pay Frequency
                                    <select value={editingSalary.frequency} onChange={e => setEditingSalary({ ...editingSalary, frequency: e.target.value })}>
                                        <option value="monthly">Monthly</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="daily">Daily</option>
                                    </select>
                                </label>
                            </div>
                        </div>

                        <footer className="reports-page__modal-footer">
                            <button className="reports-page__btn-cancel" disabled={editLoading} onClick={() => setEditingSalary(null)}>
                                Cancel
                            </button>
                            <button className="reports-page__btn-save" disabled={editLoading} onClick={handleSaveEdit}>
                                {editLoading ? 'Processing…' : 'Update and Send to HR'}
                            </button>
                        </footer>
                    </div>
                </div>
            )}

            {/* ── Enhanced Details Modal ─────────────────── */}
            {viewingSalary && (
                <div className="reports-page__modal-overlay" onClick={() => setViewingSalary(null)}>
                    <div className="reports-page__modal-content--edit" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
                        <header className="reports-page__modal-header">
                            <div>
                                <p className="reports-page__eyebrow">Calculated Breakdown</p>
                                <h3>{viewingSalary.full_name}</h3>
                            </div>
                            <button className="reports-page__modal-close" onClick={() => setViewingSalary(null)}>✕</button>
                        </header>

                        <div className="reports-page__modal-body">
                            <div className="reports-page__form-section-title">Gross Earnings</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Basic Salary:</span>
                                    <strong>{formatCurrency(viewingSalary.base_salary)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Transport:</span>
                                    <strong>{formatCurrency(viewingSalary.transport_allowance)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Housing:</span>
                                    <strong>{formatCurrency(viewingSalary.housing_allowance)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Variable:</span>
                                    <strong>{formatCurrency(viewingSalary.variable_allowance)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Performance:</span>
                                    <strong>{formatCurrency(viewingSalary.performance_allowance)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px dashed #e2e8f0', fontWeight: '800' }}>
                                    <span>Total Gross:</span>
                                    <span style={{ color: '#10b981' }}>{formatCurrency(viewingSalary.gross_salary)}</span>
                                </div>
                            </div>

                            <div className="reports-page__form-section-title">Deductions</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>PAYE Tax:</span>
                                    <strong style={{ color: '#ef4444' }}>- {formatCurrency(viewingSalary.paye)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Advance:</span>
                                    <strong style={{ color: '#ef4444' }}>- {formatCurrency(viewingSalary.advance_amount)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', padding: '16px', background: '#f8fafc', borderRadius: '12px', fontWeight: '800', fontSize: '1.1rem' }}>
                                    <span>Final Net Pay:</span>
                                    <span style={{ color: '#1d4ed8' }}>{formatCurrency(viewingSalary.net_salary)}</span>
                                </div>
                            </div>
                        </div>

                        <footer className="reports-page__modal-footer">
                            <button className="reports-page__btn-save" style={{ background: '#3b82f6', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)' }} onClick={() => setViewingSalary(null)}>
                                Close Breakdown
                            </button>
                        </footer>
                    </div>
                </div>
            )}

            {/* ── Submission Confirmation Modal ────────────── */}
            {submitConfirm && (
                <div className="reports-page__modal-overlay" onClick={() => setSubmitConfirm(false)}>
                    <div className="reports-page__modal-content--edit" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
                        <header className="reports-page__modal-header">
                            <div>
                                <p className="reports-page__eyebrow">Final Step</p>
                                <h3>Send to HR?</h3>
                            </div>
                            <button className="reports-page__modal-close" onClick={() => setSubmitConfirm(false)}>✕</button>
                        </header>
                        <div className="reports-page__modal-body" style={{ textAlign: 'center', padding: '40px 32px' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🚀</div>
                            <p style={{ fontSize: '1.05rem', color: '#334155', fontWeight: '500', lineHeight: '1.5', margin: 0 }}>
                                Are you sure all records for <strong>{year}/{month}</strong> are correct?
                                <br />
                                This will notify HR to start their verification process.
                            </p>
                        </div>
                        <footer className="reports-page__modal-footer">
                            <button className="reports-page__btn-cancel" onClick={() => setSubmitConfirm(false)}>Cancel</button>
                            <button className="reports-page__btn-save" onClick={handleConfirmSubmit}>
                                Yes, Notify HR
                            </button>
                        </footer>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation Modal ─────────────── */}
            {deleteConfirm && (
                <div className="reports-page__modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="reports-page__modal-content--edit" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
                        <header className="reports-page__modal-header">
                            <div>
                                <p className="reports-page__eyebrow">Action Required</p>
                                <h3>Delete Record?</h3>
                            </div>
                            <button className="reports-page__modal-close" onClick={() => setDeleteConfirm(null)}>✕</button>
                        </header>
                        <div className="reports-page__modal-body" style={{ textAlign: 'center', padding: '32px' }}>
                            <p style={{ margin: 0, color: '#475569' }}>
                                Are you sure you want to delete the payroll record for <strong>{deleteConfirm.full_name}</strong>?
                            </p>
                        </div>
                        <footer className="reports-page__modal-footer">
                            <button className="reports-page__btn-cancel" onClick={() => setDeleteConfirm(null)}>Back</button>
                            <button className="reports-page__btn-save" style={{ background: '#ef4444' }} onClick={() => handleDeleteSalary(deleteConfirm.salary_id)}>
                                Yes, Delete
                            </button>
                        </footer>
                    </div>
                </div>
            )}

            {/* ── Reset Period Confirmation Modal ────────── */}
            {resetConfirm && (
                <div className="reports-page__modal-overlay" onClick={() => setResetConfirm(false)}>
                    <div className="reports-page__modal-content--edit" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
                        <header className="reports-page__modal-header">
                            <div>
                                <p className="reports-page__eyebrow" style={{ color: '#ef4444' }}>Danger Zone</p>
                                <h3>Wipe All Data?</h3>
                            </div>
                            <button className="reports-page__modal-close" onClick={() => setResetConfirm(false)}>✕</button>
                        </header>
                        <div className="reports-page__modal-body" style={{ textAlign: 'center', padding: '32px' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚠️</div>
                            <p style={{ margin: 0, color: '#475569', lineHeight: '1.6' }}>
                                This will permanently delete <strong>ALL payroll records</strong> for {year}/{month}.
                                <br />
                                <span style={{ color: '#ef4444', fontWeight: '700' }}>This action cannot be undone.</span>
                            </p>
                        </div>
                        <footer className="reports-page__modal-footer">
                            <button className="reports-page__btn-cancel" onClick={() => setResetConfirm(false)}>Cancel</button>
                            <button className="reports-page__btn-save" style={{ background: '#ef4444' }} onClick={handleResetPeriod}>
                                Wipe Everything
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PayrollManagementPage;
