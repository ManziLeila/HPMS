import { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  Plus,
  Pencil,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import { apiClient } from '../api/client';
import useAuth from '../hooks/useAuth';
import './EmailTemplatesPage.css';

const EVENT_LABELS = {
  welcome_email:      { label: 'Welcome Email',                   color: '#003661', desc: 'Sent when a new employee account is created' },
  salary_processed:   { label: 'Salary Processed',                color: '#10b981', desc: 'Sent when a salary record is saved' },
  payslip_sent:       { label: 'Payslip Delivery',                color: '#6366f1', desc: 'Sent with the PDF payslip after MD approval' },
  payroll_submitted:  { label: 'Payroll Submitted for HR',        color: '#f5911f', desc: 'Sent to HR when payroll is submitted for review' },
  hr_approved:        { label: 'HR Approved',                     color: '#6366f1', desc: 'Sent to MD when HR approves payroll' },
  hr_rejected:        { label: 'HR Rejected',                     color: '#ef4444', desc: 'Sent to Finance Officer when HR rejects' },
  md_approved:        { label: 'MD Approved',                     color: '#10b981', desc: 'Sent to Finance Officer when MD approves' },
  md_rejected:        { label: 'MD Rejected',                     color: '#ef4444', desc: 'Sent to HR / FO when MD rejects' },
  fo_notification:    { label: 'Finance Officer Notification',    color: '#003661', desc: 'Sent to Finance Officer after HR review' },
};

const VARIABLE_HINTS = {
  welcome_email:     ['employeeName', 'employeeEmail', 'temporaryPassword', 'role', 'loginUrl'],
  salary_processed:  ['employeeName', 'payPeriod', 'netSalary', 'grossSalary', 'salaryId'],
  payslip_sent:      ['employeeName', 'employeeId', 'payPeriod', 'netSalary', 'payDate', 'companyName', 'hrContact', 'responseDays', 'senderName', 'jobTitle', 'companyEmail', 'companyPhone'],
  payroll_submitted: ['clientName', 'periodLabel', 'salaryCount', 'actorName', 'comments'],
  hr_approved:       ['clientName', 'periodLabel', 'salaryCount', 'actorName', 'comments'],
  hr_rejected:       ['clientName', 'periodLabel', 'salaryCount', 'actorName', 'comments'],
  md_approved:       ['clientName', 'periodLabel', 'salaryCount', 'actorName', 'comments'],
  md_rejected:       ['clientName', 'periodLabel', 'salaryCount', 'actorName', 'comments'],
  fo_notification:   ['foName', 'period', 'status', 'count', 'reviewedBy', 'comment'],
};

const emptyForm = {
  name: '',
  triggerEvent: '',
  subject: '',
  bodyHtml: '',
  description: '',
  isActive: true,
  variables: [],
};

const EDITOR_ROLES = ['HR', 'FinanceOfficer', 'Admin', 'TechAdmin'];

export default function EmailTemplatesPage() {
  const { token, user } = useAuth();
  const canEdit = EDITOR_ROLES.includes(user?.role);

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // Preview
  const [previewId, setPreviewId] = useState(null);

  // Delete confirm
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/email/templates', { token });
      setTemplates(res.templates || []);
    } catch (err) {
      setError(err.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEdit = (tpl) => {
    setEditingId(tpl.id);
    setForm({
      name: tpl.name,
      triggerEvent: tpl.trigger_event,
      subject: tpl.subject,
      bodyHtml: tpl.body_html,
      description: tpl.description || '',
      isActive: tpl.is_active,
      variables: Array.isArray(tpl.variables) ? tpl.variables : [],
    });
    setFormError(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'triggerEvent') {
        updated.variables = VARIABLE_HINTS[value] || [];
      }
      return updated;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.triggerEvent) { setFormError('Please select a trigger event.'); return; }
    try {
      setSaving(true);
      setFormError(null);
      if (editingId) {
        await apiClient.put(`/email/templates/${editingId}`, {
          name: form.name,
          subject: form.subject,
          bodyHtml: form.bodyHtml,
          description: form.description || null,
          isActive: form.isActive,
          variables: form.variables,
        }, { token });
      } else {
        await apiClient.post('/email/templates', {
          name: form.name,
          triggerEvent: form.triggerEvent,
          subject: form.subject,
          bodyHtml: form.bodyHtml,
          description: form.description || null,
          isActive: form.isActive,
          variables: form.variables,
        }, { token });
      }
      await fetchTemplates();
      cancelForm();
    } catch (err) {
      setFormError(err.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await apiClient.delete(`/email/templates/${deleteId}`, { token });
      setDeleteId(null);
      await fetchTemplates();
    } catch (err) {
      setError(err.message || 'Failed to delete template');
    } finally {
      setDeleting(false);
    }
  };

  const togglePreview = (id) => setPreviewId(prev => prev === id ? null : id);

  const eventMeta = (ev) => EVENT_LABELS[ev] || { label: ev, color: '#64748b', desc: '' };

  if (loading) {
    return (
      <div className="etp-page">
        <div className="etp-loading">Loading email templates…</div>
      </div>
    );
  }

  return (
    <div className="etp-page">
      <header className="etp-header">
        <div className="etp-header-left">
          <Mail size={28} aria-hidden />
          <div>
            <h1>Email Templates</h1>
            <p>Manage templates that are automatically sent when workflow events are triggered</p>
          </div>
        </div>
        {canEdit && (
          <button className="etp-btn-primary" onClick={openCreate}>
            <Plus size={16} aria-hidden /> New Template
          </button>
        )}
      </header>

      {error && (
        <div className="etp-alert etp-alert--error">
          <AlertTriangle size={16} aria-hidden /> {error}
        </div>
      )}

      {/* ── Create / Edit Form ─────────────────────────────── */}
      {showForm && canEdit && (
        <div className="etp-form-card">
          <div className="etp-form-card-header">
            <h2>{editingId ? 'Edit Template' : 'Create New Template'}</h2>
            <button className="etp-icon-btn" onClick={cancelForm} aria-label="Close form"><X size={18} /></button>
          </div>

          {formError && (
            <div className="etp-alert etp-alert--error" style={{ margin: '0 0 16px' }}>
              <AlertTriangle size={15} aria-hidden /> {formError}
            </div>
          )}

          <form onSubmit={handleSave} className="etp-form">
            <div className="etp-form-row">
              <div className="etp-form-group">
                <label>Template Name <span className="etp-req">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => handleFormChange('name', e.target.value)}
                  placeholder="e.g. Welcome Email"
                  required
                />
              </div>

              <div className="etp-form-group">
                <label>Trigger Event <span className="etp-req">*</span></label>
                <select
                  value={form.triggerEvent}
                  onChange={e => handleFormChange('triggerEvent', e.target.value)}
                  required
                  disabled={!!editingId}
                >
                  <option value="">— Select event —</option>
                  {Object.entries(EVENT_LABELS).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                {form.triggerEvent && (
                  <p className="etp-help">{eventMeta(form.triggerEvent).desc}</p>
                )}
              </div>
            </div>

            <div className="etp-form-group">
              <label>Email Subject <span className="etp-req">*</span></label>
              <input
                type="text"
                value={form.subject}
                onChange={e => handleFormChange('subject', e.target.value)}
                placeholder="e.g. Your Payslip for {{payPeriod}}"
                required
              />
              <p className="etp-help">Use <code>{'{{variableName}}'}</code> to insert dynamic values.</p>
            </div>

            <div className="etp-form-group">
              <label>Description</label>
              <input
                type="text"
                value={form.description}
                onChange={e => handleFormChange('description', e.target.value)}
                placeholder="Brief description of when this email is sent"
              />
            </div>

            {/* Variable hints */}
            {form.triggerEvent && VARIABLE_HINTS[form.triggerEvent] && (
              <div className="etp-vars-hint">
                <span className="etp-vars-label">Available variables:</span>
                {VARIABLE_HINTS[form.triggerEvent].map(v => (
                  <code key={v} className="etp-var-chip">{'{{' + v + '}}'}</code>
                ))}
              </div>
            )}

            <div className="etp-form-row etp-form-row--fill">
              <div className="etp-form-group etp-form-group--fill">
                <label>HTML Body <span className="etp-req">*</span></label>
                <textarea
                  className="etp-body-editor"
                  value={form.bodyHtml}
                  onChange={e => handleFormChange('bodyHtml', e.target.value)}
                  placeholder="Paste or write your HTML email body here…"
                  rows={18}
                  required
                />
              </div>

              <div className="etp-form-group etp-form-group--fill">
                <label>Live Preview</label>
                <div
                  className="etp-live-preview"
                  dangerouslySetInnerHTML={{ __html: form.bodyHtml }}
                />
              </div>
            </div>

            <div className="etp-form-footer">
              <label className="etp-toggle">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => handleFormChange('isActive', e.target.checked)}
                />
                <span className="etp-toggle-track" />
                <span className="etp-toggle-label">
                  {form.isActive ? 'Active – will be used for auto-sending' : 'Inactive – emails will use fallback template'}
                </span>
              </label>

              <div className="etp-form-actions">
                <button type="button" className="etp-btn-ghost" onClick={cancelForm}>Cancel</button>
                <button type="submit" className="etp-btn-primary" disabled={saving}>
                  <Save size={15} aria-hidden /> {saving ? 'Saving…' : (editingId ? 'Save Changes' : 'Create Template')}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ── Template List ──────────────────────────────────── */}
      <div className="etp-list">
        {templates.length === 0 && (
          <div className="etp-empty">
            <Mail size={40} aria-hidden />
            <p>No email templates found. Click <strong>New Template</strong> to create one.</p>
          </div>
        )}

        {templates.map(tpl => {
          const meta = eventMeta(tpl.trigger_event);
          const isOpen = previewId === tpl.id;
          return (
            <div key={tpl.id} className={`etp-card${isOpen ? ' etp-card--open' : ''}`}>
              <div className="etp-card-main">
                <div className="etp-card-left">
                  <span
                    className="etp-event-badge"
                    style={{ background: meta.color + '18', color: meta.color, borderColor: meta.color + '40' }}
                  >
                    {meta.label}
                  </span>
                  <div className="etp-card-info">
                    <h3>{tpl.name}</h3>
                    <p className="etp-card-subject">Subject: <em>{tpl.subject}</em></p>
                    {tpl.description && <p className="etp-card-desc">{tpl.description}</p>}
                  </div>
                </div>

                <div className="etp-card-right">
                  <span className={`etp-status-dot ${tpl.is_active ? 'active' : 'inactive'}`}>
                    {tpl.is_active
                      ? <><CheckCircle size={14} aria-hidden /> Active</>
                      : <><XCircle size={14} aria-hidden /> Inactive</>}
                  </span>

                  <button
                    className="etp-icon-btn etp-icon-btn--preview"
                    onClick={() => togglePreview(tpl.id)}
                    title="Preview HTML"
                    aria-label="Toggle preview"
                  >
                    <Eye size={16} aria-hidden />
                    {isOpen ? <ChevronUp size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />}
                  </button>

                  {canEdit && (
                    <>
                      <button
                        className="etp-icon-btn etp-icon-btn--edit"
                        onClick={() => openEdit(tpl)}
                        title="Edit template"
                        aria-label="Edit"
                      >
                        <Pencil size={15} aria-hidden />
                      </button>
                      <button
                        className="etp-icon-btn etp-icon-btn--delete"
                        onClick={() => setDeleteId(tpl.id)}
                        title="Delete template"
                        aria-label="Delete"
                      >
                        <Trash2 size={15} aria-hidden />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Variable chips */}
              {Array.isArray(tpl.variables) && tpl.variables.length > 0 && (
                <div className="etp-card-vars">
                  {tpl.variables.map(v => (
                    <code key={v} className="etp-var-chip etp-var-chip--sm">{'{{' + v + '}}'}</code>
                  ))}
                </div>
              )}

              {/* Expandable HTML preview */}
              {isOpen && (
                <div className="etp-preview-wrap">
                  <div
                    className="etp-preview-frame"
                    dangerouslySetInnerHTML={{ __html: tpl.body_html }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Delete Confirmation Modal ──────────────────────── */}
      {deleteId && (
        <div className="etp-modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="etp-modal" onClick={e => e.stopPropagation()}>
            <div className="etp-modal-icon">
              <Trash2 size={28} />
            </div>
            <h3>Delete Template?</h3>
            <p>This action cannot be undone. If this template is deleted, the system will fall back to the built-in template for this event.</p>
            <div className="etp-modal-actions">
              <button className="etp-btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="etp-btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
