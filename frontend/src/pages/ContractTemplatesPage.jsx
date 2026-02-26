import { useState, useEffect, useRef } from 'react';
import { apiClient, API_BASE_URL } from '../api/client';
import useAuth from '../hooks/useAuth';
import './ContractTemplatesPage.css';

const EDITOR_ROLES = ['Admin', 'HR', 'FinanceOfficer'];

const PLACEHOLDER_LIST = [
    { key: '{{full_name}}', label: 'Full Name' },
    { key: '{{email}}', label: 'Email' },
    { key: '{{department}}', label: 'Department' },
    { key: '{{job_title}}', label: 'Job Title' },
    { key: '{{contract_type}}', label: 'Contract Type' },
    { key: '{{start_date}}', label: 'Start Date' },
    { key: '{{end_date}}', label: 'End Date' },
    { key: '{{gross_salary}}', label: 'Gross Salary' },
    { key: '{{salary_grade}}', label: 'Salary Grade' },
    { key: '{{notes}}', label: 'Notes' },
];

const SAMPLE = {
    full_name: 'Jean Baptiste Uwimana',
    email: 'j.uwimana@company.com',
    department: 'Finance',
    job_title: 'Accountant',
    contract_type: 'Fixed-Term',
    start_date: '2026-03-01',
    end_date: '2027-02-28',
    gross_salary: '850000',
    salary_grade: 'G5',
    notes: 'Probation period: 3 months.',
};

/* ── merge placeholders into body ─────────────────────────────── */
const fillBody = (body, data) => {
    const fmt = (v) => (v == null || v === '' ? '' : String(v));
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    return body
        .replace(/{{full_name}}/g, fmt(data.full_name))
        .replace(/{{email}}/g, fmt(data.email))
        .replace(/{{department}}/g, fmt(data.department))
        .replace(/{{job_title}}/g, fmt(data.job_title))
        .replace(/{{contract_type}}/g, fmt(data.contract_type))
        .replace(/{{start_date}}/g, fmtDate(data.start_date))
        .replace(/{{end_date}}/g, fmtDate(data.end_date) || 'Open-ended')
        .replace(/{{gross_salary}}/g, data.gross_salary ? Number(data.gross_salary).toLocaleString() : '')
        .replace(/{{salary_grade}}/g, fmt(data.salary_grade))
        .replace(/{{notes}}/g, fmt(data.notes));
};

const blankForm = () => ({
    name: '',
    description: '',
    contractType: 'fixed-term',
    body: '',
    isDefault: false,
});

