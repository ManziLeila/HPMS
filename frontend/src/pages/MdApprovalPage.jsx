import { useCallback, useEffect, useState } from 'react';
import {
    Building2, CheckCircle, Clock, ChevronDown, ChevronRight,
    X, RefreshCw, Inbox, CreditCard, Banknote, Download,
} from 'lucide-react';
import { apiClient, API_BASE_URL } from '../api/client';
import useAuth from '../hooks/useAuth';
import { formatCurrency, getComputationFormulas } from '../utils/payroll';
import './MdApprovalPage.css';

const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
];

/* ── Expandable employee row with computation breakdown + per-employee Approve/Reject ─────────────── */
const EmployeeSalaryRow = ({ s, formatCurrency, onMdReview, mdReviewLoading, onRefresh }) => {
    const [open, setOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectInput, setShowRejectInput] = useState(false);
    const formulas = getComputationFormulas(s);
    const status = s.md_status || 'PENDING';
    const isPending = status === 'PENDING' || status === 'pending';
    const isApproved = status === 'MD_APPROVED';
    const isRejected = status === 'MD_REJECTED';

    const handleApprove = (e) => {
        e.stopPropagation();
        if (!isPending || mdReviewLoading) return;
        onMdReview(s.salary_id, 'APPROVE', null, onRefresh);
    };
    const handleReject = (e) => {
        e.stopPropagation();
        if (!isPending || mdReviewLoading) return;
        if (showRejectInput) {
            onMdReview(s.salary_id, 'REJECT', rejectReason.trim() || 'Rejected by MD', () => {
                setShowRejectInput(false);
                setRejectReason('');
                onRefresh?.();
            });
        } else {
            setShowRejectInput(true);
        }
    };

    return (
        <>
            <tr className="mdp__emp-row" onClick={() => setOpen(!open)}>
                <td>
                    <span className="mdp__emp-toggle">{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
                    <div>
                        <p className="mdp__emp-name">{s.full_name}</p>
                        <span className="mdp__emp-email">{s.email}</span>
                        {s.department && <span className="mdp__emp-dept"> · {s.department}</span>}
                        {!isPending && (
                            <span className={`mdp__emp-status mdp__emp-status--${isApproved ? 'ok' : 'err'}`}>
                                {isApproved ? '✓ Approved' : '✕ Rejected'}
                            </span>
                        )}
                    </div>
                </td>
                <td><strong>{formatCurrency(s.gross_salary)}</strong></td>
                <td>{formatCurrency(s.paye)}</td>
                <td>{formatCurrency(s.rssb_pension || s.snapshot?.rssbEePension)}</td>
                <td style={{ color: '#10b981', fontWeight: 600 }}>
                    {s.net_salary != null ? formatCurrency(s.net_salary) : <span style={{ color: '#94a3b8' }}>—</span>}
                </td>
            </tr>
            {open && (
                <tr className="mdp__emp-detail-row">
                    <td colSpan={5}>
                        <div className="mdp__emp-detail">
                            <h4 className="mdp__formula-title"><Banknote size={14} /> Computation Breakdown (formula + result)</h4>
                            <div className="mdp__formula-list">
                                {formulas.map((item, i) => (
                                    <div key={i} className="mdp__formula-item">
                                        <span className="mdp__formula-label">{item.label}:</span>
                                        <span className="mdp__formula-expr">{item.formula}</span>
                                        <span className="mdp__formula-result">= {formatCurrency(item.amount)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mdp__emp-actions" onClick={e => e.stopPropagation()}>
                                <h4 className="mdp__formula-title">Approve or reject this employee</h4>
                                {isPending ? (
                                    <div className="mdp__emp-action-btns">
                                        <button
                                            className="mdp__btn mdp__btn--approve mdp__btn--sm"
                                            onClick={handleApprove}
                                            disabled={mdReviewLoading}
                                        >
                                            <CheckCircle size={14} /> Approve
                                        </button>
                                        {showRejectInput ? (
                                            <div className="mdp__reject-inline">
                                                <textarea
                                                    placeholder="Reason for rejection (optional)"
                                                    value={rejectReason}
                                                    onChange={e => setRejectReason(e.target.value)}
                                                    rows={2}
                                                    className="mdp__reject-inline-ta"
                                                />
                                                <div className="mdp__reject-inline-btns">
                                                    <button className="mdp__btn" onClick={() => setShowRejectInput(false)}>Cancel</button>
                                                    <button
                                                        className="mdp__btn mdp__btn--reject mdp__btn--sm"
                                                        onClick={handleReject}
                                                        disabled={mdReviewLoading}
                                                    >
                                                        <X size={14} /> Confirm Reject
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                className="mdp__btn mdp__btn--reject mdp__btn--sm"
                                                onClick={handleReject}
                                                disabled={mdReviewLoading}
                                            >
                                                <X size={14} /> Reject
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <p className="mdp__emp-status-msg">
                                        {isApproved ? '✓ This employee has been approved.' : '✕ This employee has been rejected.'}
                                    </p>
                                )}
                            </div>
                            <div className="mdp__emp-detail-grid">
                                <section>
                                    <h4><CreditCard size={14} /> Bank</h4>
                                    <ul>
                                        <li>{s.bank_name || '—'}</li>
                                        <li>{s.account_holder_name || '—'}</li>
                                    </ul>
                                </section>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};

/* ══════════════════════════════════════════════════════════════
   MD APPROVAL PAGE
   Shows HR-approved periods grouped by client.
   MD reviews employees (full details), then gives final approval.
══════════════════════════════════════════════════════════════ */
const MdApprovalPage = () => {
    const { token } = useAuth();
    const [periods, setPeriods]         = useState([]);
    const [loading, setLoading]         = useState(true);
    const [msg, setMsg]                 = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [mdReviewLoading, setMdReviewLoading] = useState(false);

    /* expanded period */
    const [expanded, setExpanded]       = useState(null);
    const [detail, setDetail]           = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [downloadSummaryLoading, setDownloadSummaryLoading] = useState(false);

    /* modals */
    const [approveConfirm, setApproveConfirm] = useState(null); // period to approve
    const [rejectTarget, setRejectTarget] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await apiClient.get('/payroll-periods/pending-md', { token });
            setPeriods(res.data || []);
        } catch (e) {
            setMsg({ type: 'err', text: e.message || 'Failed to load approval queue' });
        } finally { setLoading(false); }
    }, [token]);

    useEffect(() => { load(); }, [load]);

    /* ── Expand period ─────────────────────────────────────────────────── */
    const toggleExpand = async (period) => {
        const id = period.period_id;
        if (expanded === id) { setExpanded(null); setDetail(null); return; }
        setExpanded(id);
        setDetail(null);
        setDetailLoading(true);
        try {
            const res = await apiClient.get(`/payroll-periods/${id}`, { token });
            setDetail(res.data);
        } catch { setDetail({ ...period, salaries: [] }); }
        finally { setDetailLoading(false); }
    };

    const refreshDetail = useCallback(async () => {
        if (!expanded || !token) return;
        try {
            const res = await apiClient.get(`/payroll-periods/${expanded}`, { token });
            setDetail(res.data);
        } catch { /* ignore */ }
    }, [expanded, token]);

    /* ── Approve ────────────────────────────────────────────────────────── */
    const handleApprove = async () => {
        if (!approveConfirm) return;
        setActionLoading(true);
        try {
            await apiClient.post(
                `/payroll-periods/${approveConfirm.period_id}/md-review`,
                { action: 'APPROVE', comments: 'MD final approval' },
                { token }
            );
            setMsg({
                type: 'ok',
                text: `${approveConfirm.client_name} — ${MONTHS[approveConfirm.period_month - 1]} ${approveConfirm.period_year} approved ✓ Finance Officer notified to process payments`,
            });
            setApproveConfirm(null);
            setExpanded(null);
            setDetail(null);
            load();
        } catch (e) {
            setMsg({ type: 'err', text: e.message || 'Action failed' });
        } finally { setActionLoading(false); }
    };

    /* ── Per-employee MD approve/reject ────────────────────────────────── */
    const handleMdReviewSalary = async (salaryId, action, comment, onDone) => {
        setMdReviewLoading(true);
        try {
            await apiClient.post(`/salaries/${salaryId}/md-review`, { action, comment: comment || undefined }, { token });
            setMsg({ type: 'ok', text: `Employee ${action === 'APPROVE' ? 'approved' : 'rejected'} ✓` });
            if (onDone) onDone();
            await refreshDetail();
            load();
        } catch (e) {
            setMsg({ type: 'err', text: e.message || 'Action failed' });
        } finally { setMdReviewLoading(false); }
    };

    /* ── Reject ───────────────────────────────────────────────────────── */
    const handleReject = async () => {
        if (!rejectTarget || !rejectReason.trim()) return;
        setActionLoading(true);
        try {
            await apiClient.post(
                `/payroll-periods/${rejectTarget.period_id}/md-review`,
                { action: 'REJECT', comments: rejectReason },
                { token }
            );
            setMsg({ type: 'ok', text: 'Payroll rejected — Finance Officer and HR have been notified' });
            setRejectTarget(null);
            setRejectReason('');
            setExpanded(null);
            setDetail(null);
            load();
        } catch (e) {
            setMsg({ type: 'err', text: e.message || 'Action failed' });
        } finally { setActionLoading(false); }
    };

    const totalPendingValue = periods.reduce((s, p) => s + Number(p.total_gross || 0), 0);

    /* ── Download computation summary PDF ───────────────────────────────── */
    const downloadComputationSummary = async (period) => {
        setDownloadSummaryLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/payroll-periods/${period.period_id}/computation-summary`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(await res.text().catch(() => 'Download failed'));
            const blob = await res.blob();
            if (blob.size === 0) throw new Error('Downloaded file is empty');
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Computation-Summary-${period.client_name}-${MONTHS[period.period_month - 1]}-${period.period_year}.pdf`.replace(/[^a-zA-Z0-9.-]/g, '_');
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            setMsg({ type: 'err', text: e.message || 'Failed to download computation summary' });
        } finally {
            setDownloadSummaryLoading(false);
        }
    };

    return (
        <div className="mdp">
            {/* ── KPIs ────────────────────────────────────────────── */}
            <section className="mdp__kpis">
                <article className="mdp__kpi">
                    <p className="mdp__kpi-label">Pending Payroll Value</p>
                    <p className="mdp__kpi-value">{formatCurrency(totalPendingValue)}</p>
                </article>
                <article className="mdp__kpi">
                    <p className="mdp__kpi-label">Clients Awaiting Auth.</p>
                    <p className="mdp__kpi-value mdp__kpi-value--pending">{periods.length}</p>
                </article>
                <article className="mdp__kpi">
                    <p className="mdp__kpi-label">HR Verification</p>
                    <p className="mdp__kpi-value" style={{ fontSize: '1rem', marginTop: 6 }}>
                        {periods.length > 0
                            ? <span className="mdp__pill mdp__pill--ok"><CheckCircle size={14} style={{ verticalAlign: 'middle' }} /> All HR-verified</span>
                            : <span className="mdp__pill mdp__pill--warn"><Clock size={14} style={{ verticalAlign: 'middle' }} /> No pending</span>}
                    </p>
                </article>
            </section>

            {msg && (
                <div className={`mdp__msg mdp__msg--${msg.type}`} onClick={() => setMsg(null)}>
                    {msg.text} <span>✕</span>
                </div>
            )}

            {/* ── Period list ──────────────────────────────────────── */}
            <section className="mdp__section">
                <header className="mdp__section-header">
                    <div>
                        <p className="mdp__eyebrow">Final Review</p>
                        <h3>HR-Verified Payroll — Awaiting Your Approval</h3>
                    </div>
                    <button className="mdp__refresh" onClick={load} disabled={loading}>
                        {loading ? <><RefreshCw size={15} className="mdp__spin" /> Loading…</> : <><RefreshCw size={15} /> Refresh</>}
                    </button>
                </header>

                {loading ? (
                    <p className="mdp__empty">Loading…</p>
                ) : periods.length === 0 ? (
                    <div className="mdp__empty-state">
                        <span aria-hidden><CheckCircle size={36} style={{ opacity: 0.3 }} /></span>
                        <p>No payroll periods pending your approval.</p>
                        <small>HR-verified periods will appear here once forwarded.</small>
                    </div>
                ) : (
                    <div className="mdp__period-list">
                        {periods.map(period => {
                            const isOpen = expanded === period.period_id;
                            return (
                                <div key={period.period_id} className={`mdp__period-card ${isOpen ? 'mdp__period-card--open' : ''}`}>
                                    {/* ── Period summary ──────────────────────── */}
                                    <div className="mdp__period-header" onClick={() => toggleExpand(period)}>
                                        <div className="mdp__period-left">
                                            <span className="mdp__period-toggle">
                                                {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                            </span>
                                            <div>
                                                <p className="mdp__period-client">
                                                    <Building2 size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                                                    {period.client_name}
                                                </p>
                                                <p className="mdp__period-meta">
                                                    {MONTHS[period.period_month - 1]} {period.period_year}
                                                    &nbsp;·&nbsp;{period.salary_count || 0} employees
                                                    &nbsp;·&nbsp;<strong>{formatCurrency(period.total_gross || 0)}</strong>
                                                    &nbsp;·&nbsp;
                                                    <span className="mdp__pill mdp__pill--ok" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                                                        <CheckCircle size={12} style={{ verticalAlign: 'middle' }} /> HR Verified
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mdp__period-right" onClick={e => e.stopPropagation()}>
                                            <button
                                                className="mdp__btn"
                                                style={{ borderColor: '#6366f1', color: '#6366f1', background: '#eef2ff' }}
                                                onClick={() => downloadComputationSummary(period)}
                                                disabled={downloadSummaryLoading || actionLoading}
                                                title="Download computation summary (formulas + amounts) before approving"
                                            >
                                                <Download size={15} style={{ verticalAlign: 'middle' }} /> Download Summary
                                            </button>
                                            <button
                                                className="mdp__btn mdp__btn--reject"
                                                disabled={actionLoading}
                                                onClick={() => { setRejectTarget(period); setRejectReason(''); }}
                                            >
                                                ✕ Reject
                                            </button>
                                            <button
                                                className="mdp__btn mdp__btn--approve"
                                                disabled={actionLoading}
                                                onClick={() => setApproveConfirm(period)}
                                            >
                                                <CheckCircle size={15} style={{ verticalAlign: 'middle' }} /> Final Approve
                                            </button>
                                        </div>
                                    </div>

                                    {/* ── Employee breakdown (expanded) ─────────── */}
                                    {isOpen && (
                                        <div className="mdp__period-employees">
                                            {detailLoading && expanded === period.period_id ? (
                                                <p className="mdp__empty">Loading employees…</p>
                                            ) : (
                                                <table className="mdp__emp-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Employee (click to view full details)</th>
                                                            <th>Gross Salary</th>
                                                            <th>PAYE</th>
                                                            <th>RSSB Pension</th>
                                                            <th>Net Pay</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {(detail?.salaries || []).map(s => (
                                                            <EmployeeSalaryRow
                                                                key={s.salary_id}
                                                                s={s}
                                                                formatCurrency={formatCurrency}
                                                                onMdReview={handleMdReviewSalary}
                                                                mdReviewLoading={mdReviewLoading}
                                                                onRefresh={refreshDetail}
                                                            />
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* ── Approve confirmation modal ──────────────────────── */}
            {approveConfirm && (
                <div className="mdp__overlay" onClick={() => setApproveConfirm(null)}>
                    <div className="mdp__modal mdp__modal--confirm" onClick={e => e.stopPropagation()}>
                        <button className="mdp__modal-close" onClick={() => setApproveConfirm(null)} aria-label="Close" disabled={actionLoading}><X size={20} /></button>
                        <div className="mdp__confirm-icon mdp__confirm-icon--approve">
                            <CheckCircle size={28} aria-hidden />
                        </div>
                        <h2 className="mdp__confirm-title">Approve payroll?</h2>
                        <p className="mdp__confirm-body">
                            <strong>{approveConfirm.client_name}</strong> — {MONTHS[approveConfirm.period_month - 1]} {approveConfirm.period_year}
                        </p>
                        <p className="mdp__confirm-meta">
                            {approveConfirm.salary_count || 0} employees · {formatCurrency(approveConfirm.total_gross || 0)}
                        </p>
                        <p className="mdp__confirm-meta mdp__confirm-meta--warning">
                            Finance Officer will be notified to process payments.
                        </p>
                        <div className="mdp__modal-footer">
                            <button className="mdp__btn" onClick={() => setApproveConfirm(null)} disabled={actionLoading}>Cancel</button>
                            <button
                                className="mdp__btn mdp__btn--approve mdp__btn--lg"
                                disabled={actionLoading}
                                onClick={handleApprove}
                            >
                                {actionLoading ? 'Approving…' : <><CheckCircle size={15} aria-hidden /> Approve</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Reject modal ───────────────────────────────────── */}
            {rejectTarget && (
                <div className="mdp__overlay" onClick={() => setRejectTarget(null)}>
                    <div className="mdp__modal" onClick={e => e.stopPropagation()}>
                        <button className="mdp__modal-close" onClick={() => setRejectTarget(null)}>✕</button>
                        <div className="mdp__modal-header">
                            <p className="mdp__eyebrow">MD Decision</p>
                            <h2>Reject Payroll</h2>
                            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
                                <strong>{rejectTarget.client_name}</strong> — {MONTHS[rejectTarget.period_month - 1]} {rejectTarget.period_year}
                            </p>
                        </div>
                        <div style={{ padding: '20px 28px' }}>
                            <label className="mdp__reject-label">
                                Reason for rejection
                                <textarea
                                    className="mdp__reject-ta"
                                    rows={4}
                                    placeholder="Explain why this payroll is being returned to the Finance Officer…"
                                    value={rejectReason}
                                    onChange={e => setRejectReason(e.target.value)}
                                />
                            </label>
                        </div>
                        <div className="mdp__modal-footer">
                            <button className="mdp__btn" onClick={() => setRejectTarget(null)}>Cancel</button>
                            <button
                                className="mdp__btn mdp__btn--reject mdp__btn--lg"
                                disabled={!rejectReason.trim() || actionLoading}
                                onClick={handleReject}
                            >
                                {actionLoading ? 'Sending…' : '✕ Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MdApprovalPage;
