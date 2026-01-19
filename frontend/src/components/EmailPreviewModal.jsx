import { useState } from 'react';
import { apiClient } from '../api/client';
import useAuth from '../hooks/useAuth';
import './EmailPreviewModal.css';

const EmailPreviewModal = ({ isOpen, onClose, emailData, salaryId }) => {
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [customMessage, setCustomMessage] = useState('');
    const { token } = useAuth();

    if (!isOpen || !emailData) return null;

    // Default email message
    const defaultMessage = `Dear ${emailData.employeeName},

I hope this email finds you well.

Please find attached your payslip for ${emailData.payPeriod}. The attached PDF document contains a detailed breakdown of your earnings, deductions, and other payroll information for this period.

Payment will be processed on ${emailData.payDate}.

If you have any questions or notice any discrepancies, please contact the HR Department within 5 working days.

Thank you for your continued dedication to HC Solutions.`;

    const emailMessage = customMessage || defaultMessage;

    const handleSendEmail = async () => {
        try {
            setSending(true);
            setMessage(null);

            // Send email with custom message if edited
            const payload = isEditing && customMessage ? { customMessage } : {};

            await apiClient.post(`/salaries/${salaryId}/send-email`, payload, { token });

            setMessage({
                type: 'success',
                text: `✅ Payslip email sent successfully to ${emailData.employeeEmail}!`
            });

            // Close modal after 2 seconds
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err) {
            setMessage({
                type: 'error',
                text: `❌ Failed to send email: ${err.message || 'Unknown error'}`
            });
        } finally {
            setSending(false);
        }
    };

    const handleSkip = () => {
        onClose();
    };

    const handleEditToggle = () => {
        if (!isEditing) {
            setCustomMessage(defaultMessage);
        }
        setIsEditing(!isEditing);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>📧 Send Payslip Email</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    <div className="email-info">
                        <div className="info-row">
                            <span className="label">To:</span>
                            <span className="value">{emailData.employeeEmail}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Employee:</span>
                            <span className="value">{emailData.employeeName}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Period:</span>
                            <span className="value">{emailData.payPeriod}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Payment Date:</span>
                            <span className="value">{emailData.payDate}</span>
                        </div>
                        <div className="info-row attachment">
                            <span className="label">📎 Attachment:</span>
                            <span className="value">{emailData.pdfFilename}</span>
                        </div>
                    </div>

                    <div className="email-preview">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <h3>Email Message:</h3>
                            <button
                                className="edit-toggle-btn"
                                onClick={handleEditToggle}
                                type="button"
                            >
                                {isEditing ? '👁️ Preview' : '✏️ Edit Message'}
                            </button>
                        </div>

                        {isEditing ? (
                            <textarea
                                className="email-editor"
                                value={customMessage}
                                onChange={(e) => setCustomMessage(e.target.value)}
                                rows={12}
                                placeholder="Enter your custom email message..."
                            />
                        ) : (
                            <div className="preview-box">
                                {emailMessage.split('\n').map((line, index) => (
                                    <p key={index}>{line || '\u00A0'}</p>
                                ))}
                                <div className="signature">
                                    <p>Best regards,<br />
                                        Payroll Team<br />
                                        HC Solutions</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {message && (
                        <div className={`message ${message.type}`}>
                            {message.text}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button
                        className="btn-skip"
                        onClick={handleSkip}
                        disabled={sending}
                    >
                        Skip
                    </button>
                    <button
                        className="btn-send"
                        onClick={handleSendEmail}
                        disabled={sending}
                    >
                        {sending ? '📤 Sending...' : '📧 Send Email'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmailPreviewModal;
