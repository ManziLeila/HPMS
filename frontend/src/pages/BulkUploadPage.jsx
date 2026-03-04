import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FileSpreadsheet, Download, Settings, Upload, FolderOpen, Rocket, Package, Mail, CheckCircle, XCircle, Loader2, BarChart3 } from 'lucide-react';
import './BulkUploadPage.css';
import { apiClient, API_BASE_URL } from '../api/client';
import useAuth from '../hooks/useAuth.js';

const getDefaultPayPeriod = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
};

const BulkUploadPage = () => {
    const { clientId } = useParams();
    const { token } = useAuth();
    const [clientName, setClientName] = useState(null);
    const [file, setFile] = useState(null);
    const [payPeriod, setPayPeriod] = useState(getDefaultPayPeriod);
    const [frequency, setFrequency] = useState('monthly');
    const [includeMedical, setIncludeMedical] = useState(true);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [uploadResults, setUploadResults] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [salaryIds, setSalaryIds] = useState([]);

    useEffect(() => {
        if (clientId && token) {
            apiClient.get(`/clients/${clientId}`, { token })
                .then((r) => setClientName(r?.name ?? 'Client'))
                .catch(() => setClientName(null));
        } else {
            setClientName(null);
        }
    }, [clientId, token]);

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            // Validate file type
            const validTypes = [
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ];
            if (validTypes.includes(selectedFile.type)) {
                setFile(selectedFile);
                setUploadStatus(null);
            } else {
                setUploadStatus('Error: Please select a valid Excel file (.xls or .xlsx)');
                setFile(null);
            }
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setUploadStatus('Error: Please select a file to upload');
            return;
        }
        if (!payPeriod) {
            setUploadStatus('Error: Please select a pay period');
            return;
        }
        if (!token) {
            setUploadStatus('Error: Please sign in to upload salaries');
            return;
        }

        setIsUploading(true);
        setUploadStatus('Uploading and processing file...');
        setUploadResults(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('payPeriod', payPeriod + '-01');
            formData.append('frequency', frequency);
            formData.append('includeMedical', String(includeMedical));
            if (clientId) {
                formData.append('clientId', String(clientId));
            }

            const uploadUrl = clientId
                ? `${API_BASE_URL}/salaries/bulk/upload?clientId=${encodeURIComponent(clientId)}`
                : `${API_BASE_URL}/salaries/bulk/upload`;
            const response = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Upload failed');
            }

            const data = await response.json();
            setUploadResults(data.results);
            setSalaryIds(data.results.successful.map((s) => s.salaryId));
            setUploadStatus(`Success: ${data.message}`);
        } catch (error) {
            setUploadStatus(`Error: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDownloadPayslips = async () => {
        if (!token || salaryIds.length === 0) return;

        try {
            setUploadStatus('Generating payslips ZIP file...');
            const response = await fetch(`${API_BASE_URL}/salaries/bulk/download-payslips`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ salaryIds }),
            });

            if (!response.ok) {
                throw new Error('Failed to download payslips');
            }

            const blob = await response.blob();
            if (blob.size === 0) throw new Error('Downloaded file is empty');
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `payslips-${payPeriod}.zip`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(link.href);
            setUploadStatus('Success: Payslips downloaded successfully!');
        } catch (error) {
            setUploadStatus(`Error downloading payslips: ${error.message}`);
        }
    };

    const handleSendEmails = async () => {
        if (!token || salaryIds.length === 0) return;

        try {
            setUploadStatus('Sending emails to all employees...');
            const response = await apiClient.post(
                '/salaries/bulk/send-emails',
                { salaryIds },
                { token }
            );

            setUploadStatus(`Success: ${response.message}`);
        } catch (error) {
            setUploadStatus(`Error: ${error.message}`);
        }
    };

    const downloadTemplate = () => {
        // Create a sample Excel template with Include RAMA and RSSB Number columns
        const csvContent = `Full Name,Email,Basic Salary,Transport Allowance,Housing Allowance,Performance Allowance,Variable Allowance,Advance Amount,Include RAMA,RSSB Number
John Doe,john.doe@example.com,1000000,50000,100000,50000,0,0,Yes,20655126
Jane Smith,jane.smith@example.com,1200000,60000,120000,60000,0,0,No,`;

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'salary-upload-template.csv';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(link.href);
    };

    return (
        <div className="bulk-upload-page">
            <section className="bulk-upload-page__header">
                <div>
                    {clientId && (
                        <p className="bulk-upload-page__client-banner" style={{ background: '#d1fae5', color: '#065f46', padding: '8px 14px', borderRadius: 8, marginBottom: 12, display: 'inline-block', fontWeight: 600 }}>
                            Employees will be assigned to: <strong>{clientName || 'Loading…'}</strong>
                        </p>
                    )}
                    <p className="bulk-upload-page__eyebrow">Bulk Operations</p>
                    <h2>Upload Multiple Salaries</h2>
                    <p className="bulk-upload-page__description">
                        Upload an Excel file with employee salary data to process multiple salaries at once.
                        Download payslips as a ZIP file and send automated emails to all employees.
                    </p>
                </div>
            </section>

            <section className="bulk-upload-page__form">
                <div className="bulk-upload-page__card">
                    <header>
                        <h3><FileSpreadsheet size={20} aria-hidden /> Step 1: Prepare Your Excel File</h3>
                    </header>
                    <div className="bulk-upload-page__content">
                        <p>
                            Your Excel file should contain the following columns:
                        </p>
                        <ul className="bulk-upload-page__columns-list">
                            <li><strong>Full Name</strong> (required)</li>
                            <li><strong>Email</strong> (required)</li>
                            <li><strong>Basic Salary</strong> (required)</li>
                            <li>Transport Allowance (optional)</li>
                            <li>Housing Allowance (optional)</li>
                            <li>Performance Allowance (optional)</li>
                            <li>Variable Allowance (optional)</li>
                            <li>Advance Amount (optional)</li>
                            <li><strong>Include RAMA</strong> (optional: Yes/No - overrides global setting)</li>
                            <li><strong>RSSB Number</strong> (optional: employee's RSSB social security number)</li>
                        </ul>
                        <button
                            type="button"
                            onClick={downloadTemplate}
                            className="bulk-upload-page__template-btn"
                        >
                            <Download size={18} aria-hidden /> Download Template
                        </button>
                    </div>
                </div>

                <div className="bulk-upload-page__card">
                    <header>
                        <h3><Settings size={20} aria-hidden /> Step 2: Configure Upload Settings</h3>
                    </header>
                    <div className="bulk-upload-page__content">
                        <div className="bulk-upload-page__fields">
                            <label>
                                Pay Period
                                <input
                                    type="month"
                                    value={payPeriod}
                                    onChange={(e) => setPayPeriod(e.target.value)}
                                    required
                                />
                            </label>

                            <label>
                                Pay Frequency
                                <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                                    <option value="monthly">Monthly</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="daily">Daily (Wages)</option>
                                </select>
                            </label>

                            <label className="bulk-upload-page__checkbox">
                                <input
                                    type="checkbox"
                                    checked={includeMedical}
                                    onChange={(e) => setIncludeMedical(e.target.checked)}
                                />
                                <span>Include RAMA Insurance (7.5%)</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="bulk-upload-page__card">
                    <header>
                        <h3><Upload size={20} aria-hidden /> Step 3: Upload Excel File</h3>
                    </header>
                    <div className="bulk-upload-page__content">
                        <div className="bulk-upload-page__file-input">
                            <input
                                type="file"
                                accept=".xls,.xlsx"
                                onChange={handleFileChange}
                                id="file-upload"
                            />
                            <label htmlFor="file-upload" className="bulk-upload-page__file-label">
                                {file ? <><FileSpreadsheet size={16} aria-hidden /> {file.name}</> : <><FolderOpen size={16} aria-hidden /> Choose Excel File</>}
                            </label>
                        </div>

                        <button
                            type="button"
                            onClick={handleUpload}
                            disabled={isUploading || !file || !payPeriod}
                            className="bulk-upload-page__upload-btn"
                        >
                            {isUploading ? <><Loader2 size={18} className="spin" aria-hidden /> Processing...</> : <><Rocket size={18} aria-hidden /> Upload & Process</>}
                        </button>

                        {uploadStatus && (
                            <p className={`bulk-upload-page__status ${uploadStatus?.startsWith('Success') ? 'success' : uploadStatus?.startsWith('Error') ? 'error' : 'info'}`}>
                                {uploadStatus}
                            </p>
                        )}
                    </div>
                </div>
            </section>

            {uploadResults && (
                <section className="bulk-upload-page__results">
                    <header>
                        <h3><BarChart3 size={20} aria-hidden /> Upload Results</h3>
                    </header>

                    <div className="bulk-upload-page__stats">
                        <div className="bulk-upload-page__stat">
                            <p className="bulk-upload-page__stat-label">Total Records</p>
                            <p className="bulk-upload-page__stat-value">{uploadResults.total}</p>
                        </div>
                        <div className="bulk-upload-page__stat success">
                            <p className="bulk-upload-page__stat-label">Successful</p>
                            <p className="bulk-upload-page__stat-value">{uploadResults.successful.length}</p>
                        </div>
                        <div className="bulk-upload-page__stat error">
                            <p className="bulk-upload-page__stat-label">Failed</p>
                            <p className="bulk-upload-page__stat-value">{uploadResults.failed.length}</p>
                        </div>
                    </div>

                    {uploadResults.successful.length > 0 && (
                        <div className="bulk-upload-page__actions">
                            <button
                                type="button"
                                onClick={handleDownloadPayslips}
                                className="bulk-upload-page__action-btn download"
                            >
                                <Package size={18} aria-hidden /> Download All Payslips (ZIP)
                            </button>
                            <button
                                type="button"
                                onClick={handleSendEmails}
                                className="bulk-upload-page__action-btn email"
                            >
                                <Mail size={18} aria-hidden /> Send Emails to All Employees
                            </button>
                        </div>
                    )}

                    {uploadResults.successful.length > 0 && (
                        <div className="bulk-upload-page__table-section">
                            <h4><CheckCircle size={18} aria-hidden /> Successfully Processed</h4>
                            <div className="bulk-upload-page__table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Row</th>
                                            <th>Employee Name</th>
                                            <th>Email</th>
                                            <th>Net Salary</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {uploadResults.successful.map((item) => (
                                            <tr key={item.salaryId}>
                                                <td>{item.row}</td>
                                                <td>{item.fullName}</td>
                                                <td>{item.email}</td>
                                                <td>{new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(item.netSalary)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {uploadResults.failed.length > 0 && (
                        <div className="bulk-upload-page__table-section">
                            <h4><XCircle size={18} aria-hidden /> Failed Records</h4>
                            <div className="bulk-upload-page__table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Row</th>
                                            <th>Employee Name</th>
                                            <th>Email</th>
                                            <th>Error</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {uploadResults.failed.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.row}</td>
                                                <td>{item.fullName}</td>
                                                <td>{item.email}</td>
                                                <td className="error-message">{item.error}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
};

export default BulkUploadPage;
