import { useCallback, useEffect, useState } from 'react';
import {
    Building2, Check, X, ChevronDown, ChevronRight,
    MessageSquare, Inbox, RefreshCw, ArrowRight, Clock,
    User, CreditCard, Banknote, Download,
} from 'lucide-react';
import { apiClient, API_BASE_URL } from '../api/client';
import useAuth from '../hooks/useAuth';
import { formatCurrency, getComputationFormulas } from '../utils/payroll';
import './HrReviewPage.css';

const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
];

/* ══════════════════════════════════════════════════════════════
   HR REVIEW PAGE
   Shows payroll periods (client × month) submitted for review.
   HR reviews all employees under a client, then approves or
   rejects the entire period — forwarding it to the MD.
══════════════════════════════════════════════════════════════ */
const HrReviewPage = () => {
    const { token, user } = useAuth();

    const [periods, setPeriods]         = useState([]);
    const [forwarded, setForwarded]     = useState([]);
    const [loading, setLoading]         = useState(true);
    const [msg, setMsg]                 = useState(null);

    /* expanded period */
    const [expanded, setExpanded]       = useState(null); // period_id
    const [detail, setDetail]           = useState(null); // { period + salaries }
    const [detailLoading, setDetailLoading] = useState(false);
    const [downloadSummaryLoading, setDownloadSummaryLoading] = useState(false);

    /* review modal */
    const [reviewTarget, setReviewTarget] = useState(null); // period
    const [reviewAction, setReviewAction] = useState(null); // 'APPROVE' | 'REJECT'
    const [reviewComment, setReviewComment] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);
    const [hrReviewLoading, setHrReviewLoading] = useState(false);

    /* tab */
    const [tab, setTab] = useState('pending');

    // ── Load ─────────────────────────────────────────────────────────────
    const loadPending = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const [pendRes, fwdRes] = await Promise.all([
                apiClient.get('/payroll-periods/pending-hr',  { token }),
                apiClient.get('/payroll-periods/hr-approved', { token }),
            ]);
            setPeriods(pendRes.data   || []);
            setForwarded(fwdRes.data  || []);
        } catch (e) {
            setMsg({ type: 'err', text: e.message || 'Failed to load review queue' });
        } finally { setLoading(false); }
    }, [token]);

    useEffect(() => { loadPending(); }, [loadPending]);

    // ── Expand a period to see its employees ────────────────────────────
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

    // ── Submit review ─────────────────────────────────────────────────
    const submitReview = async () => {
        if (!reviewTarget || !reviewAction) return;
        if (reviewAction === 'REJECT' && !reviewComment.trim()) return;
        setReviewLoading(true);
        try {
            await apiClient.post(
                `/payroll-periods/${reviewTarget.period_id}/hr-review`,
                { action: reviewAction, comments: reviewComment },
                { token }
            );
            setMsg({
                type: 'ok',
                text: reviewAction === 'APPROVE'
                    ? `${reviewTarget.client_name} — ${MONTHS[reviewTarget.period_month - 1]} ${reviewTarget.period_year} approved and forwarded to MD ✓`
                    : `Payroll rejected — Finance Officer notified`,
            });
            setReviewTarget(null);
            setReviewAction(null);
            setReviewComment('');
            setExpanded(null);
            setDetail(null);
            loadPending();
        } catch (e) {
            setMsg({ type: 'err', text: e.message || 'Action failed' });
        } finally { setReviewLoading(false); }
    };

    const openReview = (period, action) => {
        setReviewTarget(period);
        setReviewAction(action);
        setReviewComment('');
    };

    // ── Per-employee HR approve/reject ─────────────────────────────────
    const handleHrReviewSalary = async (salaryId, action, comment, onDone) => {
        setHrReviewLoading(true);
        try {
            await apiClient.post(`/salaries/${salaryId}/hr-review`, { action, comment: comment || undefined }, { token });
            setMsg({ type: 'ok', text: `Employee ${action === 'APPROVE' ? 'approved' : 'rejected'} ✓` });
            if (onDone) onDone();
            if (expanded && detail) {
                const res = await apiClient.get(`/payroll-periods/${expanded}`, { token });
                setDetail(res.data);
            }
        } catch (e) {
            setMsg({ type: 'err', text: e.message || 'Action failed' });
        } finally {
            setHrReviewLoading(false);
        }
    };

    // ── Download computation summary PDF ─────────────────────────────────
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

