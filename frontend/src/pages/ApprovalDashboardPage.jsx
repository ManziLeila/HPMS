import { useCallback, useEffect, useState } from 'react';
import { 
    BarChart3, ClipboardList, AlertCircle, ArrowRight, 
    Clock, CheckCircle, XCircle, Building2, Users, 
    Mail, Eye, Download
} from 'lucide-react';
import { apiClient, API_BASE_URL } from '../api/client';
import useAuth from '../hooks/useAuth';
import { formatCurrency } from '../utils/payroll';
import './ApprovalDashboardPage.css';

/* ─────────────────────── STATUS CONFIGURATION ─────────────────────── */
const STATUS_CONFIG = {
    SUBMITTED:    { label: 'Awaiting HR Review',      color: '#f59e0b', icon: Clock,        stage: 1 },
    PENDING:      { label: 'Awaiting HR Review',      color: '#f59e0b', icon: Clock,        stage: 1 },
    HR_APPROVED:  { label: 'HR Approved → MD Review', color: '#6366f1', icon: Users,        stage: 2 },
    MD_APPROVED:  { label: 'Completed',               color: '#10b981', icon: CheckCircle,  stage: 3 },
    HR_REJECTED:  { label: 'Rejected by HR',          color: '#ef4444', icon: XCircle,      stage: 0 },
    MD_REJECTED:  { label: 'Rejected by MD',          color: '#ef4444', icon: XCircle,      stage: 0 },
    REJECTED:     { label: 'Rejected',                color: '#ef4444', icon: XCircle,      stage: 0 },
};

/* ─────────────────────── HEADER STATS ─────────────────────── */
const StatsCard = ({ icon: Icon, label, value, color }) => (
    <div className="apd__stat-card">
        <div className="apd__stat-icon" style={{ background: color + '20', color }}>
            <Icon size={24} />
        </div>
        <div className="apd__stat-content">
            <p className="apd__stat-label">{label}</p>
            <p className="apd__stat-value">{value}</p>
        </div>
    </div>
);

/* ─────────────────────── BATCH STATUS BADGE ─────────────────────── */
const StatusBadge = ({ status }) => {
    const config = STATUS_CONFIG[status] || { label: status, color: '#94a3b8', icon: AlertCircle, stage: 0 };
    const Icon = config.icon;
    return (
        <span className="apd__badge" style={{ background: config.color + '15', color: config.color, borderColor: config.color + '40' }}>
            <Icon size={15} />
            {config.label}
        </span>
    );
};

/* ─────────────────────── APPROVAL TIMELINE ─────────────────────── */
const ApprovalTimeline = ({ batch }) => {
    const stages = [
        { name: 'Submitted', date: batch.created_at, user: 'Finance Officer', status: 'complete' },
        { 
            name: 'HR Review', 
            date: batch.hr_reviewed_at, 
            user: batch.hr_reviewer_name,
            status: batch.hr_status === 'APPROVED' ? 'complete' : batch.hr_status === 'REJECTED' ? 'rejected' : 'pending'
        },
        { 
            name: 'MD Approval', 
            date: batch.md_reviewed_at, 
            user: batch.md_reviewer_name,
            status: batch.md_status === 'APPROVED' ? 'complete' : batch.md_status === 'REJECTED' ? 'rejected' : 'pending'
        },
    ];

    return (
        <div className="apd__timeline">
            {stages.map((stage, i) => (
                <div key={i} className={`apd__stage ${stage.status}`}>
                    <div className="apd__stage-dot" />
                    <div className="apd__stage-content">
                        <p className="apd__stage-name">{stage.name}</p>
                        {stage.date && <p className="apd__stage-date">{new Date(stage.date).toLocaleDateString()}</p>}
                        {stage.user && <p className="apd__stage-user">by {stage.user}</p>}
                    </div>
                    {i < stages.length - 1 && <ArrowRight size={16} className="apd__stage-arrow" />}
                </div>
            ))}
        </div>
    );
};

