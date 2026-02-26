import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import useAuth from '../hooks/useAuth';
import { formatCurrency } from '../utils/payroll';
import './HrReviewPage.css';

/* ── helpers ───────────────────────────────────────────────────── */
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
        <span className="hrp__badge" style={{ background: m.color + '22', color: m.color, borderColor: m.color + '55' }}>
            {m.label}
        </span>
    );
};

const fmtPeriod = (raw) => {
    if (!raw) return '—';
    try { return new Date(raw).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }); }
    catch { return raw; }
};
const FC = ({ v }) => v != null ? <>{formatCurrency(v)}</> : <span style={{ color: '#94a3b8' }}>—</span>;

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
const HrReviewPage = () => {
    const { token, user } = useAuth();

    const [tab, setTab] = useState('salaries');
    const [msg, setMsg] = useState(null);

    /* ── Individual salaries state ───────────────────────────────── */
    const [salaries, setSalaries] = useState([]);
    const [salLoading, setSalLoading] = useState(true);
    const [selected, setSelected] = useState(new Set()); // salary_id set
    const [salDetail, setSalDetail] = useState(null);
    const [salDetailData, setSalDetailData] = useState(null);
    const [salDetailLoading, setSalDetailLoading] = useState(false);
    const [hrComment, setHrComment] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [bulkConfirm, setBulkConfirm] = useState(null); // null | 'APPROVE' | 'REJECT'
    const [bulkComment, setBulkComment] = useState('');
    const [emailModal, setEmailModal] = useState(null);  // null | 'individual' | 'batch'
    const [emailTarget, setEmailTarget] = useState(null);  // specific salary row for individual
    const [emailSending, setEmailSending] = useState(false);
    const [quickReject, setQuickReject] = useState(null);   // salary row being quick-rejected
    const [quickRejectComment, setQuickRejectComment] = useState('');
    const [salFilters, setSalFilters] = useState({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
    });

    /* ── Batches state ───────────────────────────────────────────── */
    const [batches, setBatches] = useState([]);
    const [batchLoading, setBatchLoading] = useState(true);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [batchActionLoading, setBatchActionLoading] = useState(false);

    /* ── Load salaries ───────────────────────────────────────────── */
    const loadSalaries = useCallback(async () => {
        if (!token) return;
        setSalLoading(true);
        setSelected(new Set());
        try {
            const q = new URLSearchParams({ year: salFilters.year, month: salFilters.month }).toString();
            const res = await apiClient.get(`/salaries/reports/monthly?${q}`, { token });
            setSalaries(res.data || []);
        } catch (e) {
            setMsg({ type: 'err', text: e.message || 'Failed to load salary records' });
        } finally {
            setSalLoading(false);
        }
    }, [token, salFilters.year, salFilters.month]);

    /* ── Load batches ────────────────────────────────────────────── */
    const loadBatches = useCallback(async () => {
        if (!token) return;
        setBatchLoading(true);
        try {
            const res = await apiClient.get('/payroll-batches/pending-hr', { token });
            setBatches(res.data || []);
        } catch (e) {
            setMsg({ type: 'err', text: e.message || 'Failed to load review queue' });
        } finally {
            setBatchLoading(false);
        }
    }, [token]);

    useEffect(() => { loadSalaries(); }, [loadSalaries]);
    useEffect(() => { loadBatches(); }, [loadBatches]);

    /* ── Selection helpers ───────────────────────────────────────── */
    const allPending = salaries.filter(s => (s.hr_status || 'PENDING') === 'PENDING');
    const allSelected = allPending.length > 0 && allPending.every(s => selected.has(s.salary_id));

    const toggleAll = () => {
        if (allSelected) { setSelected(new Set()); }
        else { setSelected(new Set(allPending.map(s => s.salary_id))); }
    };

    const toggleOne = (id) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    /* ── Open salary detail modal ────────────────────────────────── */
    const openSalDetail = async (row) => {
        setSalDetail(row);
        setSalDetailData(null);
        setSalDetailLoading(true);
        setHrComment('');
        try {
            const res = await apiClient.get(`/salaries/${row.salary_id}/detail`, { token });
            setSalDetailData(res);
            if (res.hr_comment) setHrComment(res.hr_comment);
        } catch {
            setSalDetailData(row);
        } finally {
            setSalDetailLoading(false);
        }
    };
    const closeSalDetail = () => { setSalDetail(null); setSalDetailData(null); setHrComment(''); };

    /* ── Single approve / reject ─────────────────────────────────── */
    const reviewSingle = async (salaryId, action, comment) => {
        if (!salaryId || actionLoading) return;
        console.log(`[HrReview] Reviewing ${salaryId}: ${action}`);
        setActionLoading(true);
        try {
            await apiClient.post(`/salaries/${salaryId}/hr-review`, { action, comment }, { token });
            const approved = action === 'APPROVE';
            setMsg({ type: 'ok', text: `Salary ${approved ? 'approved ✅' : 'rejected ❌'} — Finance Officer notified` });

            // Success: close and reload
            setSalDetail(null);
            setSalDetailData(null);
            setHrComment('');
            loadSalaries();
        } catch (e) {
            console.error('[HrReview] Single review failed:', e);
            setMsg({ type: 'err', text: e.message || 'Action failed' });
        } finally {
            setActionLoading(false);
        }
    };

    /* ── Bulk approve / reject ───────────────────────────────────── */
    const reviewBulk = async () => {
        if (!bulkConfirm) return;
        setActionLoading(true);
        try {
            let res;
            if (selected.size === allPending.length) {
                // All pending → use server-side bulk endpoint
                res = await apiClient.post('/salaries/hr-review/bulk', {
                    year: salFilters.year, month: salFilters.month,
                    action: bulkConfirm, comment: bulkComment,
                }, { token });
            } else {
                // Partial selection → approve each in parallel
                const promises = [...selected].map(id =>
                    apiClient.post(`/salaries/${id}/hr-review`, { action: bulkConfirm, comment: bulkComment }, { token })
                );
                await Promise.all(promises);
                res = { updatedCount: selected.size };
            }
            const count = res?.updatedCount ?? selected.size;
            const action = bulkConfirm;
            setMsg({ type: 'ok', text: `${count} salary record(s) ${action === 'APPROVE' ? 'approved ✅' : 'rejected ❌'} — Finance Officer(s) notified` });
            setBulkConfirm(null); setBulkComment(''); setSelected(new Set());
            loadSalaries();
        } catch (e) {
            setMsg({ type: 'err', text: e.message || 'Bulk action failed' });
        } finally {
            setActionLoading(false);
        }
    };

    /* ── Email sending ───────────────────────────────────────────── */
    const sendEmail = async () => {
        setEmailSending(true);
        try {
            if (emailModal === 'individual' && emailTarget) {
                await apiClient.post(`/salaries/${emailTarget.salary_id}/send-email`, {}, { token });
                setMsg({ type: 'ok', text: `Payslip email sent to ${emailTarget.full_name} ✉️` });
            } else if (emailModal === 'batch') {
                const approvedIds = salaries
                    .filter(s => s.hr_status === 'HR_APPROVED')
                    .map(s => s.salary_id);
                await Promise.all(approvedIds.map(id =>
                    apiClient.post(`/salaries/${id}/send-email`, {}, { token })
                ));
                setMsg({ type: 'ok', text: `Payslip emails sent to ${approvedIds.length} employee(s) ✉️` });
            }
            setEmailModal(null); setEmailTarget(null);
        } catch (e) {
            setMsg({ type: 'err', text: e.message || 'Email sending failed' });
        } finally {
            setEmailSending(false);
        }
    };

    /* ── Batch detail / approve / reject ─────────────────────────── */
    const openDetail = async (batch) => {
        setDetailLoading(true);
        setDetail({ ...batch, salaries: null });
        try {
            const res = await apiClient.get(`/payroll-batches/${batch.batch_id}`, { token });
            setDetail(res.data);
        } catch { setDetail({ ...batch, salaries: [] }); }
        finally { setDetailLoading(false); }
    };

    const submitBatch = async (batchId, action, comments = '') => {
        setBatchActionLoading(true);
        try {
            await apiClient.post('/payroll-batches/hr-review', { batchId, action, comments }, { token });
            setMsg({ type: 'ok', text: `Batch ${action === 'APPROVE' ? 'verified ✅' : 'rejected ❌'} successfully` });
            setDetail(null); setRejectTarget(null); setRejectReason('');
            loadBatches();
        } catch (e) {
            setMsg({ type: 'err', text: e.message || 'Action failed' });
        } finally { setBatchActionLoading(false); }
    };

    /* ── Computed ────────────────────────────────────────────────── */
    const pendingBatches = batches.length;
    const totalSalaries = salaries.length;
    const approvedInPeriod = salaries.filter(s => s.hr_status === 'HR_APPROVED').length;
    const pendingInPeriod = allPending.length;
    const d = salDetailData;

    return (
        <div className="hrp">
            {/* ── KPI cards ────────────────────────────────────── */}
            <section className="hrp__stats">
                <article className="hrp__stat-card">
                    <p className="hrp__stat-label">Total Records</p>
                    <p className="hrp__stat-value">{totalSalaries}</p>
                    <p className="hrp__stat-sub">{salFilters.month}/{salFilters.year}</p>
                </article>
                <article className="hrp__stat-card">
                    <p className="hrp__stat-label">Pending Review</p>
                    <p className={`hrp__stat-value ${pendingInPeriod > 0 ? 'hrp__stat-value--warn' : 'hrp__stat-value--ok'}`}>
                        {pendingInPeriod}
                    </p>
                    <p className="hrp__stat-sub">individual salaries</p>
                </article>
                <article className="hrp__stat-card">
                    <p className="hrp__stat-label">HR Approved</p>
                    <p className="hrp__stat-value hrp__stat-value--ok">{approvedInPeriod}</p>
                    <p className="hrp__stat-sub">
                        {approvedInPeriod > 0 && (
                            <button className="hrp__link-btn"
                                onClick={() => setEmailModal('batch')}>
                                ✉️ Send all payslip emails
                            </button>
                        )}
                    </p>
                </article>
                <article className="hrp__stat-card">
                    <p className="hrp__stat-label">Batch Queue</p>
                    <p className={`hrp__stat-value ${pendingBatches > 0 ? 'hrp__stat-value--warn' : 'hrp__stat-value--ok'}`}>
                        {pendingBatches}
                    </p>
                    <p className="hrp__stat-sub">batches awaiting verification</p>
                </article>
            </section>

            {msg && (
                <div className={`hrp__msg hrp__msg--${msg.type}`} onClick={() => setMsg(null)}>
                    {msg.text} <span className="hrp__msg-close">✕</span>
                </div>
            )}

            {/* ── Tabs ────────────────────────────────────────── */}
            <div className="hrp__tabs">
                <button className={`hrp__tab ${tab === 'salaries' ? 'hrp__tab--active' : ''}`} onClick={() => setTab('salaries')}>
                    📊 Individual Salary Records
                    {pendingInPeriod > 0 && <span className="hrp__tab-badge hrp__tab-badge--warn">{pendingInPeriod} pending</span>}
                </button>
                <button className={`hrp__tab ${tab === 'batches' ? 'hrp__tab--active' : ''}`} onClick={() => setTab('batches')}>
                    📋 Payroll Batches
                    {pendingBatches > 0 && <span className="hrp__tab-badge hrp__tab-badge--warn">{pendingBatches}</span>}
                </button>
            </div>

            {/* ════════════════════════════════════════════
                TAB: INDIVIDUAL SALARY RECORDS
            ════════════════════════════════════════════ */}
            {tab === 'salaries' && (
                <section className="hrp__section">
                    <header className="hrp__section-header">
                        <div>
                            <p className="hrp__eyebrow">HR Review</p>
                            <h3>Individual Salary Records</h3>
                        </div>
                        <div className="hrp__sal-filters">
                            <label>Year
                                <input type="number" value={salFilters.year} min="2020"
                                    onChange={e => setSalFilters(p => ({ ...p, year: Number(e.target.value) }))} />
                            </label>
                            <label>Month
                                <select value={salFilters.month}
                                    onChange={e => setSalFilters(p => ({ ...p, month: Number(e.target.value) }))}>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                        <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                                    ))}
                                </select>
                            </label>
                            <button className="hrp__refresh" onClick={loadSalaries} disabled={salLoading}>
                                {salLoading ? '…' : '↻ Refresh'}
                            </button>
                        </div>
                    </header>

                    {/* ── Bulk action toolbar ──────────────────── */}
                    {!salLoading && salaries.length > 0 && (
                        <div className="hrp__bulk-bar">
                            <div className="hrp__bulk-left">
                                <label className="hrp__check-label">
                                    <input type="checkbox" checked={allSelected} onChange={toggleAll}
                                        ref={el => { if (el) el.indeterminate = selected.size > 0 && !allSelected; }} />
                                    <span>{selected.size > 0 ? `${selected.size} selected` : `Select all pending (${pendingInPeriod})`}</span>
                                </label>
                            </div>
                            <div className="hrp__bulk-right">
                                {selected.size > 0 ? (
                                    <>
                                        <button className="hrp__btn hrp__btn--ok"
                                            onClick={() => { setBulkConfirm('APPROVE'); setBulkComment(''); }}>
                                            ✓ Approve {selected.size} Selected
                                        </button>
                                        <button className="hrp__btn hrp__btn--err"
                                            onClick={() => { setBulkConfirm('REJECT'); setBulkComment(''); }}>
                                            ✕ Reject {selected.size} Selected
                                        </button>
                                    </>
                                ) : pendingInPeriod > 0 ? (
                                    <button className="hrp__btn hrp__btn--ok hrp__btn--bulk-all"
                                        onClick={() => {
                                            setSelected(new Set(allPending.map(s => s.salary_id)));
                                            setBulkConfirm('APPROVE'); setBulkComment('');
                                        }}>
                                        ✓ Approve All {pendingInPeriod} Pending
                                    </button>
                                ) : null}
                                {approvedInPeriod > 0 && (
                                    <button className="hrp__btn hrp__btn--email"
                                        onClick={() => setEmailModal('batch')}>
                                        ✉️ Send All Payslip Emails ({approvedInPeriod})
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {salLoading ? (
                        <p className="hrp__empty">Loading salary records…</p>
                    ) : salaries.length === 0 ? (
                        <div className="hrp__empty-state">
                            <span>📭</span>
                            <p>No salary records found for {salFilters.month}/{salFilters.year}.</p>
                            <small>Try a different month or ask the Finance Officer to compute salaries.</small>
                        </div>
                    ) : (
                        <div className="hrp__table-wrap">
                            <table className="hrp__table">
                                <thead>
                                    <tr>
                                        <th style={{ width: 36 }}></th>
                                        <th>Employee</th>
                                        <th>Pay Period</th>
                                        <th>Gross</th>
                                        <th>PAYE</th>
                                        <th>Take Home</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salaries.map(s => {
                                        const status = s.hr_status || 'PENDING';
                                        const isPending = status === 'PENDING';
                                        return (
                                            <tr key={s.salary_id} className={isPending ? '' : 'hrp__tr--reviewed'}>
                                                <td>
                                                    {isPending && (
                                                        <input type="checkbox" className="hrp__row-check"
                                                            checked={selected.has(s.salary_id)}
                                                            onChange={() => toggleOne(s.salary_id)} />
                                                    )}
                                                </td>
                                                <td>
                                                    <p className="hrp__emp-name">{s.full_name}</p>
                                                    <span className="hrp__emp-email">{s.email}</span>
                                                </td>
                                                <td>{fmtPeriod(s.pay_period)}</td>
                                                <td><strong>{formatCurrency(s.gross_salary)}</strong></td>
                                                <td>{formatCurrency(s.paye)}</td>
                                                <td>
                                                    {s.net_salary != null ? formatCurrency(s.net_salary)
                                                        : <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>—</span>}
                                                </td>
                                                <td><Badge status={status} /></td>
                                                <td>
                                                    <div className="hrp__actions">
                                                        <button className="hrp__btn hrp__btn--view"
                                                            onClick={() => openSalDetail(s)}>
                                                            Details
                                                        </button>
                                                        {isPending && (
                                                            <>
                                                                <button className="hrp__btn hrp__btn--ok"
                                                                    disabled={actionLoading}
                                                                    onClick={() => reviewSingle(s.salary_id, 'APPROVE', '')}>
                                                                    ✓
                                                                </button>
                                                                <button className="hrp__btn hrp__btn--err"
                                                                    disabled={actionLoading}
                                                                    onClick={() => { setQuickReject(s); setQuickRejectComment(''); }}>
                                                                    ✕
                                                                </button>
                                                            </>
                                                        )}
                                                        {status === 'HR_APPROVED' && (
                                                            <button className="hrp__btn hrp__btn--email"
                                                                onClick={() => { setEmailTarget(s); setEmailModal('individual'); }}>
                                                                ✉️
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            )}

            {/* ════════════════════════════════════════════
                TAB: PAYROLL BATCHES
            ════════════════════════════════════════════ */}
            {tab === 'batches' && (
                <section className="hrp__section">
                    <header className="hrp__section-header">
                        <div><p className="hrp__eyebrow">Review Queue</p><h3>Pending Batch Verification</h3></div>
                        <button className="hrp__refresh" onClick={loadBatches} disabled={batchLoading}>
                            {batchLoading ? '…' : '↻ Refresh'}
                        </button>
                    </header>
                    {batchLoading ? <p className="hrp__empty">Loading queue…</p>
                        : batches.length === 0 ? (
                            <div className="hrp__empty-state">
                                <span>🎉</span>
                                <p>No pending batches — you're all caught up!</p>
                            </div>
                        ) : (
                            <div className="hrp__table-wrap">
                                <table className="hrp__table">
                                    <thead>
                                        <tr>
                                            <th>Batch</th><th>Period</th><th>Total</th>
                                            <th>Employees</th><th>Status</th><th>Submitted</th><th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {batches.map(b => (
                                            <tr key={b.batch_id}>
                                                <td><strong>{b.batch_name}</strong></td>
                                                <td>{b.period_month}/{b.period_year}</td>
                                                <td>{formatCurrency(b.total_amount || 0)}</td>
                                                <td>{b.employee_count || b.salary_count || '—'}</td>
                                                <td><Badge status={b.status} /></td>
                                                <td>{b.created_at ? new Date(b.created_at).toLocaleDateString() : '—'}</td>
                                                <td>
                                                    <div className="hrp__actions">
                                                        <button className="hrp__btn hrp__btn--view" onClick={() => openDetail(b)}>View</button>
                                                        <button className="hrp__btn hrp__btn--ok" disabled={batchActionLoading}
                                                            onClick={() => submitBatch(b.batch_id, 'APPROVE')}>✓ Verify</button>
                                                        <button className="hrp__btn hrp__btn--err" disabled={batchActionLoading}
                                                            onClick={() => { setRejectTarget(b); setRejectReason(''); }}>✕ Reject</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                </section>
            )}

            {/* ════════════════════════════════════════════
                SALARY DETAIL MODAL — full breakdown + approve/reject
            ════════════════════════════════════════════ */}
            {salDetail && (
                <div className="hrp__overlay" onClick={closeSalDetail}>
                    <div className="hrp__modal hrp__modal--salary-full" onClick={e => e.stopPropagation()}>
                        <button className="hrp__modal-close" onClick={closeSalDetail}>✕</button>
                        <div className="hrp__modal-header">
                            <p className="hrp__eyebrow">Salary Record — Full Breakdown</p>
                            <h2>{salDetail.full_name}</h2>
                            <p className="hrp__modal-meta">
                                {salDetail.email} · Period: <strong>{fmtPeriod(salDetail.pay_period)}</strong>
                                &nbsp;·&nbsp;<Badge status={salDetail.hr_status || 'PENDING'} />
                            </p>
                        </div>

                        {salDetailLoading ? <p className="hrp__empty">Loading full details…</p> : (
                            <div className="hrp__sal-full-body">
                                {/* EARNINGS */}
                                <div className="hrp__breakdown-section">
                                    <p className="hrp__breakdown-title">💰 Earnings</p>
                                    <div className="hrp__breakdown-grid">
                                        {[['Basic Salary', d?.base_salary],
                                        ['Transport Allowance', d?.transport_allowance],
                                        ['Housing Allowance', d?.housing_allowance],
                                        ['Performance Allowance', d?.performance_allowance],
                                        ['Variable Allowance', d?.variable_allowance],
                                        ].map(([lbl, val]) => (
                                            <div className="hrp__bd-row" key={lbl}>
                                                <span className="hrp__bd-label">{lbl}</span>
                                                <span className="hrp__bd-val"><FC v={val} /></span>
                                            </div>
                                        ))}
                                        <div className="hrp__bd-row hrp__bd-row--total">
                                            <span className="hrp__bd-label">Gross Salary</span>
                                            <span className="hrp__bd-val hrp__bd-val--blue">
                                                {formatCurrency(d?.gross_salary ?? salDetail.gross_salary)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {/* DEDUCTIONS */}
                                <div className="hrp__breakdown-section">
                                    <p className="hrp__breakdown-title">📋 Employee Deductions</p>
                                    <div className="hrp__breakdown-grid">
                                        {[['PAYE Tax', d?.paye ?? salDetail.paye],
                                        ['RSSB Pension (5%)', d?.rssb_pension],
                                        ['RSSB Maternity', d?.rssb_maternity],
                                        ['RAMA Insurance', d?.rama_insurance],
                                        ['Advance Deduction', d?.advance_amount],
                                        ].map(([lbl, val]) => (
                                            <div className="hrp__bd-row" key={lbl}>
                                                <span className="hrp__bd-label">{lbl}</span>
                                                <span className="hrp__bd-val hrp__bd-val--red"><FC v={val} /></span>
                                            </div>
                                        ))}
                                        <div className="hrp__bd-row hrp__bd-row--total">
                                            <span className="hrp__bd-label">Net Take Home</span>
                                            <span className="hrp__bd-val hrp__bd-val--green">
                                                {d?.net_salary != null ? formatCurrency(d.net_salary)
                                                    : salDetail.net_salary != null ? formatCurrency(salDetail.net_salary)
                                                        : <span style={{ color: '#94a3b8' }}>Encrypted</span>}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {/* EMPLOYER */}
                                <div className="hrp__breakdown-section">
                                    <p className="hrp__breakdown-title">🏢 Employer Contributions</p>
                                    <div className="hrp__breakdown-grid">
                                        <div className="hrp__bd-row hrp__bd-row--total">
                                            <span className="hrp__bd-label">Total Employer Contribution</span>
                                            <span className="hrp__bd-val hrp__bd-val--purple">
                                                <FC v={d?.total_employer_contrib ?? salDetail?.total_employer_contrib ?? 0} />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {/* HR COMMENT */}
                                <div className="hrp__breakdown-section">
                                    <p className="hrp__breakdown-title">
                                        💬 Note to Finance Officer
                                        <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 8 }}>(optional)</span>
                                    </p>
                                    <div style={{ padding: '12px 16px' }}>
                                        <textarea className="hrp__comment-ta" rows={3}
                                            placeholder="e.g. Transport allowance doesn't match contract — please check…"
                                            value={hrComment}
                                            onChange={e => setHrComment(e.target.value)} />
                                        <p className="hrp__comment-hint">
                                            ℹ️ This note appears on the Finance Officer's dashboard next to this record.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="hrp__modal-footer">
                            <button className="hrp__btn" onClick={closeSalDetail}>Close</button>
                            {(!salDetail.hr_status || salDetail.hr_status === 'PENDING') && (
                                <>
                                    <button className="hrp__btn hrp__btn--err hrp__btn--lg"
                                        disabled={actionLoading}
                                        onClick={() => reviewSingle(salDetail.salary_id, 'REJECT', hrComment)}>
                                        {actionLoading ? '…' : '✕ Reject'}
                                    </button>
                                    <button className="hrp__btn hrp__btn--ok hrp__btn--lg"
                                        disabled={actionLoading}
                                        onClick={() => reviewSingle(salDetail.salary_id, 'APPROVE', hrComment)}>
                                        {actionLoading ? '…' : '✓ Approve'}
                                    </button>
                                </>
                            )}
                            {salDetail.hr_status === 'HR_APPROVED' && (
                                <button className="hrp__btn hrp__btn--email hrp__btn--lg"
                                    onClick={() => { closeSalDetail(); setEmailTarget(salDetail); setEmailModal('individual'); }}>
                                    ✉️ Send Payslip Email
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════
                BULK CONFIRM MODAL
            ════════════════════════════════════════════ */}
            {bulkConfirm && (
                <div className="hrp__overlay" onClick={() => setBulkConfirm(null)}>
                    <div className="hrp__modal hrp__modal--reject" onClick={e => e.stopPropagation()}>
                        <button className="hrp__modal-close" onClick={() => setBulkConfirm(null)}>✕</button>
                        <div className="hrp__modal-header">
                            <p className="hrp__eyebrow">{bulkConfirm === 'APPROVE' ? 'Bulk Approval' : 'Bulk Rejection'}</p>
                            <h2>{bulkConfirm === 'APPROVE' ? '✓ Approve' : '✕ Reject'} {selected.size} Record(s)</h2>
                            <p className="hrp__modal-meta">
                                {salFilters.month}/{salFilters.year} · The Finance Officer(s) will be notified immediately.
                            </p>
                        </div>
                        <label className="hrp__reject-label">
                            <span>
                                {bulkConfirm === 'REJECT' ? 'Reason for rejection' : 'Optional note to Finance Officer'}
                                {bulkConfirm === 'REJECT' && <em> (required)</em>}
                            </span>
                            <textarea className="hrp__reject-ta" rows={3}
                                placeholder={bulkConfirm === 'REJECT'
                                    ? 'e.g. Several transport allowances do not match contracts…'
                                    : 'e.g. All records verified and approved for this period.'}
                                value={bulkComment} onChange={e => setBulkComment(e.target.value)} />
                        </label>
                        {bulkConfirm === 'REJECT' && (
                            <div className="hrp__common-reasons">
                                <p>Quick reasons:</p>
                                {['Incorrect transport allowance', 'Missing new hire records',
                                    'Advance amount mismatch', 'Housing allowance mismatch'].map(r => (
                                        <button key={r} className="hrp__reason-chip"
                                            onClick={() => setBulkComment(p => p ? p + ' | ' + r : r)}>
                                            + {r}
                                        </button>
                                    ))}
                            </div>
                        )}
                        <div className="hrp__modal-footer">
                            <button className="hrp__btn" onClick={() => setBulkConfirm(null)} disabled={actionLoading}>Cancel</button>
                            <button
                                className={`hrp__btn hrp__btn--lg ${bulkConfirm === 'APPROVE' ? 'hrp__btn--ok' : 'hrp__btn--err'}`}
                                disabled={actionLoading || (bulkConfirm === 'REJECT' && !bulkComment.trim())}
                                onClick={reviewBulk}>
                                {actionLoading ? 'Processing…'
                                    : bulkConfirm === 'APPROVE'
                                        ? `✓ Confirm Approve ${selected.size}`
                                        : `✕ Confirm Reject ${selected.size}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════
                EMAIL MODAL
            ════════════════════════════════════════════ */}
            {emailModal && (
                <div className="hrp__overlay" onClick={() => { setEmailModal(null); setEmailTarget(null); }}>
                    <div className="hrp__modal hrp__modal--reject" onClick={e => e.stopPropagation()}>
                        <button className="hrp__modal-close" onClick={() => { setEmailModal(null); setEmailTarget(null); }}>✕</button>
                        <div className="hrp__modal-header">
                            <p className="hrp__eyebrow">Send Payslip Email</p>
                            <h2>{emailModal === 'individual' ? `✉️ Send to ${emailTarget?.full_name}` : `✉️ Send to All ${approvedInPeriod} Approved`}</h2>
                            <p className="hrp__modal-meta">
                                {emailModal === 'individual'
                                    ? `A payslip email will be sent to ${emailTarget?.email}`
                                    : `Payslip emails will be sent to all ${approvedInPeriod} HR-approved employees for ${salFilters.month}/${salFilters.year}`}
                            </p>
                        </div>
                        <div style={{ padding: '20px 28px' }}>
                            <div className="hrp__email-preview">
                                <span>📄</span>
                                <div>
                                    <strong>What gets sent:</strong>
                                    <p>Each employee receives their personally addressed payslip attached to the email, with salary breakdown and net pay amount.</p>
                                </div>
                            </div>
                        </div>
                        <div className="hrp__modal-footer">
                            <button className="hrp__btn" onClick={() => { setEmailModal(null); setEmailTarget(null); }}>Cancel</button>
                            <button className="hrp__btn hrp__btn--email hrp__btn--lg" disabled={emailSending} onClick={sendEmail}>
                                {emailSending ? 'Sending…' : `✉️ Send ${emailModal === 'batch' ? 'All ' + approvedInPeriod + ' Emails' : 'Email'}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════
                BATCH DETAIL MODAL
            ════════════════════════════════════════════ */}
            {detail && (
                <div className="hrp__overlay" onClick={() => setDetail(null)}>
                    <div className="hrp__modal hrp__modal--detail" onClick={e => e.stopPropagation()}>
                        <button className="hrp__modal-close" onClick={() => setDetail(null)}>✕</button>
                        <div className="hrp__modal-header">
                            <p className="hrp__eyebrow">HR Audit View</p>
                            <h2>{detail.batch_name}</h2>
                            <p className="hrp__modal-meta">
                                Period: <strong>{detail.period_month}/{detail.period_year}</strong>
                                &nbsp;·&nbsp;Total: <strong>{formatCurrency(detail.total_amount || 0)}</strong>
                                &nbsp;·&nbsp;<Badge status={detail.status} />
                            </p>
                        </div>
                        {detailLoading ? <p className="hrp__empty">Loading…</p> : (
                            <div className="hrp__detail-list">
                                {(detail.salaries || []).length === 0 ? (
                                    <p className="hrp__empty">No salary records attached.</p>
                                ) : (detail.salaries || []).map(s => (
                                    <div className="hrp__salary-card" key={s.salary_id}>
                                        <div className="hrp__salary-name">
                                            <strong>{s.full_name || s.employee_name}</strong>
                                            <span>{s.email}</span>
                                        </div>
                                        <div className="hrp__salary-grid">
                                            {[['Basic', s.base_salary || s.baseSalary],
                                            ['Transport', s.transport_allowance], ['Housing', s.housing_allowance],
                                            ['Performance', s.performance_allowance], ['Variable', s.variable_allowance],
                                            ['Advance', s.advance_amount], ['Gross', s.gross_salary], ['Net', s.net_salary]
                                            ].map(([lbl, val]) => (
                                                <div className={`hrp__ro-field ${lbl === 'Gross' ? 'hrp__ro-field--gross' : lbl === 'Net' ? 'hrp__ro-field--net' : ''}`} key={lbl}>
                                                    <label>{lbl}</label>
                                                    <span>{formatCurrency(val || 0)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="hrp__modal-footer">
                            <button className="hrp__btn hrp__btn--err hrp__btn--lg"
                                onClick={() => { setRejectTarget(detail); setDetail(null); }} disabled={batchActionLoading}>
                                ✕ Reject Batch
                            </button>
                            <button className="hrp__btn hrp__btn--ok hrp__btn--lg"
                                onClick={() => submitBatch(detail.batch_id, 'APPROVE')} disabled={batchActionLoading}>
                                {batchActionLoading ? 'Processing…' : '✓ Verify & Approve'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════
                QUICK REJECT MODAL (per-row ✕ button)
            ════════════════════════════════════════════ */}
            {quickReject && (
                <div className="hrp__overlay" onClick={() => setQuickReject(null)}>
                    <div className="hrp__modal hrp__modal--reject" onClick={e => e.stopPropagation()}>
                        <button className="hrp__modal-close" onClick={() => setQuickReject(null)}>✕</button>
                        <div className="hrp__modal-header">
                            <p className="hrp__eyebrow">Reject Salary Record</p>
                            <h2>✕ Reject — {quickReject.full_name}</h2>
                            <p className="hrp__modal-meta">
                                {fmtPeriod(quickReject.pay_period)} &nbsp;·&nbsp; Gross: <strong>{formatCurrency(quickReject.gross_salary)}</strong>
                            </p>
                        </div>
                        <label className="hrp__reject-label">
                            <span>Reason for rejection <em>(required — sent to Finance Officer)</em></span>
                            <textarea className="hrp__reject-ta" rows={3}
                                placeholder="e.g. Transport allowance doesn't match contract amount…"
                                value={quickRejectComment}
                                onChange={e => setQuickRejectComment(e.target.value)} />
                        </label>
                        <div className="hrp__common-reasons">
                            <p>Quick reasons:</p>
                            {['Incorrect transport allowance', 'Housing allowance mismatch',
                                'Advance amount incorrect', 'Basic salary doesn\'t match contract'].map(r => (
                                    <button key={r} className="hrp__reason-chip"
                                        onClick={() => setQuickRejectComment(p => p ? p + ' | ' + r : r)}>
                                        + {r}
                                    </button>
                                ))}
                        </div>
                        <div className="hrp__modal-footer">
                            <button className="hrp__btn" onClick={() => setQuickReject(null)}>Cancel</button>
                            <button className="hrp__btn hrp__btn--err hrp__btn--lg"
                                disabled={!quickRejectComment.trim() || actionLoading}
                                onClick={async () => {
                                    const s = quickReject;
                                    setQuickReject(null);
                                    await reviewSingle(s.salary_id, 'REJECT', quickRejectComment);
                                }}>
                                {actionLoading ? 'Rejecting…' : '✕ Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════
                BATCH REJECT MODAL
            ════════════════════════════════════════════ */}
            {rejectTarget && (
                <div className="hrp__overlay" onClick={() => setRejectTarget(null)}>
                    <div className="hrp__modal hrp__modal--reject" onClick={e => e.stopPropagation()}>
                        <button className="hrp__modal-close" onClick={() => setRejectTarget(null)}>✕</button>
                        <div className="hrp__modal-header">
                            <p className="hrp__eyebrow">Rejection Notice</p>
                            <h2>Reject Batch</h2>
                            <p className="hrp__modal-meta">{rejectTarget.batch_name}</p>
                        </div>
                        <label className="hrp__reject-label">
                            <span>Reason for rejection <em>(required)</em></span>
                            <textarea className="hrp__reject-ta" rows={4}
                                placeholder="e.g., Incorrect transport allowance for 3 employees"
                                value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                        </label>
                        <div className="hrp__common-reasons">
                            <p>Quick reasons:</p>
                            {['Incorrect transport allowance', 'Missing new hire records',
                                'Advance amount mismatch', 'Housing allowance not matching contract'].map(r => (
                                    <button key={r} className="hrp__reason-chip"
                                        onClick={() => setRejectReason(p => p ? p + ' | ' + r : r)}>+ {r}</button>
                                ))}
                        </div>
                        <div className="hrp__modal-footer">
                            <button className="hrp__btn" onClick={() => setRejectTarget(null)}>Cancel</button>
                            <button className="hrp__btn hrp__btn--err hrp__btn--lg"
                                disabled={!rejectReason.trim() || batchActionLoading}
                                onClick={() => submitBatch(rejectTarget.batch_id, 'REJECT', rejectReason)}>
                                {batchActionLoading ? 'Sending…' : '✕ Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HrReviewPage;
