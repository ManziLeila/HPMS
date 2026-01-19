import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import useAuth from '../hooks/useAuth';
import './EmailSettingsPage.css';

const EmailSettingsPage = () => {
    const [emailStatus, setEmailStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [testEmail, setTestEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState(null);
    const [preview, setPreview] = useState('');
    const [sampleData, setSampleData] = useState({
        employeeName: 'John Doe',
        employeeId: 'EMP001',
        payPeriod: 'January 2026',
        netSalary: 'RWF 450,000',
        payDate: 'January 17, 2026',
    });
    const { token } = useAuth();

    useEffect(() => {
        fetchEmailStatus();
        fetchPreview();
    }, []);

    useEffect(() => {
        // Update preview when sample data changes
        const timer = setTimeout(() => {
            fetchPreview();
        }, 500);
        return () => clearTimeout(timer);
    }, [sampleData]);

    const fetchEmailStatus = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/email/status', { token });
            setEmailStatus(response);
        } catch (err) {
            console.error('Failed to fetch email status:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPreview = async () => {
        try {
            const response = await apiClient.post('/email/preview', { sampleData }, { token });
            setPreview(response.preview);
        } catch (err) {
            console.error('Failed to fetch preview:', err);
        }
    };

    const handleSendTest = async (e) => {
        e.preventDefault();
        if (!testEmail) {
            setMessage({ type: 'error', text: 'Please enter an email address' });
            return;
        }

        try {
            setSending(true);
            setMessage(null);

            const response = await apiClient.post('/email/test', {
                email: testEmail,
                sampleData,
            }, { token });

            setMessage({
                type: 'success',
                text: `✅ Test email sent successfully to ${testEmail}! Check your inbox.`
            });
        } catch (err) {
            setMessage({
                type: 'error',
                text: `❌ Failed to send email: ${err.message || 'Unknown error'}`
            });
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="email-settings-page">
                <div className="loading">Loading email settings...</div>
            </div>
        );
    }

    return (
        <div className="email-settings-page">
            <header className="page-header">
                <h1>📧 Email Settings</h1>
                <p>Test and preview email templates</p>
            </header>

            {/* SMTP Status */}
            <div className="smtp-status-card">
                <h2>SMTP Configuration</h2>
                <div className="status-grid">
                    <div className="status-item">
                        <span className="label">Status:</span>
                        <span className={`status-badge ${emailStatus?.configured ? 'success' : 'error'}`}>
                            {emailStatus?.configured ? '✅ Connected' : '❌ Not Configured'}
                        </span>
                    </div>
                    {emailStatus?.configured && (
                        <>
                            <div className="status-item">
                                <span className="label">Email:</span>
                                <span className="value">{emailStatus.user}</span>
                            </div>
                            <div className="status-item">
                                <span className="label">Host:</span>
                                <span className="value">{emailStatus.host}:{emailStatus.port}</span>
                            </div>
                            <div className="status-item">
                                <span className="label">From Name:</span>
                                <span className="value">{emailStatus.fromName}</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Template Editor & Preview */}
            <div className="template-section">
                <div className="editor-panel">
                    <h2>Sample Data</h2>
                    <p className="help-text">Edit the values below to see how the email will look</p>

                    <div className="form-group">
                        <label>Employee Name</label>
                        <input
                            type="text"
                            value={sampleData.employeeName}
                            onChange={(e) => setSampleData({ ...sampleData, employeeName: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label>Employee ID</label>
                        <input
                            type="text"
                            value={sampleData.employeeId}
                            onChange={(e) => setSampleData({ ...sampleData, employeeId: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label>Pay Period</label>
                        <input
                            type="text"
                            value={sampleData.payPeriod}
                            onChange={(e) => setSampleData({ ...sampleData, payPeriod: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label>Net Salary</label>
                        <input
                            type="text"
                            value={sampleData.netSalary}
                            onChange={(e) => setSampleData({ ...sampleData, netSalary: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label>Payment Date</label>
                        <input
                            type="text"
                            value={sampleData.payDate}
                            onChange={(e) => setSampleData({ ...sampleData, payDate: e.target.value })}
                        />
                    </div>
                </div>

                <div className="preview-panel">
                    <h2>Email Preview</h2>
                    <div className="preview-container">
                        <div
                            className="email-preview"
                            dangerouslySetInnerHTML={{ __html: preview }}
                        />
                    </div>
                </div>
            </div>

            {/* Test Email Form */}
            <div className="test-email-card">
                <h2>Send Test Email</h2>
                <p className="help-text">Send a test email with the sample data above</p>

                <form onSubmit={handleSendTest} className="test-form">
                    <div className="form-group">
                        <label>Recipient Email</label>
                        <input
                            type="email"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            placeholder="Enter email address"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-send"
                        disabled={sending || !emailStatus?.configured}
                    >
                        {sending ? '📤 Sending...' : '📧 Send Test Email'}
                    </button>
                </form>

                {message && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                {!emailStatus?.configured && (
                    <div className="warning-box">
                        ⚠️ SMTP is not configured. Please update your .env file with SMTP credentials.
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailSettingsPage;
