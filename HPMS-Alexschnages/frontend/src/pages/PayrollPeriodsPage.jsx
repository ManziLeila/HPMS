import { useCallback, useEffect, useState } from 'react';
import {
    Mail, Trash2, X, CheckCircle, Clock, XCircle,
    DollarSign, Send, RefreshCw, Inbox, ArrowRight, Download,
} from 'lucide-react';
import { apiClient, API_BASE_URL } from '../api/client';
import useAuth from '../hooks/useAuth';
import { formatCurrency } from '../utils/payroll';
import './PayrollPeriodsPage.css';

const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
];

const STATUS_META = {
    SUBMITTED:    { label: 'Pending HR Review', color: '#f59e0b', Icon: Clock },
    HR_APPROVED:  { label: 'Forwarded to MD',   color: '#6366f1', Icon: ArrowRight },
    MD_APPROVED:  { label: 'Completed',          color: '#10b981', Icon: CheckCircle },
    REJECTED:     { label: 'Rejected',           color: '#ef4444', Icon: XCircle },
    SENT_TO_BANK: { label: 'Completed',          color: '#10b981', Icon: DollarSign },
};

const Badge = ({ status }) => {
    const m = STATUS_META[status] || { label: status, color: '#94a3b8', Icon: null };
    return (
        <span className="pp__badge" style={{ background: m.color + '18', color: m.color, borderColor: m.color + '44' }}>
            {m.Icon && <m.Icon size={13} aria-hidden />} {m.label}
        </span>
    );
};

