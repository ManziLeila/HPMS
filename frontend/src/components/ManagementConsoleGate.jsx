import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import managementApi from '../api/managementApi';
import './ManagementConsoleGate.css';

const STORAGE_KEY = 'hpms_mgmt_unlocked';
const TTL_MS = 15 * 60 * 1000; // 15 minutes

function getUnlockedAt() {
  try {
    const t = parseInt(sessionStorage.getItem(STORAGE_KEY), 10);
    return Number.isFinite(t) && Date.now() - t < TTL_MS ? t : null;
  } catch {
    return null;
  }
}

export function clearManagementUnlock() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export default function ManagementConsoleGate({ children }) {
  const { token } = useAuth();
  const [unlockedAt, setUnlockedAt] = useState(getUnlockedAt);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const unlocked = unlockedAt !== null;

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!token || !password.trim()) return;
      setError('');
      setLoading(true);
      try {
        await managementApi.verifyAccess(password, token);
        const now = Date.now();
        sessionStorage.setItem(STORAGE_KEY, String(now));
        setUnlockedAt(now);
        setPassword('');
      } catch (err) {
        setError(err.message || err.error?.message || 'Incorrect password');
      } finally {
        setLoading(false);
      }
    },
    [token, password]
  );

  if (!token) {
    return (
      <div className="mgmt-gate">
        <p>You must be logged in to access the Management Console.</p>
        <Link to="/login">Go to login</Link>
      </div>
    );
  }

  if (unlocked) {
    return children;
  }

  return (
    <div className="mgmt-gate">
      <div className="mgmt-gate__card">
        <div className="mgmt-gate__icon">
          <Shield size={40} aria-hidden />
        </div>
        <h2 className="mgmt-gate__title">Management Console</h2>
        <p className="mgmt-gate__desc">
          Enter your account password to access this section.
        </p>
        <form onSubmit={handleSubmit} className="mgmt-gate__form">
          <label className="mgmt-gate__label">
            <Lock size={18} className="mgmt-gate__label-icon" aria-hidden />
            Password
            <input
              type="password"
              className="mgmt-gate__input"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
              disabled={loading}
            />
          </label>
          {error && (
            <p className="mgmt-gate__error" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="mgmt-gate__submit"
            disabled={loading || !password.trim()}
          >
            {loading ? 'Verifying…' : 'Continue'}
          </button>
        </form>
        <Link to="/dashboard" className="mgmt-gate__back">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
