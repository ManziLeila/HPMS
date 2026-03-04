import { useCallback, useEffect, useState } from 'react';
import { ClipboardList, Building2, Mail, Trash2, X, CheckCircle, Clock, XCircle, DollarSign } from 'lucide-react';
import { apiClient } from '../api/client';
import useAuth from '../hooks/useAuth';
import { formatCurrency } from '../utils/payroll';
import './MyBatchesPage.css';

const STATUS_META = {
    PENDING: { label: 'Awaiting HR', color: '#f59e0b', Icon: Clock },
    HR_APPROVED: { label: 'HR Verified', color: '#6366f1', Icon: CheckCircle },
    APPROVED: { label: 'MD Approved', color: '#10b981', Icon: Building2 },
    REJECTED: { label: 'Rejected', color: '#ef4444', Icon: XCircle },
    SENT_TO_BANK: { label: 'Paid', color: '#0ea5e9', Icon: DollarSign },
};

const Badge = ({ status }) => {
    const m = STATUS_META[status] || { label: status, color: '#94a3b8', Icon: null };
    return (
        <span className="mb__badge" style={{ background: m.color + '18', color: m.color, borderColor: m.color + '44' }}>
            {m.Icon && <m.Icon size={14} aria-hidden />} {m.label}
        </span>
    );
};

