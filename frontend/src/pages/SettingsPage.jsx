import { useState } from 'react';
import { apiClient } from '../api/client';
import useAuth from '../hooks/useAuth';
import './SettingsPage.css';

const SettingsPage = () => {
    const { user, token } = useAuth();
    const [tab, setTab] = useState('password');

    /* ── Password change ─────────────────────────────────────── */
    const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [pwLoading, setPwLoading] = useState(false);
    const [pwMsg, setPwMsg] = useState(null);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPwMsg(null);

        if (pwForm.newPassword !== pwForm.confirmPassword) {
            setPwMsg({ type: 'err', text: 'New passwords do not match.' });
            return;
        }
        if (pwForm.newPassword.length < 8) {
            setPwMsg({ type: 'err', text: 'New password must be at least 8 characters.' });
            return;
        }

        setPwLoading(true);
        try {
            await apiClient.post('/auth/change-password', {
                currentPassword: pwForm.currentPassword,
                newPassword: pwForm.newPassword,
            }, { token });
            setPwMsg({ type: 'ok', text: '✅ Password changed successfully! Please log in again on your next session.' });
            setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setPwMsg({ type: 'err', text: err.message || 'Failed to change password.' });
        } finally {
            setPwLoading(false);
        }
    };

    const ROLE_LABELS = {
        FinanceOfficer: 'Finance Officer',
        HR: 'HR Manager',
        ManagingDirector: 'Managing Director',
        Admin: 'Administrator',
        Employee: 'Employee',
    };

    return (
        <div className="settings">
            {/* ── Header ─────────────────────────────────────────────── */}
            <header className="settings__header">
                <div>
                    <p className="settings__eyebrow">Account</p>
                    <h2>Settings & Profile</h2>
                </div>
            </header>

            {/* ── Profile Card ──────────────────────────────────────── */}
            <section className="settings__profile-card">
                <div className="settings__avatar">
                    {(user?.fullName || user?.email || '?').charAt(0).toUpperCase()}
                </div>
                <div className="settings__profile-info">
                    <p className="settings__profile-name">{user?.fullName || '—'}</p>
                    <p className="settings__profile-email">{user?.email}</p>
                    <span className="settings__role-badge">{ROLE_LABELS[user?.role] || user?.role}</span>
                </div>
            </section>

            {/* ── Tab nav ───────────────────────────────────────────── */}
            <div className="settings__tabs">
                <button
                    className={`settings__tab ${tab === 'password' ? 'settings__tab--active' : ''}`}
                    onClick={() => setTab('password')}
                >
                    🔐 Change Password
                </button>
            </div>

            {/* ── Change Password ───────────────────────────────────── */}
            {tab === 'password' && (
                <section className="settings__section">
                    <h3>Change Your Password</h3>
                    <p className="settings__help">
                        Use a strong password with at least 8 characters, mixing letters, numbers, and symbols.
                    </p>

                    {pwMsg && (
                        <div className={`settings__msg settings__msg--${pwMsg.type}`} onClick={() => setPwMsg(null)}>
                            {pwMsg.text} <span>✕</span>
                        </div>
                    )}

                    <form className="settings__form" onSubmit={handlePasswordChange}>
                        <div className="settings__field">
                            <label htmlFor="currentPassword">Current Password</label>
                            <input
                                id="currentPassword"
                                type="password"
                                autoComplete="current-password"
                                value={pwForm.currentPassword}
                                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                                required
                                placeholder="Enter your current password"
                            />
                        </div>
                        <div className="settings__field">
                            <label htmlFor="newPassword">New Password</label>
                            <input
                                id="newPassword"
                                type="password"
                                autoComplete="new-password"
                                value={pwForm.newPassword}
                                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                                required
                                minLength={8}
                                placeholder="At least 8 characters"
                            />
                        </div>
                        <div className="settings__field">
                            <label htmlFor="confirmPassword">Confirm New Password</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                value={pwForm.confirmPassword}
                                onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                                required
                                placeholder="Repeat new password"
                            />
                        </div>

                        {/* Strength indicator */}
                        {pwForm.newPassword && (
                            <div className="settings__strength">
                                <div
                                    className="settings__strength-bar"
                                    style={{
                                        width: `${Math.min(100, pwForm.newPassword.length * 8)}%`,
                                        background: pwForm.newPassword.length < 8 ? '#ef4444'
                                            : pwForm.newPassword.length < 12 ? '#f59e0b' : '#10b981',
                                    }}
                                />
                                <span>
                                    {pwForm.newPassword.length < 8 ? 'Too short'
                                        : pwForm.newPassword.length < 12 ? 'Acceptable'
                                            : 'Strong'}
                                </span>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="settings__btn settings__btn--primary"
                            disabled={pwLoading}
                        >
                            {pwLoading ? 'Changing…' : '🔐 Update Password'}
                        </button>
                    </form>
                </section>
            )}
        </div>
    );
};

export default SettingsPage;
