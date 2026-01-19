import { useMemo, useState } from 'react';
import { calculatePayroll, formatCurrency } from '../utils/payroll';
import './EmployeeFormPage.css';
import { apiClient } from '../api/client';
import useAuth from '../hooks/useAuth.js';
import EmailPreviewModal from '../components/EmailPreviewModal';

const initialFormState = {
  fullName: '',
  email: '',
  phoneNumber: '',
  role: 'Employee',
  bankName: '',
  accountNumber: '',
  accountHolderName: '',
  payPeriod: '',
  frequency: 'monthly',
  baseSalary: '',
  variableAllowance: '',
  transportAllowance: '',
  housingAllowance: '',
  performanceAllowance: '',
  advanceAmount: '',
  includeMedical: true,
};

const EmployeeFormPage = () => {
  const [formValues, setFormValues] = useState(initialFormState);
  const [previewStatus, setPreviewStatus] = useState(null);
  const [createStatus, setCreateStatus] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [emailModalData, setEmailModalData] = useState(null);
  const [createdSalaryId, setCreatedSalaryId] = useState(null);
  const { token } = useAuth();

  const derived = useMemo(() => calculatePayroll({ ...formValues, includeMedical: formValues.includeMedical }), [formValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleBackendPreview = async () => {
    if (!token) {
      setPreviewStatus('Please sign in again to validate with the payroll engine.');
      return;
    }
    try {
      await apiClient.post(
        '/salaries/preview',
        {
          baseSalary: Number(formValues.baseSalary || 0),
          variableAllowance: Number(formValues.variableAllowance || 0),
          transportAllowance: Number(formValues.transportAllowance || 0),
          housingAllowance: Number(formValues.housingAllowance || 0),
          performanceAllowance: Number(formValues.performanceAllowance || 0),
          advanceAmount: Number(formValues.advanceAmount || 0),
          frequency: formValues.frequency,
          includeMedical: formValues.includeMedical,
        },
        { token },
      );
      setPreviewStatus('Snapshot validated. Click "Create Salary" to save.');
    } catch (error) {
      setPreviewStatus(error.message || 'Preview failed');
    }
  };

  const handleCreateSalary = async () => {
    if (!token) {
      setCreateStatus('Please sign in to create salary records.');
      return;
    }

    // Validation
    if (!formValues.fullName || !formValues.email) {
      setCreateStatus('Please enter employee name and email.');
      return;
    }
    if (!formValues.payPeriod) {
      setCreateStatus('Please select a pay period.');
      return;
    }
    if (!formValues.baseSalary || Number(formValues.baseSalary) <= 0) {
      setCreateStatus('Please enter a valid basic salary.');
      return;
    }

    setIsCreating(true);
    setCreateStatus('Creating salary record...');

    try {
      console.log('=== CREATE SALARY DEBUG ===');
      console.log('1. Form values:', formValues);

      // First, create/get employee
      console.log('2. Creating employee...');
      const employeeResponse = await apiClient.post(
        '/employees',
        {
          fullName: formValues.fullName,
          email: formValues.email,
          role: formValues.role || 'Employee',
        },
        { token }
      );
      console.log('3. Employee response:', employeeResponse);

      const employeeId = employeeResponse.employee?.employee_id || employeeResponse.employee_id;

      // Then create salary
      const salaryResponse = await apiClient.post(
        '/salaries',
        {
          employeeId: employeeId,
          payPeriod: formValues.payPeriod + '-01',
          baseSalary: Number(formValues.baseSalary || 0),
          variableAllowance: Number(formValues.variableAllowance || 0),
          transportAllowance: Number(formValues.transportAllowance || 0),
          housingAllowance: Number(formValues.housingAllowance || 0),
          performanceAllowance: Number(formValues.performanceAllowance || 0),
          advanceAmount: Number(formValues.advanceAmount || 0),
          frequency: formValues.frequency,
          includeMedical: formValues.includeMedical,
        },
        { token }
      );

      console.log('4. Salary response:', salaryResponse);

      // Check if email preview data is available
      if (salaryResponse.emailPreview) {
        setEmailModalData(salaryResponse.emailPreview);
        setCreatedSalaryId(salaryResponse.data.salary_id);
        setCreateStatus('✅ Salary created! Review email preview below.');
      } else {
        setCreateStatus(`✅ Salary created successfully! Go to Reports page to download payslip.`);
        // Reset form after 2 seconds if no email preview
        setTimeout(() => {
          setFormValues(initialFormState);
          setCreateStatus(null);
          setPreviewStatus(null);
        }, 3000);
      }
    } catch (error) {
      setCreateStatus(`❌ Error: ${error.message || 'Failed to create salary'}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseEmailModal = () => {
    setEmailModalData(null);
    setCreatedSalaryId(null);
    // Reset form after closing modal
    setTimeout(() => {
      setFormValues(initialFormState);
      setCreateStatus(null);
      setPreviewStatus(null);
    }, 500);
  };

  return (
    <div className="employee-form">
      <section className="employee-form__grid">
        <article className="employee-form__card">
          <header>
            <p className="employee-form__eyebrow">Segment 01</p>
            <h3>Employee Details</h3>
          </header>
          <div className="employee-form__fields">
            <label>
              Full name
              <input
                name="fullName"
                placeholder="e.g. Ineza Marie"
                value={formValues.fullName}
                onChange={handleChange}
              />
            </label>
            <label>
              Work email
              <input
                type="email"
                name="email"
                placeholder="payroll@hcsolutions.com"
                value={formValues.email}
                onChange={handleChange}
              />
            </label>
            <label>
              Role
              <select name="role" value={formValues.role} onChange={handleChange}>
                <option value="Employee">Employee</option>
                <option value="Admin">Admin (Legacy)</option>
                <option value="HR">HR</option>
                <option value="FinanceOfficer">Finance Officer</option>
              </select>
            </label>
            <label>
              Pay period
              <input
                type="month"
                name="payPeriod"
                value={formValues.payPeriod}
                onChange={handleChange}
              />
            </label>
            <label>
              Pay frequency
              <select name="frequency" value={formValues.frequency} onChange={handleChange}>
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="daily">Daily (Wages)</option>
              </select>
            </label>
            <label>
              Phone Number
              <input
                type="tel"
                name="phoneNumber"
                placeholder="+250 XXX XXX XXX"
                value={formValues.phoneNumber}
                onChange={handleChange}
              />
            </label>
            <label className="employee-form__checkbox">
              <input
                type="checkbox"
                name="includeMedical"
                checked={formValues.includeMedical}
                onChange={(e) => setFormValues((prev) => ({ ...prev, includeMedical: e.target.checked }))}
              />
              <span>Include RAMA Insurance (7.5%)</span>
            </label>
          </div>
        </article>
        <article className="employee-form__card">
          <header>
            <p className="employee-form__eyebrow">Segment 02</p>
            <h3>Bank Details</h3>
          </header>
          <div className="employee-form__fields">
            <label>
              Bank Name
              <input
                name="bankName"
                placeholder="e.g. Bank of Kigali"
                value={formValues.bankName}
                onChange={handleChange}
              />
            </label>
            <label>
              Account Number
              <input
                name="accountNumber"
                placeholder="XXXXXXXXXXXX"
                value={formValues.accountNumber}
                onChange={handleChange}
              />
            </label>
            <label>
              Account Holder Name
              <input
                name="accountHolderName"
                placeholder="Full name as per bank account"
                value={formValues.accountHolderName}
                onChange={handleChange}
              />
            </label>
          </div>
        </article>
        <article className="employee-form__card">
          <header>
            <p className="employee-form__eyebrow">Segment 03</p>
            <h3>Compensation Inputs</h3>
          </header>
          <div className="employee-form__fields employee-form__fields--two-col">
            <label>
              Basic Salary (RWF)
              <input
                type="number"
                name="baseSalary"
                min="0"
                step="5000"
                placeholder="0"
                value={formValues.baseSalary}
                onChange={handleChange}
              />
            </label>
            <label>
              Advance Amount (RWF)
              <input
                type="number"
                name="advanceAmount"
                min="0"
                step="1000"
                placeholder="0"
                value={formValues.advanceAmount}
                onChange={handleChange}
              />
            </label>
            <label>
              Variable / incentive allowance
              <input
                type="number"
                name="variableAllowance"
                min="0"
                step="1000"
                placeholder="0"
                value={formValues.variableAllowance}
                onChange={handleChange}
              />
            </label>
            <label>
              Transport allowance
              <input
                type="number"
                name="transportAllowance"
                min="0"
                step="1000"
                placeholder="0"
                value={formValues.transportAllowance}
                onChange={handleChange}
              />
            </label>
            <label>
              Housing allowance
              <input
                type="number"
                name="housingAllowance"
                min="0"
                step="1000"
                placeholder="0"
                value={formValues.housingAllowance}
                onChange={handleChange}
              />
            </label>
            <label>
              Performance allowance
              <input
                type="number"
                name="performanceAllowance"
                min="0"
                step="1000"
                placeholder="0"
                value={formValues.performanceAllowance}
                onChange={handleChange}
              />
            </label>
          </div>
        </article>
      </section>
      <section className="results-panel">
        <div className="results-panel__header">
          <div>
            <p className="employee-form__eyebrow">Segment 04</p>
            <h3>Calculated Results</h3>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button type="button" onClick={handleBackendPreview}>
              Validate Calculations
            </button>
            <button
              type="button"
              onClick={handleCreateSalary}
              disabled={isCreating}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                opacity: isCreating ? 0.6 : 1
              }}
            >
              {isCreating ? 'Creating...' : '💾 Create Salary'}
            </button>
          </div>
        </div>
        {previewStatus && <p className="results-panel__status">{previewStatus}</p>}
        {createStatus && <p className="results-panel__status" style={{
          color: createStatus.includes('✅') ? '#10b981' : createStatus.includes('❌') ? '#ef4444' : '#a5f3fc'
        }}>{createStatus}</p>}
        <div className="results-panel__grid">
          <article>

            <h4>Gross Salary</h4>
            <p className="results-panel__value">{formatCurrency(derived.grossSalary)}</p>
            <p>Basic + allowances</p>
          </article>
          <article>
            <h4>PAYE Tax</h4>
            <p className="results-panel__value">{formatCurrency(derived.paye)}</p>
            <p>Progressive tax (0-30%)</p>
          </article>
          <article>
            <h4>Net Salary</h4>
            <p className="results-panel__value">{formatCurrency(derived.netSalary)}</p>
            <p>After all deductions</p>
          </article>
          <article>
            <h4>Net Paid to Bank</h4>
            <p className="results-panel__value">{formatCurrency(derived.netPaidToBank || derived.netToBePaid)}</p>
            <p>Transfer to employee account</p>
          </article>
          <article>
            <h4>Employee Deductions</h4>
            <ul>
              <li>RSSB Pension (6%): {formatCurrency(derived.rssbEePension)}</li>
              <li>RSSB Maternity (0.3%): {formatCurrency(derived.rssbEeMaternity)}</li>
              {derived.includeMedical && (
                <li>RAMA Insurance (7.5%): {formatCurrency(derived.ramaInsuranceEmployee || derived.medicalInsuranceEmployee)}</li>
              )}
              <li>CBHI (0.5%): {formatCurrency(derived.cbhiEmployee || 0)}</li>
              {derived.advanceAmount > 0 && (
                <li>Advance: {formatCurrency(derived.advanceAmount)}</li>
              )}
            </ul>
          </article>
          <article>
            <h4>Employer Contributions</h4>
            <p className="results-panel__value">
              {formatCurrency(derived.totalEmployerContributions)}
            </p>
            <ul>
              <li>RSSB Pension (6%): {formatCurrency(derived.rssbErPension)}</li>
              <li>RSSB Maternity (0.3%): {formatCurrency(derived.rssbErMaternity)}</li>
              {derived.includeMedical && (
                <li>RAMA Insurance (7.5%): {formatCurrency(derived.ramaInsuranceEmployer || derived.medicalInsuranceEmployer)}</li>
              )}
              <li>Occupational Hazard (2%): {formatCurrency(derived.hazardContribution || 0)}</li>
            </ul>
          </article>
        </div>
      </section >

      {/* Email Preview Modal */}
      <EmailPreviewModal
        isOpen={!!emailModalData}
        onClose={handleCloseEmailModal}
        emailData={emailModalData}
        salaryId={createdSalaryId}
      />
    </div >
  );
};

export default EmployeeFormPage;