/* ─────────────────────── BATCH DETAIL MODAL ─────────────────────── */
const BatchDetailModal = ({ batch, onClose }) => {
    if (!batch) return null;

    return (
        <div className="apd__modal-overlay" onClick={onClose}>
            <div className="apd__modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="apd__modal-header">
                    <h2>{batch.batch_name}</h2>
                    <button onClick={onClose} className="apd__modal-close">×</button>
                </div>

                <div className="apd__modal-body">
                    {/* Batch Info */}
                    <section className="apd__section">
                        <h3>Batch Information</h3>
                        <div className="apd__info-grid">
                            <div className="apd__info-item">
                                <span className="apd__info-label">Period ID</span>
                                <span className="apd__info-value">#{batch.batch_id}</span>
                            </div>
                            <div className="apd__info-item">
                                <span className="apd__info-label">Period</span>
                                <span className="apd__info-value">{batch.period_month}/{batch.period_year}</span>
                            </div>
                            <div className="apd__info-item">
                                <span className="apd__info-label">Status</span>
                                <StatusBadge status={batch.status} />
                            </div>
                            <div className="apd__info-item">
                                <span className="apd__info-label">Employees</span>
                                <span className="apd__info-value">{batch.total_employees}</span>
                            </div>
                        </div>
                    </section>

                    {/* Financial Summary */}
                    <section className="apd__section">
                        <h3>Financial Summary</h3>
                        <div className="apd__financial-grid">
                            <div className="apd__fin-item">
                                <span>Total Gross</span>
                                <p>{formatCurrency(batch.total_gross_salary)}</p>
                            </div>
                            <div className="apd__fin-item">
                                <span>Deductions</span>
                                <p>{formatCurrency(batch.total_deductions)}</p>
                            </div>
                            <div className="apd__fin-item">
                                <span>RSSB</span>
                                <p>{formatCurrency(batch.total_rssb)}</p>
                            </div>
                            <div className="apd__fin-item">
                                <span>PAYE</span>
                                <p>{formatCurrency(batch.total_paye)}</p>
                            </div>
                            <div className="apd__fin-item highlight">
                                <span>Net Salary</span>
                                <p>{formatCurrency(batch.total_net_salary)}</p>
                            </div>
                        </div>
                    </section>

                    {/* Approval Timeline */}
                    <section className="apd__section">
                        <h3>Approval Timeline</h3>
                        <ApprovalTimeline batch={batch} />
                    </section>

                    {/* Approval Comments */}
                    {(batch.hr_comments || batch.md_comments) && (
                        <section className="apd__section">
                            <h3>Reviewer Comments</h3>
                            {batch.hr_comments && (
                                <div className="apd__comment">
                                    <p className="apd__comment-title">HR Review</p>
                                    <p className="apd__comment-text">{batch.hr_comments}</p>
                                </div>
                            )}
                            {batch.md_comments && (
                                <div className="apd__comment">
                                    <p className="apd__comment-title">MD Review</p>
                                    <p className="apd__comment-text">{batch.md_comments}</p>
                                </div>
                            )}
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ─────────────────────── BATCH TABLE CARD ─────────────────────── */
const BatchCard = ({ batch, onDetails, onDownload, onSendEmails, actionLoading }) => {
    const config = STATUS_CONFIG[batch.status];
    const isCompleted = batch.status === 'MD_APPROVED';
    return (
        <div className="apd__batch-card">
            <div className="apd__card-header">
                <div className="apd__card-title">
                    <h4>{batch.batch_name}</h4>
                    <span className="apd__batch-id">Period #{batch.batch_id}</span>
                </div>
                <StatusBadge status={batch.status} />
            </div>

            <div className="apd__card-body">
                <div className="apd__card-grid">
                    <div className="apd__card-item">
                        <span className="apd__card-label">Period</span>
                        <p className="apd__card-value">{batch.period_month}/{batch.period_year}</p>
                    </div>
                    <div className="apd__card-item">
                        <span className="apd__card-label">Employees</span>
                        <p className="apd__card-value">{batch.total_employees}</p>
                    </div>
                    <div className="apd__card-item">
                        <span className="apd__card-label">Net Salary</span>
                        <p className="apd__card-value">{formatCurrency(batch.total_net_salary)}</p>
                    </div>
                    <div className="apd__card-item">
                        <span className="apd__card-label">Submitted</span>
                        <p className="apd__card-value">{new Date(batch.created_at).toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Mini Timeline */}
                <div className="apd__mini-timeline">
                    {['SUBMITTED', 'HR_APPROVED', 'MD_APPROVED'].map((status, i) => {
                        const isDone = ['SUBMITTED', 'HR_APPROVED', 'MD_APPROVED'].indexOf(batch.status) >= i;
                        const isReject = ['HR_REJECTED', 'MD_REJECTED', 'REJECTED'].includes(batch.status) && i === 0;
                        return (
                            <div key={status} className={`apd__timeline-dot ${isDone ? 'done' : isReject ? 'reject' : ''}`} />
                        );
                    })}
                </div>
            </div>

            <div className="apd__card-footer">
                <button className="apd__btn-small" onClick={() => onDetails(batch)}>
                    <Eye size={16} /> Details
                </button>
                {isCompleted && (
                    <>
                        <button className="apd__btn-small" disabled={actionLoading} onClick={() => onDownload(batch)}>
                            <Download size={16} /> Download Payslips
                        </button>
                        <button className="apd__btn-small" disabled={actionLoading} onClick={() => onSendEmails(batch)}>
                            <Mail size={16} /> Send Emails
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

/* ─────────────────────── MAIN COMPONENT ─────────────────────── */
const ApprovalDashboardPage = () => {
    const { token, user } = useAuth();
    const [batches, setBatches] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [msg, setMsg] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [emailConfirm, setEmailConfirm] = useState(null);

    const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    // Normalize period → fields the existing card components expect
    const normalizePeriod = (p) => ({
        ...p,
        batch_id:          p.period_id,
        batch_name:        `${p.client_name} — ${MONTHS[(p.period_month || 1) - 1]} ${p.period_year}`,
        total_employees:   p.salary_count || 0,
        total_gross_salary:p.total_gross  || 0,
        total_net_salary:  p.total_gross  || 0,
        total_deductions:  p.total_paye   || 0,
        total_rssb:        0,
        total_paye:        p.total_paye   || 0,
        created_at:        p.submitted_at || p.created_at,
        hr_reviewed_at:    p.hr_reviewed_at,
        md_reviewed_at:    p.md_reviewed_at,
        hr_reviewer_name:  p.hr_reviewed_by_name,
        md_reviewer_name:  p.md_reviewed_by_name,
        hr_comments:       p.hr_comments,
        md_comments:       p.md_comments,
        hr_status:         p.status === 'HR_APPROVED' || p.status === 'MD_APPROVED' ? 'APPROVED' : null,
        md_status:         p.status === 'MD_APPROVED' ? 'APPROVED' : null,
    });

    const loadData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await apiClient.get('/payroll-periods/dashboard', { token });
            const raw = res.data || [];
            const normalized = raw.map(normalizePeriod);
            setBatches(normalized);

            // Derive stats from loaded data
            const pending    = normalized.filter(b => b.status === 'SUBMITTED').length;
            const hrApproved = normalized.filter(b => b.status === 'HR_APPROVED').length;
            const mdApproved = normalized.filter(b => b.status === 'MD_APPROVED').length;
            setStats({ pendingHr: pending, hrApproved, pendingMd: hrApproved, mdApproved });
        } catch (e) {
            setMsg({ type: 'err', text: e.message || 'Failed to load payroll periods' });
        } finally {
            setLoading(false);
        }
    }, [token, user?.role]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleDownloadPayslips = async (batch) => {
        setActionLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/payroll-periods/${batch.batch_id}/download-payslips`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(await res.text());
            const blob = await res.blob();
            if (blob.size === 0) throw new Error('Downloaded file is empty');
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `payslips-${batch.batch_name.replace(/\s+/g, '-')}.zip`;
            a.click();
            URL.revokeObjectURL(url);
            setMsg({ type: 'ok', text: 'Payslips downloaded ✓' });
        } catch (e) {
            setMsg({ type: 'err', text: e.message || 'Download failed' });
        } finally { setActionLoading(false); }
    };

    const handleSendEmails = async () => {
        if (!emailConfirm) return;
        setActionLoading(true);
        try {
            await apiClient.post(`/payroll-periods/${emailConfirm.batch_id}/send-emails`, {}, { token });
            setMsg({ type: 'ok', text: `Payslip emails sent for ${emailConfirm.batch_name} ✓` });
            setEmailConfirm(null);
            loadData();
        } catch (e) {
            setMsg({ type: 'err', text: e.message || 'Send failed' });
        } finally { setActionLoading(false); }
    };

    const openSendEmails = (batch) => setEmailConfirm(batch);

    // Filter batches
    const filteredBatches = filter === 'ALL' ? batches : batches.filter(b => b.status === filter);

    return (
        <div className="apd__container">
            {/* Header */}
            <div className="apd__header">
                <div className="apd__header-content">
                    <h1><BarChart3 size={32} /> Payroll Approval Dashboard</h1>
                    <p>Track payroll periods (by client &amp; month) through HR review → MD approval → Bank submission</p>
                </div>
            </div>

            {/* Messages */}
            {msg && (
                <div className={`apd__message apd__msg-${msg.type}`}>
                    {msg.type === 'err' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
                    {msg.text}
                </div>
            )}

            {/* Stats Cards */}
            {stats && (
                <div className="apd__stats-grid">
                    <StatsCard icon={Clock} label="Awaiting HR" value={stats.pendingHr || 0} color="#f59e0b" />
                    <StatsCard icon={Users} label="HR Approved" value={stats.hrApproved || 0} color="#6366f1" />
                    <StatsCard icon={Building2} label="Awaiting MD" value={stats.pendingMd || 0} color="#10b981" />
                    <StatsCard icon={CheckCircle} label="Completed" value={stats.mdApproved || 0} color="#10b981" />
                </div>
            )}

            {/* Filters */}
            <div className="apd__filters">
                <button 
                    className={`apd__filter-btn ${filter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setFilter('ALL')}
                >
                    All Periods
                </button>
                <button 
                    className={`apd__filter-btn ${filter === 'SUBMITTED' ? 'active' : ''}`}
                    onClick={() => setFilter('SUBMITTED')}
                >
                    Awaiting HR
                </button>
                <button 
                    className={`apd__filter-btn ${filter === 'HR_APPROVED' ? 'active' : ''}`}
                    onClick={() => setFilter('HR_APPROVED')}
                >
                    HR Approved
                </button>
                <button 
                    className={`apd__filter-btn ${filter === 'MD_APPROVED' ? 'active' : ''}`}
                    onClick={() => setFilter('MD_APPROVED')}
                >
                    MD Approved
                </button>
                <button 
                    className={`apd__filter-btn ${filter === 'MD_APPROVED' ? 'active' : ''}`}
                    onClick={() => setFilter('MD_APPROVED')}
                >
                    Completed
                </button>
            </div>

            {/* Batches Grid */}
            <div className="apd__batches-grid">
                {loading ? (
                    <div className="apd__loading">Loading periods...</div>
                ) : filteredBatches.length === 0 ? (
                    <div className="apd__empty">
                        <ClipboardList size={48} />
                        <p>No periods found</p>
                    </div>
                ) : (
                    filteredBatches.map(batch => (
                        <BatchCard 
                            key={batch.batch_id} 
                            batch={batch} 
                            onDetails={setSelectedBatch}
                            onDownload={handleDownloadPayslips}
                            onSendEmails={openSendEmails}
                            actionLoading={actionLoading}
                        />
                    ))
                )}
            </div>

            {/* Batch Detail Modal */}
            <BatchDetailModal batch={selectedBatch} onClose={() => setSelectedBatch(null)} />

            {/* Send Emails Confirm Modal */}
            {emailConfirm && (
                <div className="apd__modal-overlay" onClick={() => !actionLoading && setEmailConfirm(null)}>
                    <div className="apd__modal-content" onClick={e => e.stopPropagation()}>
                        <div className="apd__modal-header">
                            <h2><Mail size={20} style={{ verticalAlign: 'middle' }} /> Send Payslip Emails</h2>
                            <button className="apd__modal-close" onClick={() => setEmailConfirm(null)} disabled={actionLoading} aria-label="Close">×</button>
                        </div>
                        <div className="apd__modal-body">
                            <p style={{ margin: '0 0 8px' }}><strong>{emailConfirm.batch_name}</strong></p>
                            <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>
                                Each employee in this period will receive a personalised payslip email.
                            </p>
                        </div>
                        <div style={{ padding: '1rem 2rem', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button className="apd__btn-small" onClick={() => setEmailConfirm(null)} disabled={actionLoading}>Cancel</button>
                            <button className="apd__btn-small" style={{ background: '#10b981', color: 'white', border: 'none' }} disabled={actionLoading} onClick={handleSendEmails}>
                                {actionLoading ? 'Sending…' : <><Mail size={14} /> Send Emails</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApprovalDashboardPage;
