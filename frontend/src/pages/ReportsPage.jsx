import { useCallback, useEffect, useMemo, useState } from 'react';
import './ReportsPage.css';
import { apiClient, API_BASE_URL } from '../api/client';
import useAuth from '../hooks/useAuth.js';
import { formatCurrency } from '../utils/payroll';

const current = new Date();

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
    <span className="reports-page__badge" style={{
      background: m.color + '22',
      color: m.color,
      borderColor: m.color + '55',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '0.7rem',
      fontWeight: '700',
      border: '1px solid',
      textTransform: 'uppercase'
    }}>
      {m.label}
    </span>
  );
};

const ReportsPage = () => {
  const { token, user } = useAuth();
  const [filters, setFilters] = useState({
    year: current.getFullYear(),
    month: current.getMonth() + 1,
    frequency: 'all',
  });
  const [monthlyReport, setMonthlyReport] = useState([]);
  const [recentSalaries, setRecentSalaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);         // load errors — cleared on each reload
  const [actionMsg, setActionMsg] = useState(null); // feedback for save/delete/download
  const [editingSalary, setEditingSalary] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const { year, month } = filters;

  const loadMonthlyReport = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null); // ← always wipe stale error when a new fetch starts
    try {
      const query = new URLSearchParams({ year, month, frequency: filters.frequency }).toString();
      const response = await apiClient.get(`/salaries/reports/monthly?${query}`, { token });
      setMonthlyReport(response.data || []);
    } catch (err) {
      setMonthlyReport([]);
      setError(err.message || 'Failed to load monthly report');
    } finally {
      setLoading(false);
    }
  }, [token, year, month, filters.frequency]);

  const loadRecentSalaries = useCallback(async () => {
    if (!token) return;
    try {
      const response = await apiClient.get('/salaries/recent?limit=8', { token });
      setRecentSalaries(response.data || []);
    } catch (err) {
      setRecentSalaries([]);
      // don't overwrite the main error — recent salaries is secondary
    }
  }, [token]);

  useEffect(() => {
    loadMonthlyReport();
  }, [loadMonthlyReport]);

  useEffect(() => {
    loadRecentSalaries();
  }, [loadRecentSalaries]);

  const totals = useMemo(() => {
    if (!monthlyReport.length) {
      return {
        gross: 0,
        paye: 0,
        deductions: 0,
        employer: 0,
        takeHome: 0,
      };
    }
    return monthlyReport.reduce(
      (acc, row) => ({
        gross: acc.gross + Number(row.gross_salary || 0),
        paye: acc.paye + Number(row.paye || 0),
        deductions:
          acc.deductions +
          (Number(row.gross_salary || 0) - Number(row.net_salary || 0)),
        employer: acc.employer + Number(row.total_employer_contrib || 0),
        takeHome: acc.takeHome + Number(row.net_salary || 0),
      }),
      { gross: 0, paye: 0, deductions: 0, employer: 0, takeHome: 0 },
    );
  }, [monthlyReport]);

  const handleDownloadPayslip = async (salary) => {
    if (!token) return;
    try {
      setActionMsg(`Preparing payslip for ${salary.full_name}...`);
      const response = await fetch(`${API_BASE_URL}/salaries/${salary.salary_id}/payslip`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to download payslip');
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `payslip-${salary.full_name.replace(/\s+/g, '-').toLowerCase()}-${salary.pay_period}.pdf`;
      if (contentDisposition) {
        const m = contentDisposition.match(/filename="?([^"]+)"?/);
        if (m?.[1]) filename = m[1];
      }
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
      setActionMsg(`✅ Payslip ready for ${salary.full_name}`);
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err) {
      setActionMsg(`❌ ${err.message || 'Unable to download payslip'}`);
    }
  };

  const handleExportToExcel = async () => {
    if (!token) return;
    try {
      setActionMsg('Generating Excel report…');
      const response = await fetch(`${API_BASE_URL}/salaries/reports/monthly/export?year=${year}&month=${month}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Unable to export report');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `monthly-report-${year}-${month}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setActionMsg('✅ Excel report downloaded');
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err) {
      setActionMsg(`❌ ${err.message || 'Unable to export report'}`);
      setTimeout(() => setActionMsg(null), 4000);
    }
  };

  const handleSendEmail = async (salary) => {
    if (!token) return;
    if (!window.confirm(`Send payslip email to ${salary.full_name}?`)) return;

    setEmailLoading(true);
    setActionMsg(`Sending email to ${salary.email}...`);
    try {
      await apiClient.post(`/salaries/${salary.salary_id}/send-email`, {}, { token });
      setActionMsg(`✅ Email sent successfully to ${salary.email}`);
      setTimeout(() => setActionMsg(null), 5000);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setActionMsg(`❌ Failed: ${msg}`);
      setTimeout(() => setActionMsg(null), 8000);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleEditSalary = (salary) => {
    setEditingSalary({
      salary_id: salary.salary_id,
      employee_name: salary.full_name,
      pay_period: salary.pay_period,
      baseSalary: 0,
      transportAllowance: 0,
      housingAllowance: 0,
      variableAllowance: 0,
      performanceAllowance: 0,
      advanceAmount: 0,
      frequency: salary.pay_frequency || 'monthly',
    });
  };

  const handleSaveEdit = async () => {
    if (!token || !editingSalary) return;
    try {
      setEditLoading(true);
      setActionMsg('Updating salary record…');
      await apiClient.put(
        `/salaries/${editingSalary.salary_id}`,
        {
          baseSalary: Number(editingSalary.baseSalary),
          transportAllowance: Number(editingSalary.transportAllowance),
          housingAllowance: Number(editingSalary.housingAllowance),
          variableAllowance: Number(editingSalary.variableAllowance),
          performanceAllowance: Number(editingSalary.performanceAllowance),
          advanceAmount: Number(editingSalary.advanceAmount),
          frequency: editingSalary.frequency,
        },
        { token }
      );
      setActionMsg('✅ Salary record updated!');
      setTimeout(() => setActionMsg(null), 4000);
      setEditingSalary(null);
      loadMonthlyReport();
      loadRecentSalaries();
    } catch (err) {
      setActionMsg('❌ Failed to update: ' + (err.message || 'Unknown error'));
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteSalary = async (salaryId) => {
    if (!token) return;
    try {
      setActionMsg('Deleting salary record…');
      await apiClient.delete(`/salaries/${salaryId}`, { token });
      setActionMsg('✅ Record deleted!');
      setTimeout(() => setActionMsg(null), 3000);
      setDeleteConfirm(null);
      loadMonthlyReport();
      loadRecentSalaries();
    } catch (err) {
      setActionMsg('❌ Failed to delete: ' + (err.message || 'Unknown error'));
    }
  };

  const handleResetPeriod = async () => {
    if (!token) return;
    try {
      setActionMsg('Resetting period…');
      const query = new URLSearchParams({ year, month, frequency: filters.frequency }).toString();
      const response = await apiClient.delete(`/salaries/reports/monthly/reset?${query}`, { token });
      setActionMsg(`✅ ${response.message || `Deleted ${response.deletedCount} record(s)`}`);
      setTimeout(() => setActionMsg(null), 4000);
      setResetConfirm(false);
      loadMonthlyReport();
      loadRecentSalaries();
    } catch (err) {
      setActionMsg('❌ Failed to reset: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <div className="reports-page">
      {/* HR workflow context banner — shown only to HR role */}
      {user?.role === 'HR' && (
        <div style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '12px',
          fontSize: '0.85rem',
          color: '#1d4ed8',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
        }}>
          <span style={{ fontSize: '1.1rem', marginTop: '1px' }}>ℹ️</span>
          <div>
            <strong>HR Workflow:</strong> This page shows individual salary records computed by the Finance Officer — for reference only.
            {' '}Your action is in <strong>Review Queue</strong>: once the Finance Officer groups salaries into a payroll batch and submits it, it will appear there for your verification.
          </div>
        </div>
      )}
      <section className="reports-page__filters">
        <div>
          <p className="reports-page__eyebrow">Reporting Window</p>
          <h3>
            {filters.year} / {filters.month.toString().padStart(2, '0')}
          </h3>
        </div>
        <div className="reports-page__filter-controls">
          <label>
            Year
            <input
              type="number"
              min="2020"
              name="year"
              value={filters.year}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, year: Number(event.target.value) }))
              }
            />
          </label>
          <label>
            Month
            <select
              name="month"
              value={filters.month}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, month: Number(event.target.value) }))
              }
            >
              {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                <option key={month} value={month}>
                  {month.toString().padStart(2, '0')}
                </option>
              ))}
            </select>
          </label>
          <label>
            Frequency
            <select
              name="frequency"
              value={filters.frequency}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, frequency: event.target.value }))
              }
            >
              <option value="all">All</option>
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="daily">Daily (Wages)</option>
            </select>
          </label>
          <button type="button" onClick={loadMonthlyReport} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            type="button"
            onClick={handleExportToExcel}
            disabled={loading || monthlyReport.length === 0}
            style={{ backgroundColor: '#10b981', marginLeft: '8px' }}
          >
            Export to Excel
          </button>
          <button
            type="button"
            onClick={() => setResetConfirm(true)}
            disabled={loading || monthlyReport.length === 0}
            style={{ backgroundColor: '#dc2626', marginLeft: '8px' }}
            title="Delete all salary records for this period"
          >
            🗑️ Reset Period
          </button>
        </div>
      </section>
      {/* Action feedback toast — shown top of monthly section */}
      {actionMsg && (
        <div
          style={{
            padding: '10px 16px', borderRadius: '8px', marginBottom: '16px',
            background: actionMsg.startsWith('❌') ? '#fef2f2' : actionMsg.startsWith('✅') ? '#f0fdf4' : '#eff6ff',
            border: `1px solid ${actionMsg.startsWith('❌') ? '#fca5a5' : actionMsg.startsWith('✅') ? '#86efac' : '#bfdbfe'}`,
            color: actionMsg.startsWith('❌') ? '#991b1b' : actionMsg.startsWith('✅') ? '#166534' : '#1d4ed8',
            fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer',
          }}
          onClick={() => setActionMsg(null)}
        >
          {actionMsg}
        </div>
      )}
      <section className="reports-page__kpis">
        <article>
          <p>Total Gross</p>
          <h4>{formatCurrency(totals.gross)}</h4>
        </article>
        <article>
          <p>Total PAYE</p>
          <h4>{formatCurrency(totals.paye)}</h4>
        </article>
        <article>
          <p>Employee Deductions</p>
          <h4>{formatCurrency(totals.deductions)}</h4>
        </article>
        <article>
          <p>Employer Contributions</p>
          <h4>{formatCurrency(totals.employer)}</h4>
        </article>
        <article>
          <p>Take Home Salary</p>
          <h4>{formatCurrency(totals.takeHome)}</h4>
        </article>
      </section>
      <section className="reports-page__monthly">
        <header>
          <div>
            <p className="reports-page__eyebrow">Monthly Report</p>
            <h3>Employee Payroll Details</h3>
          </div>
          {error && (
            <p className="reports-page__status" style={{ color: '#dc2626' }}>⚠️ {error}</p>
          )}
          {actionMsg && (
            <p className="reports-page__status">{actionMsg}</p>
          )}
        </header>
        <div className="reports-page__table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Pay Period</th>
                <th>Frequency</th>
                <th>Gross</th>
                <th>PAYE</th>
                <th>Take Home</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {monthlyReport.length === 0 && (
                <tr>
                  <td colSpan="8">
                    No payroll records found for this period.
                    <br />
                    <small style={{ color: '#666', marginTop: '8px', display: 'block' }}>
                      Try changing the month/year filters above or create a new salary record.
                    </small>
                  </td>
                </tr>
              )}
              {monthlyReport.map((row) => (
                <tr key={row.salary_id}>
                  <td>
                    <p className="reports-page__employee-name">{row.full_name}</p>
                    <span>{row.email}</span>
                  </td>
                  <td>{row.pay_period}</td>
                  <td>{row.pay_frequency}</td>
                  <td>{formatCurrency(row.gross_salary)}</td>
                  <td>{formatCurrency(row.paye)}</td>
                  <td>{row.net_salary != null ? formatCurrency(row.net_salary) : <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Encrypted</span>}</td>
                  <td><Badge status={row.hr_status || 'PENDING'} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      {row.hr_status === 'HR_APPROVED' && (
                        <button
                          type="button"
                          disabled={emailLoading}
                          onClick={() => handleSendEmail(row)}
                          className="reports-page__action-btn"
                          style={{ backgroundColor: '#10b981', color: 'white', border: 'none' }}
                          title="Send payslip email"
                        >
                          ✉️ Email
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(row)}
                        className="reports-page__action-btn reports-page__delete-btn"
                        title="Delete salary record"
                      >
                        🗑️ Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadPayslip(row)}
                        className="reports-page__download"
                        title="Download payslip PDF"
                      >
                        📄 Download
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="reports-page__recent">
        <header>
          <div>
            <p className="reports-page__eyebrow">Recent Payroll Runs</p>
            <h3>Download Payslips</h3>
          </div>
          {actionMsg && <p className="reports-page__status">{actionMsg}</p>}
        </header>
        <div className="reports-page__table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Pay Period</th>
                <th>Frequency</th>
                <th>Gross</th>
                <th>PAYE</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {recentSalaries.length === 0 && (
                <tr>
                  <td colSpan="6">No payroll runs recorded yet.</td>
                </tr>
              )}
              {recentSalaries.map((salary) => (
                <tr key={salary.salary_id}>
                  <td>
                    <p className="reports-page__employee-name">{salary.full_name}</p>
                    <span>{salary.email}</span>
                  </td>
                  <td>{salary.pay_period}</td>
                  <td>{salary.pay_frequency}</td>
                  <td>{formatCurrency(salary.gross_salary)}</td>
                  <td>{formatCurrency(salary.paye)}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleDownloadPayslip(salary)}
                      className="reports-page__download"
                      style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Edit Salary Modal */}
      {editingSalary && (
        <div className="modal-overlay" onClick={() => !editLoading && setEditingSalary(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Salary Record</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Employee: <strong>{editingSalary.employee_name}</strong> | Pay Period: <strong>{editingSalary.pay_period}</strong>
            </p>

            <div className="form-grid">
              <div className="form-group">
                <label>Basic Salary (RWF)</label>
                <input
                  type="number"
                  value={editingSalary.baseSalary}
                  onChange={(e) => setEditingSalary({ ...editingSalary, baseSalary: e.target.value })}
                  placeholder="e.g., 1000000"
                  disabled={editLoading}
                />
              </div>

              <div className="form-group">
                <label>Transport Allowance (RWF)</label>
                <input
                  type="number"
                  value={editingSalary.transportAllowance}
                  onChange={(e) => setEditingSalary({ ...editingSalary, transportAllowance: e.target.value })}
                  placeholder="e.g., 50000"
                  disabled={editLoading}
                />
              </div>

              <div className="form-group">
                <label>Housing Allowance (RWF)</label>
                <input
                  type="number"
                  value={editingSalary.housingAllowance}
                  onChange={(e) => setEditingSalary({ ...editingSalary, housingAllowance: e.target.value })}
                  placeholder="e.g., 100000"
                  disabled={editLoading}
                />
              </div>

              <div className="form-group">
                <label>Performance Allowance (RWF)</label>
                <input
                  type="number"
                  value={editingSalary.performanceAllowance}
                  onChange={(e) => setEditingSalary({ ...editingSalary, performanceAllowance: e.target.value })}
                  placeholder="e.g., 50000"
                  disabled={editLoading}
                />
              </div>

              <div className="form-group">
                <label>Variable Allowance (RWF)</label>
                <input
                  type="number"
                  value={editingSalary.variableAllowance}
                  onChange={(e) => setEditingSalary({ ...editingSalary, variableAllowance: e.target.value })}
                  placeholder="e.g., 0"
                  disabled={editLoading}
                />
              </div>

              <div className="form-group">
                <label>Advance Amount (RWF)</label>
                <input
                  type="number"
                  value={editingSalary.advanceAmount}
                  onChange={(e) => setEditingSalary({ ...editingSalary, advanceAmount: e.target.value })}
                  placeholder="e.g., 0"
                  disabled={editLoading}
                />
              </div>

              <div className="form-group">
                <label>Pay Frequency</label>
                <select
                  value={editingSalary.frequency}
                  onChange={(e) => setEditingSalary({ ...editingSalary, frequency: e.target.value })}
                  disabled={editLoading}
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="daily">Daily (Wages)</option>
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setEditingSalary(null)}
                disabled={editLoading}
              >
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={handleSaveEdit}
                disabled={editLoading}
              >
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content modal-confirm" onClick={(e) => e.stopPropagation()}>
            <h2>⚠️ Confirm Delete</h2>
            <p>
              Are you sure you want to delete the salary record for <strong>{deleteConfirm.full_name}</strong>?
            </p>
            <p style={{ color: '#666', fontSize: '14px', marginTop: '8px' }}>
              Pay Period: <strong>{deleteConfirm.pay_period}</strong>
            </p>
            <p className="warning-text" style={{ color: '#dc2626', marginTop: '12px', fontSize: '14px' }}>
              ⚠️ This action cannot be undone. The payslip and all associated data will be permanently deleted.
            </p>

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="btn-delete-confirm"
                onClick={() => handleDeleteSalary(deleteConfirm.salary_id)}
                style={{ backgroundColor: '#dc2626' }}
              >
                Delete Salary Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Period Confirmation Modal */}
      {resetConfirm && (
        <div className="modal-overlay" onClick={() => setResetConfirm(false)}>
          <div className="modal-content modal-confirm" onClick={(e) => e.stopPropagation()}>
            <h2>⚠️ Confirm Reset Period</h2>
            <p>
              Are you sure you want to delete <strong>ALL</strong> salary records for:
            </p>
            <p style={{ color: '#666', fontSize: '14px', marginTop: '8px' }}>
              <strong>Year:</strong> {filters.year} | <strong>Month:</strong> {String(filters.month).padStart(2, '0')} | <strong>Frequency:</strong> {filters.frequency}
            </p>
            <p style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
              <strong>Records to delete:</strong> {monthlyReport.length}
            </p>
            <p className="warning-text" style={{ color: '#dc2626', marginTop: '12px', fontSize: '14px' }}>
              ⚠️ This action cannot be undone. All {monthlyReport.length} salary record(s) and their payslips will be permanently deleted.
            </p>

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setResetConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn-delete-confirm"
                onClick={handleResetPeriod}
                style={{ backgroundColor: '#dc2626' }}
              >
                Delete All {monthlyReport.length} Record(s)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;