const MyBatchesPage = () => {
    const { token } = useAuth();
    const [batches, setBatches] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState(null);

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await apiClient.get('/payroll-batches/my-batches', { token });
            setBatches(res.data || []);
            setStats(res.stats || null);
        } catch (e) {
            setMsg({ type: 'err', text: e.message || 'Failed to load your batches' });
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { load(); }, [load]);

    /* ── Send to bank ─────────────────────────────────────────── */
    const [sendLoading, setSendLoading] = useState(false);
    const handleSendToBank = async (batchId, batchName) => {
        if (!window.confirm(`Send "${batchName}" to bank? This is irreversible.`)) return;
        setSendLoading(true);
        try {
            await apiClient.post('/payroll-batches/send-to-bank', { batchId }, { token });
            setMsg({ type: 'ok', text: `"${batchName}" sent to bank successfully!` });
            load();
        } catch (e) {
            setMsg({ type: 'err', text: e.message || 'Failed to send to bank' });
        } finally {
            setSendLoading(false);
        }
    };

    /* ── Send payslip emails ───────────────────────────────────── */
    const [emailLoading, setEmailLoading] = useState(false);
    const handleSendEmails = async (batchId, batchName) => {
        if (!window.confirm(`Send payslip emails to all employees in "${batchName}"?`)) return;
        setEmailLoading(true);
        try {
            const res = await apiClient.post(`/payroll-batches/${batchId}/send-emails`, {}, { token });
            setMsg({ type: 'ok', text: res.message || 'Emails sent successfully!' });
        } catch (e) {
            setMsg({ type: 'err', text: e.message || 'Failed to send emails' });
        } finally {
            setEmailLoading(false);
        }
    };

    /* ── Delete batch ─────────────────────────────────────────── */
    const handleDelete = async (batchId, batchName) => {
        if (!window.confirm(`Delete "${batchName}"? This cannot be undone.`)) return;
        try {
            await apiClient.delete(`/payroll-batches/${batchId}`, { token });
            setMsg({ type: 'ok', text: `Batch "${batchName}" deleted.` });
            load();
        } catch (e) {
            setMsg({ type: 'err', text: e.message || 'Failed to delete batch' });
        }
    };

    const STATUS_ORDER = ['PENDING', 'HR_APPROVED', 'APPROVED', 'REJECTED', 'SENT_TO_BANK'];
    const sorted = [...batches].sort((a, b) =>
        STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
    );

    return (
        <div className="mb">
            {/* ── KPI row ──────────────────────────────────────────── */}
            {stats && (
                <section className="mb__kpis">
                    {[
                        { label: 'Total Batches', value: stats.total ?? batches.length },
                        { label: 'Pending HR', value: stats.pending ?? batches.filter(b => b.status === 'PENDING').length, color: '#f59e0b' },
                        { label: 'Fully Approved', value: stats.approved ?? batches.filter(b => b.status === 'APPROVED').length, color: '#10b981' },
                        { label: 'Sent to Bank', value: stats.sentToBank ?? batches.filter(b => b.status === 'SENT_TO_BANK').length, color: '#0ea5e9' },
                    ].map((k) => (
                        <article key={k.label} className="mb__kpi">
                            <p className="mb__kpi-label">{k.label}</p>
                            <p className="mb__kpi-value" style={{ color: k.color }}>{k.value}</p>
                        </article>
                    ))}
                </section>
            )}

            {/* ── Message banner ─────────────────────────────────── */}
            {msg && (
                <div className={`mb__msg mb__msg--${msg.type}`} onClick={() => setMsg(null)}>
                    {msg.text} <button type="button" className="mb__msg-close" onClick={() => setMsg(null)} aria-label="Dismiss"><X size={16} /></button>
                </div>
            )}

            {/* ── Batch list ─────────────────────────────────────── */}
            <section className="mb__section">
                <header className="mb__section-header">
                    <div>
                        <p className="mb__eyebrow">Finance Officer</p>
                        <h3>My Payroll Batches</h3>
                    </div>
                    <button className="mb__refresh" onClick={load} disabled={loading}>
                        {loading ? '…' : '↻ Refresh'}
                    </button>
                </header>

                {loading ? (
                    <p className="mb__empty">Loading your batches…</p>
                ) : sorted.length === 0 ? (
                    <div className="mb__empty-state">
                        <ClipboardList size={40} className="mb__empty-icon" aria-hidden />
                        <p>No batches yet. Go to <strong>Reports</strong> to create your first payroll batch.</p>
                    </div>
                ) : (
                    <div className="mb__table-wrap">
                        <table className="mb__table">
                            <thead>
                                <tr>
                                    <th>Batch Name</th>
                                    <th>Period</th>
                                    <th>Total Amount</th>
                                    <th>Employees</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map((b) => (
                                    <tr key={b.batch_id}>
                                        <td><strong>{b.batch_name}</strong></td>
                                        <td>{b.period_month}/{b.period_year}</td>
                                        <td>{formatCurrency(b.total_amount || 0)}</td>
                                        <td>{b.employee_count || b.salary_count || '—'}</td>
                                        <td><Badge status={b.status} /></td>
                                        <td>{b.created_at ? new Date(b.created_at).toLocaleDateString() : '—'}</td>
                                        <td>
                                            <div className="mb__actions">
                                                {b.status === 'APPROVED' && (
                                                    <button
                                                        className="mb__btn mb__btn--bank"
                                                        disabled={sendLoading}
                                                        onClick={() => handleSendToBank(b.batch_id, b.batch_name)}
                                                    >
                                                        <Building2 size={16} aria-hidden /> Send to Bank
                                                    </button>
                                                )}
                                                {['APPROVED', 'SENT_TO_BANK'].includes(b.status) && (
                                                    <button
                                                        className="mb__btn mb__btn--email"
                                                        disabled={emailLoading}
                                                        onClick={() => handleSendEmails(b.batch_id, b.batch_name)}
                                                        title="Send payslip emails to all employees"
                                                    >
                                                        <Mail size={16} aria-hidden /> Send Payslips
                                                    </button>
                                                )}
                                                {b.status === 'PENDING' && (
                                                    <button
                                                        className="mb__btn mb__btn--del"
                                                        onClick={() => handleDelete(b.batch_id, b.batch_name)}
                                                    >
                                                        <Trash2 size={16} aria-hidden /> Delete
                                                    </button>
                                                )}
                                                {!['PENDING', 'APPROVED'].includes(b.status) && (
                                                    <span className="mb__no-action">—</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
};

export default MyBatchesPage;
