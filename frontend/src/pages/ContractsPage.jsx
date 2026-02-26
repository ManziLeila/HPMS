import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import useAuth from '../hooks/useAuth';
import './ContractsPage.css';

/* ── helpers ─────────────────────────────────────────────────── */
const CONTRACT_TYPES = ['fixed-term', 'permanent', 'internship', 'probation', 'part-time'];

const STATUS_META = {
    active: { label: 'Active', color: '#10b981' },
    expired: { label: 'Expired', color: '#ef4444' },
    terminated: { label: 'Terminated', color: '#f59e0b' },
    renewed: { label: 'Renewed', color: '#6366f1' },
};

const daysUntil = (dateStr) => {
    if (!dateStr) return null;
    const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
    return diff;
};

const urgencyClass = (days) => {
    if (days === null) return '';
    if (days <= 7) return 'cp__expiry--critical';
    if (days <= 14) return 'cp__expiry--urgent';
    if (days <= 30) return 'cp__expiry--warn';
    return '';
};

const BLANK = {
    employeeId: '', contractType: 'fixed-term', jobTitle: '', department: '',
    startDate: '', endDate: '', salaryGrade: '', grossSalary: '', notes: '',
};

/* ── main ─────────────────────────────────────────────────────── */
const ContractsPage = () => {
    const { token, user } = useAuth();
    const canEdit = ['FinanceOfficer', 'HR', 'Admin'].includes(user?.role);

    const [contracts, setContracts] = useState([]);
    const [stats, setStats] = useState({});
    const [expiring, setExpiring] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');   // status filter
    const [search, setSearch] = useState('');
    const [msg, setMsg] = useState(null);

    /* form modal */
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);  // contract id or null
    const [form, setForm] = useState(BLANK);
    const [saving, setSaving] = useState(false);

    /* detail modal */
    const [detail, setDetail] = useState(null);

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const [listRes, statsRes, expiringRes] = await Promise.all([
                apiClient.get('/contracts', { token }),
                apiClient.get('/contracts/stats', { token }),
                apiClient.get('/contracts/expiring?days=30', { token }),
            ]);
            setContracts(listRes.data || []);
            setStats(statsRes.data || {});
            setExpiring(expiringRes.data || []);
        } catch (e) {
            setMsg({ type: 'err', text: e.message });
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { load(); }, [load]);

    /* ── filter + search ──────────────────────────────────────────── */
    const visible = contracts.filter((c) => {
        const matchStatus = !filter || c.status === filter;
        const matchSearch = !search || [c.full_name, c.job_title, c.department, c.email]
            .some((v) => v?.toLowerCase().includes(search.toLowerCase()));
        return matchStatus && matchSearch;
    });

    /* ── form helpers ─────────────────────────────────────────────── */
    const openCreate = () => { setEditing(null); setForm(BLANK); setShowForm(true); };
    const openEdit = (c) => {
        setEditing(c.contract_id);
        setForm({
            employeeId: c.employee_id,
            contractType: c.contract_type,
            jobTitle: c.job_title,
            department: c.department || '',
            startDate: c.start_date?.slice(0, 10) || '',
            endDate: c.end_date?.slice(0, 10) || '',
            salaryGrade: c.salary_grade || '',
            grossSalary: c.gross_salary || '',
            notes: c.notes || '',
        });
        setShowForm(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...form,
                employeeId: +form.employeeId,
                grossSalary: form.grossSalary ? +form.grossSalary : 0,
                endDate: form.endDate || null,
            };
            if (editing) {
                await apiClient.patch(`/contracts/${editing}`, payload, { token });
                setMsg({ type: 'ok', text: 'Contract updated ✅' });
            } else {
                await apiClient.post('/contracts', payload, { token });
                setMsg({ type: 'ok', text: 'Contract created ✅' });
            }
            setShowForm(false);
            load();
        } catch (ex) {
            setMsg({ type: 'err', text: ex.message });
        } finally {
            setSaving(false);
        }
    };

    const sendNotifications = async () => {
        try {
            await apiClient.post('/contracts/notify', {}, { token });
            setMsg({ type: 'ok', text: 'Expiry notifications sent to employees & HR ✅' });
        } catch (e) {
            setMsg({ type: 'err', text: e.message });
        }
    };

    return (
        <div className="cp">
            {/* ── stat cards ──────────────────────────────────────────── */}
            <section className="cp__stats">
                {[
                    { label: 'Active Contracts', value: stats.active || 0, color: '#10b981' },
                    { label: 'Permanent', value: stats.permanent || 0, color: '#6366f1' },
                    { label: 'Expiring in 30 days', value: stats.expiring_30 || 0, color: '#f59e0b' },
                    { label: 'Expiring in 14 days', value: stats.expiring_14 || 0, color: '#ef4444' },
                    { label: 'Expired', value: stats.expired || 0, color: '#94a3b8' },
                ].map((s) => (
                    <article key={s.label} className="cp__stat">
                        <p className="cp__stat-label">{s.label}</p>
                        <p className="cp__stat-value" style={{ color: s.color }}>{s.value}</p>
                    </article>
                ))}
            </section>

            {/* ── expiry alert banner ──────────────────────────────────── */}
            {expiring.length > 0 && (
                <div className="cp__alert-banner">
                    <span>⚠️</span>
                    <div>
                        <strong>{expiring.length} contract{expiring.length > 1 ? 's' : ''} expiring in the next 30 days</strong>
                        <p>{expiring.slice(0, 3).map(c => c.full_name).join(', ')}{expiring.length > 3 ? ` and ${expiring.length - 3} more` : ''}</p>
                    </div>
                    {canEdit && (
                        <button className="cp__alert-btn" onClick={sendNotifications}>
                            📧 Send Reminders
                        </button>
                    )}
                </div>
            )}

            {/* ── message ─────────────────────────────────────────────── */}
            {msg && (
                <div className={`cp__msg cp__msg--${msg.type}`} onClick={() => setMsg(null)}>
                    {msg.text} <span>✕</span>
                </div>
            )}

            {/* ── toolbar ─────────────────────────────────────────────── */}
            <section className="cp__toolbar">
                <input
                    className="cp__search"
                    placeholder="🔍  Search employee, position, department…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select className="cp__filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="">All statuses</option>
                    {Object.entries(STATUS_META).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                    ))}
                </select>
                {canEdit && (
                    <button className="cp__btn cp__btn--primary" onClick={openCreate}>
                        + New Contract
                    </button>
                )}
            </section>

            {/* ── contracts table ──────────────────────────────────────── */}
            <section className="cp__section">
                {loading ? (
                    <p className="cp__empty">Loading contracts…</p>
                ) : visible.length === 0 ? (
                    <div className="cp__empty-state">
                        <span>📄</span>
                        <p>No contracts found. {canEdit && <button className="cp__link" onClick={openCreate}>Create the first one →</button>}</p>
                    </div>
                ) : (
                    <div className="cp__table-wrap">
                        <table className="cp__table">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Position</th>
                                    <th>Type</th>
                                    <th>Start</th>
                                    <th>Ends</th>
                                    <th>Days Left</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visible.map((c) => {
                                    const days = daysUntil(c.end_date);
                                    const meta = STATUS_META[c.status] || { label: c.status, color: '#94a3b8' };
                                    return (
                                        <tr key={c.contract_id}>
                                            <td>
                                                <p className="cp__name">{c.full_name}</p>
                                                <p className="cp__email">{c.email}</p>
                                            </td>
                                            <td>{c.job_title}</td>
                                            <td>
                                                <span className="cp__type-badge">{c.contract_type}</span>
                                            </td>
                                            <td>{c.start_date?.slice(0, 10)}</td>
                                            <td>{c.end_date ? c.end_date.slice(0, 10) : <em>—</em>}</td>
                                            <td>
                                                {days !== null ? (
                                                    <span className={`cp__expiry ${urgencyClass(days)}`}>
                                                        {days < 0 ? `${Math.abs(days)}d ago` : `${days}d`}
                                                    </span>
                                                ) : <em>Permanent</em>}
                                            </td>
                                            <td>
                                                <span className="cp__status-badge"
                                                    style={{ color: meta.color, background: meta.color + '18', borderColor: meta.color + '44' }}>
                                                    {meta.label}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="cp__row-actions">
                                                    <button className="cp__btn cp__btn--sm" onClick={() => setDetail(c)}>View</button>
                                                    {canEdit && (
                                                        <button className="cp__btn cp__btn--sm cp__btn--edit" onClick={() => openEdit(c)}>Edit</button>
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

            {/* ══════════════════════════════════════════════════════════
          CREATE / EDIT MODAL
      ══════════════════════════════════════════════════════════ */}
            {showForm && (
                <div className="cp__overlay" onClick={() => setShowForm(false)}>
                    <div className="cp__modal" onClick={(e) => e.stopPropagation()}>
                        <button className="cp__modal-close" onClick={() => setShowForm(false)}>✕</button>
                        <div className="cp__modal-header">
                            <p className="cp__eyebrow">{editing ? 'Edit' : 'New'} Contract</p>
                            <h2>{editing ? 'Update Contract' : 'Create Employee Contract'}</h2>
                        </div>
                        <form className="cp__form" onSubmit={handleSave}>
                            <div className="cp__form-grid">
                                {!editing && (
                                    <label className="cp__label cp__label--full">
                                        Employee ID *
                                        <input type="number" required value={form.employeeId}
                                            onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                                            placeholder="e.g. 12" />
                                    </label>
                                )}
                                <label className="cp__label">
                                    Job Title *
                                    <input required value={form.jobTitle}
                                        onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                                        placeholder="e.g. Software Engineer" />
                                </label>
                                <label className="cp__label">
                                    Department
                                    <input value={form.department}
                                        onChange={(e) => setForm({ ...form, department: e.target.value })}
                                        placeholder="e.g. IT" />
                                </label>
                                <label className="cp__label">
                                    Contract Type *
                                    <select required value={form.contractType}
                                        onChange={(e) => setForm({ ...form, contractType: e.target.value })}>
                                        {CONTRACT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </label>
                                <label className="cp__label">
                                    Salary Grade
                                    <input value={form.salaryGrade}
                                        onChange={(e) => setForm({ ...form, salaryGrade: e.target.value })}
                                        placeholder="e.g. Grade 3" />
                                </label>
                                <label className="cp__label">
                                    Gross Salary (RWF)
                                    <input type="number" value={form.grossSalary}
                                        onChange={(e) => setForm({ ...form, grossSalary: e.target.value })}
                                        placeholder="e.g. 500000" />
                                </label>
                                <label className="cp__label">
                                    Start Date *
                                    <input type="date" required value={form.startDate}
                                        onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                                </label>
                                <label className="cp__label">
                                    End Date <em>(blank = permanent)</em>
                                    <input type="date" value={form.endDate}
                                        onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                                </label>
                                <label className="cp__label cp__label--full">
                                    Notes
                                    <textarea rows={3} value={form.notes}
                                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                        placeholder="Renewal conditions, probation terms, etc." />
                                </label>
                                {editing && (
                                    <label className="cp__label">
                                        Status
                                        <select value={form.status || 'active'}
                                            onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                            {Object.keys(STATUS_META).map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                                        </select>
                                    </label>
                                )}
                            </div>
                            <div className="cp__modal-footer">
                                <button type="button" className="cp__btn" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="cp__btn cp__btn--primary cp__btn--lg" disabled={saving}>
                                    {saving ? 'Saving…' : editing ? '💾 Update Contract' : '✅ Create Contract'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════
          DETAIL VIEW MODAL
      ══════════════════════════════════════════════════════════ */}
            {detail && (
                <div className="cp__overlay" onClick={() => setDetail(null)}>
                    <div className="cp__modal cp__modal--detail" onClick={(e) => e.stopPropagation()}>
                        <button className="cp__modal-close" onClick={() => setDetail(null)}>✕</button>
                        <div className="cp__modal-header">
                            <p className="cp__eyebrow">Contract Details</p>
                            <h2>{detail.full_name}</h2>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>{detail.email}</p>
                        </div>
                        <div className="cp__detail-grid">
                            {[
                                ['Job Title', detail.job_title],
                                ['Department', detail.department || '—'],
                                ['Contract Type', detail.contract_type],
                                ['Salary Grade', detail.salary_grade || '—'],
                                ['Gross Salary', detail.gross_salary ? `RWF ${Number(detail.gross_salary).toLocaleString()}` : '—'],
                                ['Start Date', detail.start_date?.slice(0, 10)],
                                ['End Date', detail.end_date?.slice(0, 10) || 'Permanent'],
                                ['Days Remaining', daysUntil(detail.end_date) !== null ? `${daysUntil(detail.end_date)} days` : 'N/A'],
                                ['Status', (STATUS_META[detail.status]?.label || detail.status)],
                                ['Created', detail.created_at?.slice(0, 10)],
                            ].map(([k, v]) => (
                                <div key={k} className="cp__detail-field">
                                    <label>{k}</label>
                                    <span>{v}</span>
                                </div>
                            ))}
                            {detail.notes && (
                                <div className="cp__detail-field cp__detail-field--full">
                                    <label>Notes</label>
                                    <span>{detail.notes}</span>
                                </div>
                            )}
                        </div>
                        <div className="cp__modal-footer">
                            {canEdit && (
                                <button className="cp__btn cp__btn--edit" onClick={() => { setDetail(null); openEdit(detail); }}>
                                    ✏️ Edit Contract
                                </button>
                            )}
                            <button className="cp__btn cp__btn--primary" onClick={() => setDetail(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractsPage;