const PayrollPeriodsPage = () => {
    const { token } = useAuth();
    const [myPeriods, setMyPeriods]       = useState([]);
    const [readyList, setReadyList]       = useState([]);
    const [loading, setLoading]           = useState(true);
    const [msg, setMsg]                   = useState(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [sendLoading, setSendLoading]   = useState(false);

    /* email confirm modal */
    const [emailConfirm, setEmailConfirm] = useState(null);
    const [emailLoading, setEmailLoading] = useState(false);

    /* detail modal */
    const [detail, setDetail]             = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await apiClient.get('/payroll-periods/my-periods', { token });
            setMyPeriods(res.data || []);
            setReadyList(res.readyToSubmit || []);
        } catch (e) {
            setMsg({ type: 'err', text: e.message || 'Failed to load payroll periods' });
        } finally { setLoading(false); }
    }, [token]);

    useEffect(() => { load(); }, [load]);

    /* ── Submit a ready group for HR review ─────────────────────────────── */
    const handleSubmit = async (item) => {
        if (!window.confirm(
            `Submit ${item.client_name} — ${MONTHS[item.period_month - 1]} ${item.period_year} for HR review?\n\n` +
            `${item.salary_count} employee(s) · ${formatCurrency(item.total_gross)}`
        )) return;

        setSubmitLoading(true);
        try {
            await apiClient.post('/payroll-periods/submit', {
                clientId:    item.client_id,
                periodMonth: item.period_month,
                periodYear:  item.period_year,
            }, { token });
            setMsg({ type: 'ok', text: `${item.client_name} — ${MONTHS[item.period_month - 1]} ${item.period_year} submitted to HR ✓` });
            load();
        } catch (e) {
            setMsg({ type: 'err', text: e.message || 'Submit failed' });
        } finally { setSubmitLoading(false); }
    };

    /* ── Download payslips ZIP ───────────────────────────────────────────── */
    const handleDownloadPayslips = async (p) => {
        setSendLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/payroll-periods/${p.period_id}/download-payslips`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(await res.text());
            const blob = await res.blob();
            if (blob.size === 0) throw new Error('Downloaded file is empty');
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `payslips-${p.client_name}-${MONTHS[p.period_month - 1]}-${p.period_year}.zip`.replace(/\s+/g, '-');
            a.click();
            URL.revokeObjectURL(url);
            setMsg({ type: 'ok', text: 'Payslips downloaded ✓' });
        } catch (e) {
            setMsg({ type: 'err', text: e.message || 'Download failed' });
        } finally { setSendLoading(false); }
    };

    /* ── Send payslip emails ─────────────────────────────────────────────── */
    const handleSendEmails = async () => {
        if (!emailConfirm) return;
        setEmailLoading(true);
        try {
            await apiClient.post(`/payroll-periods/${emailConfirm.period_id}/send-emails`, {}, { token });
            setMsg({ type: 'ok', text: `Payslip emails sent for ${emailConfirm.client_name} ✓` });
            setEmailConfirm(null);
        } catch (e) {
            setMsg({ type: 'err', text: e.message || 'Failed to send emails' });
        } finally { setEmailLoading(false); }
    };

    /* ── Detail modal ────────────────────────────────────────────────────── */
    const openDetail = async (p) => {
        setDetailLoading(true);
        setDetail({ ...p, salaries: null });
        try {
            const res = await apiClient.get(`/payroll-periods/${p.period_id}`, { token });
            setDetail(res.data);
        } catch { setDetail({ ...p, salaries: [] }); }
        finally { setDetailLoading(false); }
    };

    const STATUS_ORDER = ['SUBMITTED', 'HR_APPROVED', 'MD_APPROVED', 'REJECTED', 'SENT_TO_BANK'];
    const sorted = [...myPeriods].sort((a, b) =>
        STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
    );

    const mdApproved  = sorted.filter(p => ['MD_APPROVED', 'SENT_TO_BANK'].includes(p.status)).length;
    const pending     = sorted.filter(p => p.status === 'SUBMITTED').length;

    return (
        <div className="pp">
            {/* ── KPIs ──────────────────────────────────────────────── */}
            <section className="pp__kpis">
                {[
                    { label: 'Total Periods',    value: myPeriods.length },
                    { label: 'Pending Review',   value: pending,    color: '#f59e0b' },
                    { label: 'Ready to Process', value: mdApproved, color: '#10b981' },
                    { label: 'Ready to Submit',  value: readyList.length, color: '#6366f1' },
                ].map(k => (
                    <article key={k.label} className="pp__kpi">
                        <p className="pp__kpi-label">{k.label}</p>
                        <p className="pp__kpi-value" style={{ color: k.color }}>{k.value}</p>
                    </article>
                ))}
            </section>

            {msg && (
                <div className={`pp__msg pp__msg--${msg.type}`} onClick={() => setMsg(null)}>
                    {msg.text} <button className="pp__msg-close" onClick={() => setMsg(null)} aria-label="Dismiss"><X size={16} /></button>
                </div>
            )}

            {/* ── Ready to Submit ───────────────────────────────────── */}
            {readyList.length > 0 && (
                <section className="pp__section">
                    <header className="pp__section-header">
                        <div>
                            <p className="pp__eyebrow">Action Required</p>
                            <h3>Salary Groups Ready to Submit</h3>
                        </div>
                    </header>
                    <div className="pp__ready-grid">
                        {readyList.map(item => (
                            <div key={`${item.client_id}-${item.period_month}-${item.period_year}`} className="pp__ready-card">
                                <div className="pp__ready-body">
                                    <p className="pp__ready-client">{item.client_name}</p>
                                    <p className="pp__ready-period">
                                        {MONTHS[item.period_month - 1]} {item.period_year}
                                    </p>
                                    <p className="pp__ready-stats">
                                        {item.salary_count} employee{item.salary_count !== 1 ? 's' : ''} ·{' '}
                                        {formatCurrency(item.total_gross)}
                                    </p>
                                </div>
                                <button
                                    className="pp__btn pp__btn--submit"
                                    disabled={submitLoading}
                                    onClick={() => handleSubmit(item)}
                                >
                                    <Send size={15} aria-hidden /> Submit to HR
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── My Submitted Periods ──────────────────────────────── */}
            <section className="pp__section">
                <header className="pp__section-header">
                    <div>
                        <p className="pp__eyebrow">Finance Officer</p>
                        <h3>My Payroll Periods</h3>
                    </div>
                    <button className="pp__refresh" onClick={load} disabled={loading}>
                        {loading ? <RefreshCw size={16} className="pp__spin" /> : <RefreshCw size={16} />} Refresh
                    </button>
                </header>

                {loading ? (
                    <p className="pp__empty">Loading…</p>
                ) : sorted.length === 0 && readyList.length === 0 ? (
                    <div className="pp__empty-state">
                        <Inbox size={40} className="pp__empty-icon" aria-hidden />
                        <p>No payroll periods yet.</p>
                        <small>1) Go to Payroll Run and compute salaries for each client. 2) Return here to see &quot;Ready to Submit&quot; cards and click Submit to HR.</small>
                    </div>
                ) : sorted.length === 0 ? (
                    <p className="pp__empty">No submitted periods. Use the cards above to submit.</p>
                ) : (
                    <div className="pp__table-wrap">
                        <table className="pp__table">
                            <thead>
                                <tr>
                                    <th>Client</th>
                                    <th>Period</th>
                                    <th>Employees</th>
                                    <th>Total Gross</th>
                                    <th>Status</th>
                                    <th>Submitted</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map(p => (
                                    <tr key={p.period_id}>
                                        <td><strong>{p.client_name}</strong></td>
                                        <td>{MONTHS[p.period_month - 1]} {p.period_year}</td>
                                        <td>{p.salary_count || '—'}</td>
                                        <td>{formatCurrency(p.total_gross || 0)}</td>
                                        <td><Badge status={p.status} /></td>
                                        <td>{p.submitted_at ? new Date(p.submitted_at).toLocaleDateString() : '—'}</td>
                                        <td>
                                            <div className="pp__actions">
                                                <button className="pp__btn pp__btn--view" onClick={() => openDetail(p)}>
                                                    Details
                                                </button>
                                                {['MD_APPROVED', 'SENT_TO_BANK'].includes(p.status) && (
                                                    <>
                                                        <button
                                                            className="pp__btn pp__btn--view"
                                                            disabled={sendLoading}
                                                            onClick={() => handleDownloadPayslips(p)}
                                                        >
                                                            <Download size={15} aria-hidden /> Download Payslips
                                                        </button>
                                                        <button
                                                            className="pp__btn pp__btn--email"
                                                            onClick={() => setEmailConfirm(p)}
                                                        >
                                                            <Mail size={15} aria-hidden /> Send Emails
                                                        </button>
                                                    </>
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

            {/* ── Detail Modal ──────────────────────────────────────── */}
            {detail && (
                <div className="pp__overlay" onClick={() => setDetail(null)}>
                    <div className="pp__modal pp__modal--detail" onClick={e => e.stopPropagation()}>
                        <button className="pp__modal-close" onClick={() => setDetail(null)} aria-label="Close"><X size={20} /></button>
                        <div className="pp__modal-header">
                            <p className="pp__eyebrow">Period Detail</p>
                            <h2>{detail.client_name} — {MONTHS[(detail.period_month || 1) - 1]} {detail.period_year}</h2>
                            <p className="pp__modal-meta">
                                <Badge status={detail.status} />
                                &nbsp;·&nbsp;{detail.salary_count || 0} employees
                                &nbsp;·&nbsp;{formatCurrency(detail.total_gross || 0)}
                            </p>
                        </div>
                        {detailLoading ? <p className="pp__empty">Loading…</p> : (
                            <div className="pp__detail-list">
                                {!(detail.salaries?.length) ? (
                                    <p className="pp__empty">No salary records.</p>
                                ) : detail.salaries.map(s => (
                                    <div className="pp__sal-row" key={s.salary_id}>
                                        <div className="pp__sal-name">
                                            <strong>{s.full_name}</strong>
                                            <span>{s.email}</span>
                                        </div>
                                        <div className="pp__sal-nums">
                                            <span>Gross <strong>{formatCurrency(s.gross_salary)}</strong></span>
                                            <span>PAYE {formatCurrency(s.paye)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="pp__modal-footer">
                            <button className="pp__btn" onClick={() => setDetail(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Send Payslips Confirm Modal ───────────────────────── */}
            {emailConfirm && (
                <div className="pp__overlay" onClick={() => !emailLoading && setEmailConfirm(null)}>
                    <div className="pp__modal" onClick={e => e.stopPropagation()}>
                        <button className="pp__modal-close" onClick={() => setEmailConfirm(null)} disabled={emailLoading} aria-label="Close"><X size={20} /></button>
                        <div className="pp__modal-header">
                            <p className="pp__eyebrow">Finance Officer Action</p>
                            <h2><Mail size={20} style={{ verticalAlign: 'middle' }} /> Send Payslip Emails</h2>
                            <p className="pp__modal-meta">
                                {emailConfirm.client_name} — {MONTHS[(emailConfirm.period_month || 1) - 1]} {emailConfirm.period_year}
                            </p>
                        </div>
                        <div style={{ padding: '16px 28px 8px' }}>
                            <p style={{ color: '#475569', fontSize: '0.92rem', lineHeight: 1.6 }}>
                                Each employee in this period will receive a personalised payslip email with their salary breakdown and net pay.
                            </p>
                        </div>
                        <div className="pp__modal-footer">
                            <button className="pp__btn" onClick={() => setEmailConfirm(null)} disabled={emailLoading}>Cancel</button>
                            <button className="pp__btn pp__btn--email" disabled={emailLoading} onClick={handleSendEmails}>
                                {emailLoading ? 'Sending…' : <><Mail size={15} /> Send Payslips</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PayrollPeriodsPage;