const QUICK_REASONS = [
    'Incorrect transport allowance',
    'Missing new hire records',
    'Advance amount mismatch',
    'Housing allowance mismatch',
];

/* ── Expandable employee row with full salary breakdown + computation formulas + per-employee Approve/Reject ───────────────────── */
const EmployeeSalaryRow = ({ s, formatCurrency, onHrReview, hrReviewLoading, onRefresh }) => {
    const [open, setOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectInput, setShowRejectInput] = useState(false);
    const formulas = getComputationFormulas(s);
    const status = s.hr_status || 'PENDING';
    const isPending = status === 'PENDING' || status === 'pending';
    const isApproved = status === 'HR_APPROVED';
    const isRejected = status === 'HR_REJECTED';

    const handleApprove = (e) => {
        e.stopPropagation();
        if (!isPending || hrReviewLoading) return;
        onHrReview(s.salary_id, 'APPROVE', null, onRefresh);
    };
    const handleReject = (e) => {
        e.stopPropagation();
        if (!isPending || hrReviewLoading) return;
        if (showRejectInput) {
            onHrReview(s.salary_id, 'REJECT', rejectReason.trim() || 'Rejected by HR', () => {
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
            <tr className="hrp__emp-row" onClick={() => setOpen(!open)}>
                <td>
                    <span className="hrp__emp-toggle">{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
                    <div>
                        <p className="hrp__emp-name">{s.full_name}</p>
                        <span className="hrp__emp-email">{s.email}</span>
                        {s.department && <span className="hrp__emp-dept"> · {s.department}</span>}
                        {!isPending && (
                            <span className={`hrp__emp-status hrp__emp-status--${isApproved ? 'ok' : 'err'}`}>
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
                <tr className="hrp__emp-detail-row">
                    <td colSpan={5}>
                        <div className="hrp__emp-detail">
                            <h4 className="hrp__formula-title"><Banknote size={14} /> Computation Breakdown (formula + result)</h4>
                            <div className="hrp__formula-list">
                                {formulas.map((item, i) => (
                                    <div key={i} className="hrp__formula-item">
                                        <span className="hrp__formula-label">{item.label}:</span>
                                        <span className="hrp__formula-expr">{item.formula}</span>
                                        <span className="hrp__formula-result">= {formatCurrency(item.amount)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="hrp__emp-actions" onClick={e => e.stopPropagation()}>
                                <h4 className="hrp__formula-title">Review this employee</h4>
                                {isPending ? (
                                    <div className="hrp__emp-action-btns">
                                        <button
                                            className="hrp__btn hrp__btn--ok"
                                            onClick={handleApprove}
                                            disabled={hrReviewLoading}
                                        >
                                            <Check size={14} /> Approve
                                        </button>
                                        {showRejectInput ? (
                                            <div className="hrp__reject-inline">
                                                <textarea
                                                    placeholder="Reason for rejection (required)"
                                                    value={rejectReason}
                                                    onChange={e => setRejectReason(e.target.value)}
                                                    rows={2}
                                                    className="hrp__reject-inline-ta"
                                                />
                                                <div className="hrp__reject-inline-btns">
                                                    <button className="hrp__btn" onClick={() => setShowRejectInput(false)}>Cancel</button>
                                                    <button
                                                        className="hrp__btn hrp__btn--err"
                                                        onClick={handleReject}
                                                        disabled={hrReviewLoading}
                                                    >
                                                        <X size={14} /> Confirm Reject
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                className="hrp__btn hrp__btn--err"
                                                onClick={handleReject}
                                                disabled={hrReviewLoading}
                                            >
                                                <X size={14} /> Reject
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <p className="hrp__emp-status-msg">
                                        {isApproved ? '✓ This employee has been approved.' : '✕ This employee has been rejected.'}
                                    </p>
                                )}
                            </div>
                            <div className="hrp__emp-detail-grid">
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

    return (
        <div className="hrp">
            {/* ── KPIs ────────────────────────────────────────────── */}
            <section className="hrp__stats">
                <article className="hrp__stat-card">
                    <p className="hrp__stat-label">Pending Review</p>
                    <p className={`hrp__stat-value ${periods.length > 0 ? 'hrp__stat-value--warn' : 'hrp__stat-value--ok'}`}>
                        {periods.length}
                    </p>
                    <p className="hrp__stat-sub">client payroll groups</p>
                </article>
                <article className="hrp__stat-card">
                    <p className="hrp__stat-label">Forwarded to MD</p>
                    <p className="hrp__stat-value hrp__stat-value--ok">{forwarded.length}</p>
                    <p className="hrp__stat-sub">awaiting MD approval</p>
                </article>
            </section>

            {msg && (
                <div className={`hrp__msg hrp__msg--${msg.type}`} onClick={() => setMsg(null)}>
                    {msg.text} <span className="hrp__msg-close" aria-hidden><X size={14} /></span>
                </div>
            )}

            {/* ── Tabs ────────────────────────────────────────────── */}
            <div className="hrp__tabs">
                <button
                    className={`hrp__tab ${tab === 'pending' ? 'hrp__tab--active' : ''}`}
                    onClick={() => setTab('pending')}
                >
                    <Clock size={17} aria-hidden /> Pending Review
                    {periods.length > 0 && (
                        <span className="hrp__tab-badge hrp__tab-badge--warn">{periods.length}</span>
                    )}
                </button>
                <button
                    className={`hrp__tab ${tab === 'forwarded' ? 'hrp__tab--active' : ''}`}
                    onClick={() => setTab('forwarded')}
                >
                    <ArrowRight size={17} aria-hidden /> Forwarded to MD
                    {forwarded.length > 0 && (
                        <span className="hrp__tab-badge hrp__tab-badge--ok">{forwarded.length}</span>
                    )}
                </button>
            </div>

            {/* ════════════════════════════════════════════
                TAB: PENDING REVIEW
            ════════════════════════════════════════════ */}
            {tab === 'pending' && (
                <section className="hrp__section">
                    <header className="hrp__section-header">
                        <div>
                            <p className="hrp__eyebrow">HR Review</p>
                            <h3>Payroll Submissions Awaiting Verification</h3>
                        </div>
                        <button className="hrp__refresh" onClick={loadPending} disabled={loading}>
                            {loading
                                ? <><RefreshCw size={15} className="hrp__spin" /> Loading…</>
                                : <><RefreshCw size={15} /> Refresh</>}
                        </button>
                    </header>

                    {loading ? (
                        <p className="hrp__empty">Loading review queue…</p>
                    ) : periods.length === 0 ? (
                        <div className="hrp__empty-state">
                            <span aria-hidden><Inbox size={36} style={{ opacity: 0.35 }} /></span>
                            <p>No payroll submissions pending review.</p>
                            <small>When the Finance Officer submits salaries, they will appear here.</small>
                        </div>
                    ) : (
                        <div className="hrp__period-list">
                            {periods.map(period => {
                                const isOpen = expanded === period.period_id;
                                return (
                                    <div key={period.period_id} className={`hrp__period-card ${isOpen ? 'hrp__period-card--open' : ''}`}>
                                        {/* ── Period summary row ─────────────────────── */}
                                        <div className="hrp__period-header" onClick={() => toggleExpand(period)}>
                                            <div className="hrp__period-left">
                                                <span className="hrp__period-toggle">
                                                    {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                </span>
                                                <div>
                                                    <p className="hrp__period-client">
                                                        <Building2 size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                                                        {period.client_name}
                                                    </p>
                                                    <p className="hrp__period-meta">
                                                        {MONTHS[period.period_month - 1]} {period.period_year}
                                                        &nbsp;·&nbsp;{period.salary_count || 0} employees
                                                        &nbsp;·&nbsp;<strong>{formatCurrency(period.total_gross || 0)}</strong>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="hrp__period-right" onClick={e => e.stopPropagation()}>
                                                <button
                                                    className="hrp__btn hrp__btn--view"
                                                    onClick={() => downloadComputationSummary(period)}
                                                    disabled={downloadSummaryLoading || detailLoading}
                                                    title="Download computation summary (formulas + amounts) before approving"
                                                >
                                                    <Download size={15} aria-hidden /> Download Summary
                                                </button>
                                                <button
                                                    className="hrp__btn hrp__btn--ok"
                                                    onClick={() => openReview(period, 'APPROVE')}
                                                >
                                                    <Check size={15} aria-hidden /> Approve & Forward to MD
                                                </button>
                                                <button
                                                    className="hrp__btn hrp__btn--err"
                                                    onClick={() => openReview(period, 'REJECT')}
                                                >
                                                    <X size={15} aria-hidden /> Reject
                                                </button>
                                            </div>
                                        </div>

                                        {/* ── Employee salary list (expanded) ────────── */}
                                        {isOpen && (
                                            <div className="hrp__period-employees">
                                                {detailLoading && expanded === period.period_id ? (
                                                    <p className="hrp__empty">Loading employees…</p>
                                                ) : (
                                                    <>
                                                        <table className="hrp__emp-table">
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
                                                                        onHrReview={handleHrReviewSalary}
                                                                        hrReviewLoading={hrReviewLoading}
                                                                        onRefresh={async () => {
                                                                            if (expanded) {
                                                                                try {
                                                                                    const res = await apiClient.get(`/payroll-periods/${expanded}`, { token });
                                                                                    setDetail(res.data);
                                                                                } catch (_) {}
                                                                            }
                                                                        }}
                                                                    />
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                        {detail?.salaries?.length === 0 && (
                                                            <p className="hrp__empty">No salary records in this period.</p>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            )}

            {/* ════════════════════════════════════════════
                TAB: FORWARDED TO MD
            ════════════════════════════════════════════ */}
            {tab === 'forwarded' && (
                <section className="hrp__section">
                    <header className="hrp__section-header">
                        <div>
                            <p className="hrp__eyebrow">Tracking</p>
                            <h3>Forwarded to Managing Director</h3>
                        </div>
                        <button className="hrp__refresh" onClick={loadPending} disabled={loading}>
                            {loading ? '…' : <><RefreshCw size={15} /> Refresh</>}
                        </button>
                    </header>
                    {forwarded.length === 0 ? (
                        <div className="hrp__empty-state">
                            <span aria-hidden><Clock size={32} style={{ opacity: 0.3 }} /></span>
                            <p>No periods are currently awaiting MD approval.</p>
                        </div>
                    ) : (
                        <div className="hrp__table-wrap">
                            <table className="hrp__table">
                                <thead>
                                    <tr>
                                        <th>Client</th><th>Period</th><th>Employees</th>
                                        <th>Total Gross</th><th>Your Approval</th><th>Forwarded On</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {forwarded.map(p => (
                                        <tr key={p.period_id}>
                                            <td><strong>{p.client_name}</strong></td>
                                            <td>{MONTHS[p.period_month - 1]} {p.period_year}</td>
                                            <td>{p.salary_count || '—'}</td>
                                            <td>{formatCurrency(p.total_gross || 0)}</td>
                                            <td>
                                                <span className="hrp__badge" style={{ background: '#6366f122', color: '#6366f1', borderColor: '#6366f155' }}>
                                                    <ArrowRight size={12} style={{ verticalAlign: 'middle' }} /> Forwarded to MD
                                                </span>
                                            </td>
                                            <td>{p.hr_reviewed_at ? new Date(p.hr_reviewed_at).toLocaleDateString() : '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <p className="hrp__forwarded-note">
                                These periods have been verified by you and are awaiting final approval from the Managing Director.
                                The Finance Officer will be notified once approved.
                            </p>
                        </div>
                    )}
                </section>
            )}

            {/* ════════════════════════════════════════════
                REVIEW MODAL (approve or reject)
            ════════════════════════════════════════════ */}
            {reviewTarget && (
                <div className="hrp__overlay" onClick={() => !reviewLoading && setReviewTarget(null)}>
                    <div className="hrp__modal hrp__modal--reject" onClick={e => e.stopPropagation()}>
                        <button className="hrp__modal-close" onClick={() => setReviewTarget(null)} aria-label="Close" disabled={reviewLoading}>
                            <X size={20} />
                        </button>
                        <div className="hrp__modal-header">
                            <p className="hrp__eyebrow">
                                {reviewAction === 'APPROVE' ? 'Approve & Forward to MD' : 'Reject Payroll'}
                            </p>
                            <h2>
                                {reviewAction === 'APPROVE'
                                    ? <><Check size={18} style={{ verticalAlign: 'middle' }} /> Approve Payroll</>
                                    : <><X size={18} style={{ verticalAlign: 'middle' }} /> Reject Payroll</>}
                            </h2>
                            <p className="hrp__modal-meta">
                                <strong>{reviewTarget.client_name}</strong> — {MONTHS[reviewTarget.period_month - 1]} {reviewTarget.period_year}
                                &nbsp;·&nbsp;{reviewTarget.salary_count || 0} employees
                                &nbsp;·&nbsp;{formatCurrency(reviewTarget.total_gross || 0)}
                            </p>
                        </div>

                        <div style={{ padding: '20px 28px' }}>
                            {reviewAction === 'APPROVE' ? (
                                <>
                                    <label className="hrp__reject-label">
                                        <span>
                                            <MessageSquare size={14} style={{ verticalAlign: 'middle' }} /> Note to MD
                                            <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 6 }}>(optional)</span>
                                        </span>
                                        <textarea
                                            className="hrp__reject-ta"
                                            rows={3}
                                            placeholder="e.g. All records verified. Please proceed with final approval."
                                            value={reviewComment}
                                            onChange={e => setReviewComment(e.target.value)}
                                        />
                                    </label>
                                    <p className="hrp__forwarded-note" style={{ marginTop: 12 }}>
                                        Ensure you have reviewed all employee details above before approving.
                                        Approving will forward this payroll to the Managing Director for final sign-off.
                                        The Finance Officer will be notified once the MD approves.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <label className="hrp__reject-label">
                                        <span>Reason for rejection <em>(required)</em></span>
                                        <textarea
                                            className="hrp__reject-ta"
                                            rows={4}
                                            placeholder="e.g. Incorrect transport allowance for 3 employees…"
                                            value={reviewComment}
                                            onChange={e => setReviewComment(e.target.value)}
                                        />
                                    </label>
                                    <div className="hrp__common-reasons">
                                        <p>Quick reasons:</p>
                                        {QUICK_REASONS.map(r => (
                                            <button key={r} className="hrp__reason-chip"
                                                onClick={() => setReviewComment(p => p ? p + ' | ' + r : r)}>
                                                + {r}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="hrp__modal-footer">
                            <button className="hrp__btn" onClick={() => setReviewTarget(null)} disabled={reviewLoading}>Cancel</button>
                            <button
                                className={`hrp__btn hrp__btn--lg ${reviewAction === 'APPROVE' ? 'hrp__btn--ok' : 'hrp__btn--err'}`}
                                disabled={reviewLoading || (reviewAction === 'REJECT' && !reviewComment.trim())}
                                onClick={submitReview}
                            >
                                {reviewLoading ? 'Processing…'
                                    : reviewAction === 'APPROVE'
                                        ? <><Check size={14} /> Approve &amp; Forward to MD</>
                                        : <><X size={14} /> Confirm Rejection</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HrReviewPage;
