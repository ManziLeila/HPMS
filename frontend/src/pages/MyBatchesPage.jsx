import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import useAuth from '../hooks/useAuth';
import { formatCurrency } from '../utils/payroll';
import './MyBatchesPage.css';

const STATUS_META = {
    PENDING: { label: 'Awaiting HR', color: '#f59e0b', icon: '⏳' },
    HR_APPROVED: { label: 'HR Verified', color: '#6366f1', icon: '✅' },
    APPROVED: { label: 'MD Approved', color: '#10b981', icon: '🏦' },
    REJECTED: { label: 'Rejected', color: '#ef4444', icon: '❌' },
    SENT_TO_BANK: { label: 'Paid', color: '#0ea5e9', icon: '💸' },
};

const Badge = ({ status }) => {
    const m = STATUS_META[status] || { label: status, color: '#94a3b8', icon: '•' };
    return (
        <span className="mb__badge" style={{ background: m.color + '18', color: m.color, borderColor: m.color + '44' }}>
            {m.icon} {m.label}
        </span>
    );
};

const MyBatchesPage = () => {
    const { token } = useAuth();
    const [batches, setBatches] = useState([]);
    const [approvedRecords, setApprovedRecords] = useState([]); // HR_APPROVED individual records
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState(null);
    const [emailModal, setEmailModal] = useState(null); // { type: 'individual'|'batch', target: object }
    const [customMessage, setCustomMessage] = useState('');
    const [filters, setFilters] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            // Load batches
            const res = await apiClient.get('/payroll-batches/my-batches', { token });
            setBatches(res.data || []);
            setStats(res.stats || null);

            // Load HR_APPROVED individual records for the current period
            const q = new URLSearchParams({ year: filters.year, month: filters.month }).toString();
            const resInd = await apiClient.get(`/salaries/reports/monthly?${q}`, { token });
            const approved = (resInd.data || []).filter(s => s.hr_status === 'HR_APPROVED');
            setApprovedRecords(approved);
        } catch (e) {
            setMsg({ type: 'err', text: e.message || 'Failed to load data' });
        } finally {
            setLoading(false);
        }
    }, [token, filters.year, filters.month]);

    useEffect(() => { load(); }, [load]);

    /* ── Send to bank ─────────────────────────────────────────── */
    const [sendLoading, setSendLoading] = useState(false);
    const handleSendToBank = async (batchId, batchName) => {
        if (!window.confirm(`Send "${batchName}" to bank? This is irreversible.`)) return;
        setSendLoading(true);
        try {
            await apiClient.post('/payroll-batches/send-to-bank', { batchId }, { token });
            setMsg({ type: 'ok', text: `✅ "${batchName}" sent to bank successfully!` });
            load();
        } catch (e) {
            setMsg({ type: 'err', text: e.message || 'Failed to send to bank' });
        } finally {
            setSendLoading(false);
        }
    };

    /* ── Send payslip emails ───────────────────────────────────── */
    const [emailLoading, setEmailLoading] = useState(false);

    const handleSendEmail = async () => {
        if (!emailModal) return;
        setEmailLoading(true);
        try {
            if (emailModal.type === 'individual') {
                const s = emailModal.target;
                await apiClient.post(`/salaries/${s.salary_id}/send-email`, { customMessage }, { token });
                setMsg({ type: 'ok', text: `✉️ Payslip email sent to ${s.full_name}!` });
            } else {
                // Batch sending
                const batch = emailModal.target;
                await apiClient.post(`/payroll-batches/${batch.batch_id}/send-emails`, { customMessage }, { token });
                setMsg({ type: 'ok', text: `✉️ Payslip emails sent for batch "${batch.batch_name}"!` });
            }
            setEmailModal(null);
            setCustomMessage('');
        } catch (e) {
            setMsg({ type: 'err', text: e.message || 'Failed to send email' });
        } finally {
            setEmailLoading(false);
        }
    };

    const handleSendAllApproved = async () => {
        if (!window.confirm(`Send payslip emails to all ${approvedRecords.length} HR-approved employees?`)) return;
        setEmailLoading(true);
        try {
            await Promise.all(approvedRecords.map(s =>
                apiClient.post(`/salaries/${s.salary_id}/send-email`, { customMessage }, { token })
            ));
            setMsg({ type: 'ok', text: `✉️ All ${approvedRecords.length} emails sent successfully!` });
            load();
        } catch (e) {
            setMsg({ type: 'err', text: e.message || 'Bulk email failed' });
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
                    {msg.text} <span>✕</span>
                </div>
            )}

            {/* ── Batch list ─────────────────────────────────────── */}
            <section className="mb__section">
                <header className="mb__section-header">
                    <div>
                        <p className="mb__eyebrow">Finance Review Queue</p>
                        <h3>Final Review & Email Confirmation</h3>
                    </div>
                    <div className="mb__filters">
                        <select value={filters.month} onChange={e => setFilters(f => ({ ...f, month: Number(e.target.value) }))}>
                            {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                        </select>
                        <input type="number" value={filters.year} onChange={e => setFilters(f => ({ ...f, year: Number(e.target.value) }))} />
                        <button className="mb__refresh" onClick={load} disabled={loading}>
                            {loading ? '…' : '↻ Refresh'}
                        </button>
                    </div>
                </header>

                {/* ── Approved Records Section ──────────────────── */}
                <div className="mb__queue-section">
                    <div className="mb__queue-header">
                        <h4>✅ Approved Records ({approvedRecords.length})</h4>
                        {approvedRecords.length > 0 && (
                            <button className="mb__btn mb__btn--email" onClick={() => setEmailModal({ type: 'all_approved' })}>
                                ✉️ Send All Payslips
                            </button>
                        )}
                    </div>
                    {approvedRecords.length === 0 ? (
                        <p className="mb__empty-small">No HR-approved records ready for emailing in this period.</p>
                    ) : (
                        <div className="mb__table-wrap">
                            <table className="mb__table mb__table--small">
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Period</th>
                                        <th>Net Amount</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {approvedRecords.map(s => (
                                        <tr key={s.salary_id}>
                                            <td><strong>{s.full_name}</strong><br /><small>{s.email}</small></td>
                                            <td>{filters.month}/{filters.year}</td>
                                            <td>{formatCurrency(s.net_salary || 0)}</td>
                                            <td>
                                                <button className="mb__btn mb__btn--text" onClick={() => setEmailModal({ type: 'individual', target: s })}>
                                                    ✉️ Customize & Send
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="mb__divider" />
                <h4>📋 Payroll Batches (Full History)</h4>

                {loading ? (
                    <p className="mb__empty">Loading your batches…</p>
                ) : sorted.length === 0 ? (
                    <div className="mb__empty-state">
                        <span>📋</span>
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
                                                        🏦 Send to Bank
                                                    </button>
                                                )}
                                                {['APPROVED', 'SENT_TO_BANK'].includes(b.status) && (
                                                    <button
                                                        className="mb__btn mb__btn--email"
                                                        disabled={emailLoading}
                                                        onClick={() => setEmailModal({ type: 'batch', target: b })}
                                                        title="Send payslip emails to all employees"
                                                    >
                                                        ✉️ Send Payslips
                                                    </button>
                                                )}
                                                {b.status === 'PENDING' && (
                                                    <button
                                                        className="mb__btn mb__btn--del"
                                                        onClick={() => handleDelete(b.batch_id, b.batch_name)}
                                                    >
                                                        🗑 Delete
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

            {/* ── Email Customization Modal ─────────────────── */}
            {emailModal && (
                <div className="mb__overlay" onClick={() => setEmailModal(null)}>
                    <div className="mb__modal" onClick={e => e.stopPropagation()}>
                        <header className="mb__modal-header">
                            <h3>Customize Payslip Email</h3>
                            <p>
                                {emailModal.type === 'individual'
                                    ? `Sending to: ${emailModal.target.full_name}`
                                    : emailModal.type === 'batch'
                                        ? `Sending to batch: ${emailModal.target.batch_name}`
                                        : `Sending to all ${approvedRecords.length} approved employees`}
                            </p>
                        </header>
                        <div className="mb__modal-body">
                            <label>
                                <span>Add a custom message (optional)</span>
                                <textarea
                                    placeholder="e.g. Please find your payslip for this month attached. For any queries, contact HR..."
                                    rows={5}
                                    value={customMessage}
                                    onChange={e => setCustomMessage(e.target.value)}
                                />
                                <small>This message will be included in the email body.</small>
                            </label>
                        </div>
                        <footer className="mb__modal-footer">
                            <button className="mb__btn mb__btn--secondary" onClick={() => setEmailModal(null)}>Cancel</button>
                            <button className="mb__btn mb__btn--email" disabled={emailLoading} onClick={emailModal.type === 'all_approved' ? handleSendAllApproved : handleSendEmail}>
                                {emailLoading ? 'Sending...' : '🚀 Send Emails Now'}
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyBatchesPage;
