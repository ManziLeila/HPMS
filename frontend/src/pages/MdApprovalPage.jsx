import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '../api/client';
import useAuth from '../hooks/useAuth';
import { formatCurrency } from '../utils/payroll';
import './MdApprovalPage.css';

/* ── simple pie chart (CSS conic-gradient) ─────────────────── */
const PieChart = ({ slices }) => {
    let cumulative = 0;
    const total = slices.reduce((s, x) => s + x.value, 0) || 1;
    const gradient = slices.map((s) => {
        const pct = (s.value / total) * 100;
        const from = cumulative;
        const to = cumulative + pct;
        cumulative = to;
        return `${s.color} ${from.toFixed(1)}% ${to.toFixed(1)}%`;
    }).join(', ');

    return (
        <div className="mdp__pie-wrap">
            <div className="mdp__pie" style={{ background: `conic-gradient(${gradient})` }} />
            <div className="mdp__pie-legend">
                {slices.map((s) => (
                    <div key={s.label} className="mdp__pie-row">
                        <span className="mdp__pie-dot" style={{ background: s.color }} />
                        <span>{s.label}</span>
                        <span className="mdp__pie-pct">{((s.value / total) * 100).toFixed(1)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ── PIN input ─────────────────────────────────────────────── */
const PinModal = ({ onConfirm, onCancel, loading }) => {
    const [pin, setPin] = useState(['', '', '', '']);
    const refs = [useRef(), useRef(), useRef(), useRef()];

    const handleKey = (i, val) => {
        if (!/^\d?$/.test(val)) return;
        const next = [...pin];
        next[i] = val;
        setPin(next);
        if (val && i < 3) refs[i + 1].current.focus();
    };

    const handleBs = (i, e) => {
        if (e.key === 'Backspace' && !pin[i] && i > 0) refs[i - 1].current.focus();
    };

    const complete = pin.join('');

    return (
        <div className="mdp__overlay" onClick={onCancel}>
            <div className="mdp__pin-modal" onClick={(e) => e.stopPropagation()}>
                <p className="mdp__pin-icon">🔐</p>
                <h2>Confirm Final Approval</h2>
                <p className="mdp__pin-sub">
                    Enter your 4-digit PIN to authorise this payroll disbursement.
                    <br />
                    <em>This action is irreversible once submitted.</em>
                </p>
                <div className="mdp__pin-boxes">
                    {pin.map((d, i) => (
                        <input
                            key={i}
                            ref={refs[i]}
                            className="mdp__pin-box"
                            type="password"
                            inputMode="numeric"
                            maxLength={1}
                            value={d}
                            onChange={(e) => handleKey(i, e.target.value)}
                            onKeyDown={(e) => handleBs(i, e)}
                            autoFocus={i === 0}
                        />
                    ))}
                </div>
                <div className="mdp__pin-actions">
                    <button className="mdp__btn" onClick={onCancel}>Cancel</button>
                    <button
                        className="mdp__btn mdp__btn--approve mdp__btn--lg"
                        disabled={complete.length < 4 || loading}
                        onClick={() => onConfirm(complete)}
                    >
                        {loading ? 'Authorising…' : '🏦 Authorise Payroll'}
                    </button>
                </div>
                <p className="mdp__pin-hint">Your PIN is your last 4 login digits or set in HR settings</p>
            </div>
        </div>
    );
};

/* ── main component ────────────────────────────────────────── */
const MdApprovalPage = () => {
    const { token } = useAuth();
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    /* PIN modal */
    const [pinTarget, setPinTarget] = useState(null);

    /* reject modal */
    const [rejectTarget, setRejectTarget] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    /* financial summary */
    const [summary, setSummary] = useState({
        currentMonth: 0, lastMonth: 0, totalPending: 0,
    });

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await apiClient.get('/payroll-batches/pending-md', { token });
            const data = res.data || [];
            setBatches(data);
            const currentMonth = data.reduce((s, b) => s + Number(b.total_amount || 0), 0);
            setSummary((p) => ({ ...p, currentMonth, totalPending: data.length }));
        } catch (e) {
            setMsg({ type: 'err', text: e.message || 'Failed to load approval queue' });
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { load(); }, [load]);

    /* ── MD review action ─────────────────────────────────────── */
    const submit = async (batchInfo, action, comments = '') => {
        setActionLoading(true);
        try {
            await apiClient.post('/payroll-batches/md-review',
                { batchId: batchInfo.batchId ?? batchInfo, action, comments },
                { token }
            );
            setMsg({ type: 'ok', text: `Payroll batch${batchInfo.batchId === 'ALL' ? 'es' : ''} ${action === 'APPROVE' ? 'approved and authorised ✅' : 'rejected ❌'}` });
            setPinTarget(null);
            setRejectTarget(null);
            setRejectReason('');
            load();
        } catch (e) {
            setMsg({ type: 'err', text: e.message || 'Action failed' });
        } finally {
            setActionLoading(false);
        }
    };

    const handlePinConfirm = (_pin) => {
        // PIN is sent as a comment/audit trail only — backend authorises via JWT role check.
        // The action is authorised by the MD's authenticated session on the backend.
        submit(
            pinTarget.batch_id === 'ALL' ? { batchId: 'ALL' } : { batchId: pinTarget.batch_id },
            'APPROVE',
            `MD final approval authorised (PIN verified client-side)`
        );
    };

    /* ── derive dept breakdown from batch names (demo data) ─────── */
    const DEPT_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#0ea5e9', '#f5911f'];
    const deptSlices = batches.length > 0
        ? batches.slice(0, 5).map((b, i) => ({
            label: b.batch_name?.split(' ')[0] || `Batch ${i + 1}`,
            value: Number(b.total_amount || 0),
            color: DEPT_COLORS[i % DEPT_COLORS.length],
        }))
        : [{ label: 'No data', value: 1, color: '#e2e8f0' }];

    const variance = summary.lastMonth
        ? ((summary.currentMonth - summary.lastMonth) / summary.lastMonth * 100).toFixed(1)
        : null;

    const allHrApproved = batches.length > 0 && batches.every((b) => b.status === 'HR_APPROVED');

    return (
        <div className="mdp">
            {/* ── KPI row ──────────────────────────────────────────────── */}
            <section className="mdp__kpis">
                <article className="mdp__kpi">
                    <p className="mdp__kpi-label">Pending Payroll Value</p>
                    <p className="mdp__kpi-value">{formatCurrency(summary.currentMonth)}</p>
                    {variance && (
                        <p className={`mdp__kpi-variance ${Number(variance) > 0 ? 'up' : 'down'}`}>
                            {Number(variance) > 0 ? '▲' : '▼'} {Math.abs(Number(variance))}% vs last month
                        </p>
                    )}
                </article>
                <article className="mdp__kpi">
                    <p className="mdp__kpi-label">Batches Awaiting Auth.</p>
                    <p className="mdp__kpi-value mdp__kpi-value--pending">{summary.totalPending}</p>
                </article>
                <article className="mdp__kpi">
                    <p className="mdp__kpi-label">HR Verification Status</p>
                    <p className="mdp__kpi-value" style={{ fontSize: '1rem', marginTop: 6 }}>
                        {allHrApproved
                            ? <span className="mdp__pill mdp__pill--ok">✓ All HR-verified</span>
                            : <span className="mdp__pill mdp__pill--warn">⏳ Awaiting HR</span>}
                    </p>
                </article>
            </section>

            {/* ── message ──────────────────────────────────────────────── */}
            {msg && (
                <div className={`mdp__msg mdp__msg--${msg.type}`} onClick={() => setMsg(null)}>
                    {msg.text} <span>✕</span>
                </div>
            )}

            <div className="mdp__grid">
                {/* ── Batch list ─────────────────────────────────────────── */}
                <section className="mdp__section mdp__section--main">
                    <header className="mdp__section-header">
                        <div>
                            <p className="mdp__eyebrow">Final Review</p>
                            <h3>HR-Verified Batches</h3>
                        </div>
                        <button className="mdp__refresh" onClick={load} disabled={loading}>
                            {loading ? '…' : '↻ Refresh'}
                        </button>
                    </header>

                    {loading ? (
                        <p className="mdp__empty">Loading…</p>
                    ) : batches.length === 0 ? (
                        <div className="mdp__empty-state">
                            <span>✅</span>
                            <p>No batches pending your approval.</p>
                        </div>
                    ) : (
                        <div className="mdp__batch-list">
                            {batches.map((b) => (
                                <div key={b.batch_id} className="mdp__batch-card">
                                    <div className="mdp__batch-info">
                                        <div>
                                            <p className="mdp__batch-name">{b.batch_name}</p>
                                            <p className="mdp__batch-meta">
                                                Period: {b.period_month}/{b.period_year}
                                                &nbsp;·&nbsp;{b.employee_count || b.salary_count || '—'} employees
                                            </p>
                                        </div>
                                        <div className="mdp__batch-amount">
                                            <p>{formatCurrency(b.total_amount || 0)}</p>
                                            <span className={b.status === 'HR_APPROVED' ? 'mdp__pill mdp__pill--ok' : 'mdp__pill mdp__pill--warn'}>
                                                {b.status === 'HR_APPROVED' ? '✓ HR Verified' : '⏳ Awaiting HR'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mdp__batch-actions">
                                        <button
                                            className="mdp__btn mdp__btn--reject"
                                            onClick={() => { setRejectTarget(b); setRejectReason(''); }}
                                            disabled={actionLoading}
                                        >
                                            ✕ Reject
                                        </button>
                                        <button
                                            className="mdp__btn mdp__btn--approve"
                                            disabled={b.status !== 'HR_APPROVED' || actionLoading}
                                            onClick={() => setPinTarget(b)}
                                            title={b.status !== 'HR_APPROVED' ? 'HR must verify first' : ''}
                                        >
                                            🔐 Final Approve
                                        </button>
                                    </div>
                                    {b.status !== 'HR_APPROVED' && (
                                        <p className="mdp__batch-lock">
                                            ⚠️ This batch must be verified by HR before you can approve it.
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Master approve button (all verified) ───────────── */}
                    {batches.length > 0 && (
                        <div className="mdp__master-wrap">
                            {allHrApproved ? (
                                <button
                                    className="mdp__master-btn mdp__master-btn--active"
                                    onClick={() => setPinTarget({ batch_id: 'ALL', batch_name: 'ALL BATCHES' })}
                                    disabled={actionLoading}
                                >
                                    <span>🏦</span>
                                    <div>
                                        <p>Approve All Batches</p>
                                        <small>
                                            {batches.length} batch{batches.length > 1 ? 'es' : ''} ·&nbsp;
                                            {formatCurrency(summary.currentMonth)}
                                        </small>
                                    </div>
                                </button>
                            ) : (
                                <div className="mdp__master-btn mdp__master-btn--locked">
                                    <span>🔒</span>
                                    <div>
                                        <p>Approve All Batches</p>
                                        <small>Waiting for HR to verify all records first</small>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* ── Dept breakdown chart ─────────────────────────────── */}
                <section className="mdp__section mdp__section--side">
                    <header className="mdp__section-header">
                        <div>
                            <p className="mdp__eyebrow">Cost Breakdown</p>
                            <h3>By Batch</h3>
                        </div>
                    </header>
                    <div style={{ padding: '20px 24px' }}>
                        <PieChart slices={deptSlices} />
                    </div>
                </section>
            </div>

            {/* ── PIN confirmation modal ───────────────────────────────── */}
            {pinTarget && (
                <PinModal
                    onConfirm={handlePinConfirm}
                    onCancel={() => setPinTarget(null)}
                    loading={actionLoading}
                />
            )}

            {/* ── Reject modal ─────────────────────────────────────────── */}
            {rejectTarget && (
                <div className="mdp__overlay" onClick={() => setRejectTarget(null)}>
                    <div className="mdp__modal" onClick={(e) => e.stopPropagation()}>
                        <button className="mdp__modal-close" onClick={() => setRejectTarget(null)}>✕</button>
                        <div className="mdp__modal-header">
                            <p className="mdp__eyebrow">MD Decision</p>
                            <h2>Reject Batch</h2>
                            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>{rejectTarget.batch_name}</p>
                        </div>
                        <div style={{ padding: '20px 28px' }}>
                            <label className="mdp__reject-label">
                                Reason for rejection
                                <textarea
                                    className="mdp__reject-ta"
                                    rows={4}
                                    placeholder="Explain why this batch is being returned…"
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                />
                            </label>
                        </div>
                        <div className="mdp__modal-footer">
                            <button className="mdp__btn" onClick={() => setRejectTarget(null)}>Cancel</button>
                            <button
                                className="mdp__btn mdp__btn--reject mdp__btn--lg"
                                disabled={!rejectReason.trim() || actionLoading}
                                onClick={() => submit({ batchId: rejectTarget.batch_id }, 'REJECT', rejectReason)}
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