const ContractTemplatesPage = () => {
    const { token, user } = useAuth();
    const canEdit = EDITOR_ROLES.includes(user?.role);

    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState(null);

    /* editor panel */
    const [editing, setEditing] = useState(null); // null | template object
    const [form, setForm] = useState(blankForm());
    const [saving, setSaving] = useState(false);

    /* preview panel */
    const [preview, setPreview] = useState(false);

    /* delete confirm */
    const [delConfirm, setDelConfirm] = useState(null);

    const textareaRef = useRef(null);

    const flash = (text, isError = false) => {
        setMsg({ text, isError });
        setTimeout(() => setMsg(null), 4000);
    };

    /* ── fetch templates ──────────────────────────────────────── */
    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const data = await apiClient.get('/contract-templates', { token });
            setTemplates(Array.isArray(data) ? data : data.data ?? []);
        } catch (e) {
            flash(e.message || 'Failed to load templates', true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTemplates(); }, []);

    /* ── open editor ─────────────────────────────────────────── */
    const openNew = () => {
        setForm(blankForm());
        setEditing('new');
        setPreview(false);
    };
    const openEdit = (t) => {
        setForm({
            name: t.name,
            description: t.description || '',
            contractType: t.contract_type,
            body: t.body,
            isDefault: t.is_default,
        });
        setEditing(t);
        setPreview(false);
    };

    /* ── insert placeholder at cursor ───────────────────────── */
    const insertPlaceholder = (key) => {
        const el = textareaRef.current;
        if (!el) return;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const next = form.body.slice(0, start) + key + form.body.slice(end);
        setForm((f) => ({ ...f, body: next }));
        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(start + key.length, start + key.length);
        });
    };

    /* ── save (create or update) ─────────────────────────────── */
    const handleSave = async () => {
        if (!form.name.trim()) return flash('Template name is required', true);
        if (!form.body.trim()) return flash('Template body cannot be empty', true);
        try {
            setSaving(true);
            if (editing === 'new') {
                await apiClient.post('/contract-templates', form, { token });
                flash('✅ Template created!');
            } else {
                await apiClient.patch(`/contract-templates/${editing.template_id}`, form, { token });
                flash('✅ Template updated!');
            }
            setEditing(null);
            fetchTemplates();
        } catch (e) {
            flash('❌ ' + (e.message || 'Save failed'), true);
        } finally {
            setSaving(false);
        }
    };

    /* ── delete ──────────────────────────────────────────────── */
    const handleDelete = async (t) => {
        try {
            await apiClient.delete(`/contract-templates/${t.template_id}`, { token });
            flash('Template deleted');
            setDelConfirm(null);
            fetchTemplates();
        } catch (e) {
            flash('❌ ' + (e.message || 'Delete failed'), true);
        }
    };

    /* ── download blank template as PDF (no contract tied) ───── */
    const handleDownloadBlankPDF = async (t) => {
        // POST /contract-templates/:id/preview → filled text → client print
        // For blank template we use sample data
        try {
            flash(`Preparing preview PDF…`);
            const result = await apiClient.post(
                `/contract-templates/${t.template_id}/preview`,
                SAMPLE,
                { token }
            );
            // Open print window
            const w = window.open('', '_blank');
            w.document.write(`<pre style="font-family:Georgia,serif;max-width:800px;margin:40px auto;white-space:pre-wrap;line-height:1.6">${result.body}</pre>`);
            w.document.close();
            w.print();
            flash('✅ Preview opened — use your browser Print to PDF');
        } catch (e) {
            flash('❌ ' + (e.message || 'Preview failed'), true);
        }
    };

    const livePreview = fillBody(form.body, SAMPLE);

    /* ═══════════════════════════════════════════════════════════ */
    return (
        <div className="ctp">
            {/* ── top bar ────────────────────────────────────────── */}
            <div className="ctp__topbar">
                <div>
                    <h2 className="ctp__title">Contract Templates</h2>
                    <p className="ctp__sub">Design reusable contract templates with placeholders that auto-fill for each employee.</p>
                </div>
                {canEdit && (
                    <button className="ctp__btn ctp__btn--primary" onClick={openNew}>
                        + New Template
                    </button>
                )}
            </div>

            {msg && (
                <div className={`ctp__msg ${msg.isError ? 'ctp__msg--error' : 'ctp__msg--ok'}`}>
                    {msg.text}
                </div>
            )}

            {/* ── template cards list ─────────────────────────────── */}
            {loading ? (
                <div className="ctp__loading">Loading templates…</div>
            ) : (
                <div className="ctp__cards">
                    {templates.length === 0 && (
                        <div className="ctp__empty">
                            No templates yet. Create your first one!
                        </div>
                    )}
                    {templates.map((t) => (
                        <div key={t.template_id} className={`ctp__card ${t.is_default ? 'ctp__card--default' : ''}`}>
                            <div className="ctp__card-head">
                                <div>
                                    <span className="ctp__card-name">{t.name}</span>
                                    {t.is_default && <span className="ctp__badge">Default</span>}
                                    <span className="ctp__type-tag">{t.contract_type}</span>
                                </div>
                                <div className="ctp__card-actions">
                                    <button className="ctp__btn ctp__btn--ghost" onClick={() => handleDownloadBlankPDF(t)}
                                        title="Preview filled with sample data">
                                        👁 Preview
                                    </button>
                                    {canEdit && (
                                        <>
                                            <button className="ctp__btn ctp__btn--edit" onClick={() => openEdit(t)}>✏️ Edit</button>
                                            {!t.is_default && (
                                                <button className="ctp__btn ctp__btn--danger" onClick={() => setDelConfirm(t)}>🗑️</button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                            {t.description && <p className="ctp__card-desc">{t.description}</p>}
                            <div className="ctp__card-meta">
                                Created by {t.created_by_name || 'System'} ·{' '}
                                {new Date(t.created_at).toLocaleDateString('en-GB')}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ══ Editor Modal ═══════════════════════════════════════ */}
            {editing && (
                <div className="ctp__overlay" onClick={() => !saving && setEditing(null)}>
                    <div className="ctp__editor" onClick={(e) => e.stopPropagation()}>
                        {/* editor header */}
                        <div className="ctp__editor-head">
                            <h3>{editing === 'new' ? 'New Template' : `Edit: ${editing.name}`}</h3>
                            <div className="ctp__editor-head-actions">
                                <button
                                    className={`ctp__btn ${preview ? 'ctp__btn--primary' : 'ctp__btn--ghost'}`}
                                    onClick={() => setPreview((p) => !p)}
                                >
                                    {preview ? '◀ Editor' : '👁 Live Preview'}
                                </button>
                                <button className="ctp__btn ctp__btn--icon" onClick={() => setEditing(null)}>✕</button>
                            </div>
                        </div>

                        <div className="ctp__editor-body">
                            {/* left: form */}
                            <div className="ctp__editor-left">
                                <label>Template Name *
                                    <input
                                        value={form.name}
                                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                        placeholder="e.g. Standard Employment Contract"
                                    />
                                </label>

                                <label>Description
                                    <input
                                        value={form.description}
                                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                        placeholder="Optional short description"
                                    />
                                </label>

                                <div className="ctp__row">
                                    <label>Contract Type
                                        <select value={form.contractType} onChange={(e) => setForm((f) => ({ ...f, contractType: e.target.value }))}>
                                            <option value="fixed-term">Fixed-Term</option>
                                            <option value="permanent">Permanent</option>
                                            <option value="part-time">Part-Time</option>
                                            <option value="contract">Contract / Freelance</option>
                                            <option value="internship">Internship</option>
                                        </select>
                                    </label>
                                    <label className="ctp__checkbox">
                                        <input type="checkbox" checked={form.isDefault}
                                            onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))} />
                                        Set as default
                                    </label>
                                </div>

                                {/* Placeholder toolbar */}
                                <div className="ctp__ph-section">
                                    <p className="ctp__ph-label">📌 Click to insert placeholder at cursor position:</p>
                                    <div className="ctp__ph-chips">
                                        {PLACEHOLDER_LIST.map((p) => (
                                            <button key={p.key} className="ctp__chip" onClick={() => insertPlaceholder(p.key)}
                                                title={`Insert ${p.key}`}>
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Template body */}
                                <label className="ctp__body-label">Contract Body *
                                    <textarea
                                        ref={textareaRef}
                                        className="ctp__textarea"
                                        value={form.body}
                                        onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                                        placeholder="Write your contract template here. Use the placeholder buttons above to insert dynamic fields."
                                        spellCheck="false"
                                    />
                                </label>

                                <div className="ctp__editor-footer">
                                    <button className="ctp__btn ctp__btn--ghost" onClick={() => setEditing(null)} disabled={saving}>
                                        Cancel
                                    </button>
                                    <button className="ctp__btn ctp__btn--primary" onClick={handleSave} disabled={saving}>
                                        {saving ? 'Saving…' : '💾 Save Template'}
                                    </button>
                                </div>
                            </div>

                            {/* right: live preview */}
                            {preview && (
                                <div className="ctp__preview">
                                    <p className="ctp__preview-label">Live Preview (sample data)</p>
                                    <pre className="ctp__preview-body">{livePreview || '← Start typing to see preview…'}</pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete confirm ─────────────────────────────────── */}
            {delConfirm && (
                <div className="ctp__overlay" onClick={() => setDelConfirm(null)}>
                    <div className="ctp__confirm" onClick={(e) => e.stopPropagation()}>
                        <h3>⚠️ Delete Template?</h3>
                        <p>Are you sure you want to delete <strong>{delConfirm.name}</strong>?</p>
                        <p className="ctp__confirm-warn">This cannot be undone. Existing contracts using this template will keep their data.</p>
                        <div className="ctp__confirm-actions">
                            <button className="ctp__btn ctp__btn--ghost" onClick={() => setDelConfirm(null)}>Cancel</button>
                            <button className="ctp__btn ctp__btn--danger" onClick={() => handleDelete(delConfirm)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractTemplatesPage;
