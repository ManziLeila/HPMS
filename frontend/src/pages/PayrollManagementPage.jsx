import { useCallback, useEffect, useMemo, useState } from 'react';
import { Trash2, Eye, Pencil, AlertTriangle, ChevronDown, ChevronRight, Building2, ArrowRight } from 'lucide-react';
import './ReportsPage.css';
import { apiClient } from '../api/client';
import useAuth from '../hooks/useAuth.js';
import { formatCurrency, getComputationFormulas } from '../utils/payroll';
import { Link } from 'react-router-dom';

const current = new Date();

const STATUS_META = {
    PENDING:     { label: 'Pending', color: '#f59e0b' },
    HR_APPROVED: { label: 'HR Approved', color: '#10b981' },
    HR_REJECTED: { label: 'HR Rejected', color: '#ef4444' },
    MD_APPROVED: { label: 'Approved', color: '#6366f1' },
    REJECTED:    { label: 'Rejected', color: '#ef4444' },
    SENT_TO_BANK:{ label: 'Approved', color: '#0ea5e9' },
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

/* Group salary rows by client */
const groupByClient = (rows) => {
    const groups = {};
    for (const row of rows) {
        const key = row.client_id ?? 0;
        const label = row.client_name || '— No Client';
        if (!groups[key]) groups[key] = { clientId: key, clientName: label, employees: [] };
        groups[key].employees.push(row);
    }
    return Object.values(groups).sort((a, b) => a.clientName.localeCompare(b.clientName));
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
    const [expandedClients, setExpandedClients] = useState(new Set());

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

    useEffect(() => { loadData(); }, [loadData]);

    const clientGroups = useMemo(() => groupByClient(monthlyReport), [monthlyReport]);

    const toggleClient = (clientId) => {
        setExpandedClients(prev => {
            const next = new Set(prev);
            next.has(clientId) ? next.delete(clientId) : next.add(clientId);
            return next;
        });
    };

    const expandAll = () => setExpandedClients(new Set(clientGroups.map(g => g.clientId)));
    const collapseAll = () => setExpandedClients(new Set());

    const handleEditSalary = (salary) => {
        setEditLoading(true);
        apiClient.get(`/salaries/${salary.salary_id}/detail`, { token }).then(res => {
            const d = res?.data ?? res;
            if (!d) return;
            setEditingSalary({
                salary_id: d.salary_id,
                employee_name: d.full_name ?? salary.full_name,
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
        }).finally(() => setEditLoading(false));
    };

    const handleViewDetails = async (salary) => {
        try {
            setActionMsg('Loading breakdown…');
            const res = await apiClient.get(`/salaries/${salary.salary_id}/detail`, { token });
            const data = res?.data ?? res;
            setViewingSalary(data);
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
                        <p className="reports-page__eyebrow">Payroll Run</p>
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
                    <button type="button" onClick={expandAll} disabled={loading || clientGroups.length === 0}>Expand All</button>
                    <button type="button" onClick={collapseAll} disabled={loading || clientGroups.length === 0}>Collapse All</button>
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

            {/* ── Next step: Payroll Periods ───────────────────────────────── */}
            <div className="reports-page__next-step" style={{
                background: 'linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%)',
                border: '1px solid #c4b5fd',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
            }}>
                <div>
                    <p style={{ fontWeight: 700, color: '#5b21b6', margin: 0 }}>After calculations are done</p>
                    <p style={{ color: '#6b21a8', margin: '4px 0 0', fontSize: '0.9rem' }}>
                        Go to <strong>Payroll Periods</strong> to submit each client+month for HR review. Approved or waiting items appear in the <strong>Approval Dashboard</strong>.
                    </p>
                </div>
                <Link to="/payroll-periods" className="reports-page__link-btn" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    background: '#6366f1',
                    color: 'white',
                    borderRadius: '10px',
                    fontWeight: 600,
                    textDecoration: 'none',
                }}>
                    <ArrowRight size={18} aria-hidden /> Payroll Periods
                </Link>
            </div>

            {actionMsg && (
                <div className="reports-page__status" style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                    {actionMsg}
                </div>
            )}

            <div className="reports-page__monthly">
                {loading ? (
                    <p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading…</p>
                ) : clientGroups.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
                        <p>No salary records for {year}/{month}.</p>
                        <p style={{ fontSize: '0.9rem', marginTop: 8 }}>Use Bulk Upload or compute salaries for employees first.</p>
                    </div>
                ) : (
                    <div className="reports-page__client-groups">
                        {clientGroups.map((group) => {
                            const isOpen = expandedClients.has(group.clientId);
                            const totalGross = group.employees.reduce((s, e) => s + Number(e.gross_salary || 0), 0);
                            return (
                                <div key={group.clientId} className="reports-page__client-card" style={{
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '12px',
                                    marginBottom: '12px',
                                    overflow: 'hidden',
                                }}>
                                    <div
                                        className="reports-page__client-header"
                                        onClick={() => toggleClient(group.clientId)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '12px 16px',
                                            background: group.clientId ? '#f8fafc' : '#fef3c7',
                                            cursor: 'pointer',
                                            borderBottom: isOpen ? '1px solid #e2e8f0' : 'none',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ color: '#64748b' }}>{isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span>
                                            <Building2 size={18} style={{ color: '#6366f1' }} />
                                            <strong>{group.clientName}</strong>
                                            <span style={{ fontWeight: 400, color: '#64748b', fontSize: '0.85rem' }}>
                                                ({group.employees.length} employee{group.employees.length !== 1 ? 's' : ''} · {formatCurrency(totalGross)})
                                            </span>
                                        </div>
                                    </div>
                                    {isOpen && (
                                        <div className="reports-page__table-wrapper" style={{ padding: 0 }}>
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
                                                    {group.employees.map((row) => (
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
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modals */}
            {editingSalary && (
                <div className="modal-overlay" onClick={() => !editLoading && setEditingSalary(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
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
                            <div className="form-group">
                                <label>Housing</label>
                                <input type="number" value={editingSalary.housingAllowance} onChange={e => setEditingSalary({ ...editingSalary, housingAllowance: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Performance</label>
                                <input type="number" value={editingSalary.performanceAllowance} onChange={e => setEditingSalary({ ...editingSalary, performanceAllowance: e.target.value })} />
                            </div>
                        </div>
                        <div style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px', fontSize: '0.9rem' }}>
                            <strong>Computation breakdown</strong> (updates after save): Gross = Basic + Transport + Housing + Performance → PAYE, RSSB, RAMA, CBHI, Advance → Net Pay. Employer: RSSB 6%, Maternity 0.3%, RAMA 7.5%, Occupational Hazard 2%.
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
                    <div className="reports-page__modal-content" style={{ maxWidth: '640px' }}>
                        <h3>Breakdown for {viewingSalary.employee?.full_name || viewingSalary.full_name}</h3>
                        <div className="pp__formula-list" style={{ margin: '16px 0', textAlign: 'left' }}>
                            {(getComputationFormulas(viewingSalary) || []).map((item, i) => (
                                item.section ? (
                                    <div key={i} style={{ fontWeight: 700, marginTop: '12px', marginBottom: '4px' }}>{item.section}</div>
                                ) : (
                                    <div key={i} className="pp__formula-item" style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '4px 0' }}>
                                        <span><strong>{item.label}:</strong> {item.formula}</span>
                                        <span>= {formatCurrency(item.amount)}</span>
                                    </div>
                                )
                            ))}
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
