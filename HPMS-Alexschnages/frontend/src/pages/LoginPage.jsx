import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Zap, BarChart3, CheckCircle, KeyRound, ArrowRight, ArrowLeft } from "lucide-react";
import "./LoginPage.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

/* ── icons ── */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16.1 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.5 26.8 36.5 24 36.5c-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.4l6.2 5.2C40.9 35.1 44 30 44 24c0-1.2-.1-2.4-.4-3.5z" />
  </svg>
);

const EyeOpen = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeClosed = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState("creds"); // "creds" | "otp"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [preToken, setPreToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const otpRefs = useRef([]);

  /* ── Decode JWT and send each role to its home ── */
  const roleRedirect = (token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const role = payload.role || "";
      const destinations = {
        HR: "/hr-review",
        ManagingDirector: "/md-approval",
      };
      window.location.replace(destinations[role] || "/dashboard");
    } catch {
      window.location.replace("/dashboard");
    }
  };

  useEffect(() => {
    if (step === "otp") setTimeout(() => otpRefs.current[0]?.focus(), 100);
  }, [step]);

  /* ── Step 1 ── */
  const handleCreds = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const r = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Invalid credentials");
      if (d.token && d.requiresMfa === false) {
        localStorage.setItem("hpms_admin_token", d.token);
        roleRedirect(d.token); return;
      }
      if (d.preToken) { setPreToken(d.preToken); setStep("otp"); return; }
      throw new Error("Unexpected server response");
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  /* ── Step 2 ── */
  const submitOtp = async (digits) => {
    const code = (digits || otp).join("");
    if (code.length < 6) return;
    setError(""); setLoading(true);
    try {
      const r = await fetch(`${API}/auth/mfa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: preToken, code }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Invalid code");
      localStorage.setItem("hpms_admin_token", d.token);
      roleRedirect(d.token);
    } catch (err) {
      setError(err.message);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 80);
    } finally { setLoading(false); }
  };

  const handleOtpChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp]; next[i] = val.slice(-1); setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
    if (i === 5 && val) { const all = [...next]; if (all.every(d => d)) setTimeout(() => submitOtp(all), 60); }
  };
  const handleOtpKey = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };
  const handlePaste = (e) => {
    const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (p.length === 6) { const arr = p.split(""); setOtp(arr); otpRefs.current[5]?.focus(); setTimeout(() => submitOtp(arr), 60); }
  };

  return (
    <div className="lp">
      {/* ── Left panel ── */}
      <aside className="lp-side">
        <div className="lp-side-inner">
          <div className="lp-badge">HC Solutions</div>
          <h2 className="lp-tagline">Payroll,<br /><em>done right.</em></h2>
          <p className="lp-tagline-sub">Automated · RSSB-compliant · Audit-ready</p>
          <ul className="lp-perks">
            <li><span><Lock size={18} aria-hidden /></span> Bank-grade security</li>
            <li><span><Zap size={18} aria-hidden /></span> Real-time payroll runs</li>
            <li><span><BarChart3 size={18} aria-hidden /></span> Instant payslip reports</li>
            <li><span><CheckCircle size={18} aria-hidden /></span> Multi-level approvals</li>
          </ul>
        </div>
        <div className="lp-blob" />
      </aside>

      {/* ── Right panel ── */}
      <main className="lp-main">
        <div className="lp-card">
          <img src="/assets/hc-logo.png" alt="HC Solutions" className="lp-logo" />

          {/* ── STEP 1: Credentials ── */}
          {step === "creds" && (
            <form onSubmit={handleCreds} noValidate>
              <h1 className="lp-title">Welcome back</h1>
              <p className="lp-sub">Sign in to your payroll account</p>

              {error && <div className="lp-err" role="alert">{error}</div>}

              <button type="button" className="lp-google" onClick={() =>
                setError("Contact your administrator to enable Google SSO.")}>
                <GoogleIcon /> Continue with Google
              </button>

              <div className="lp-or"><span>or use email</span></div>

              <label className="lp-label">Email
                <input id="lp-email" type="email" autoComplete="email"
                  placeholder="you@hcsolutions.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </label>

              <label className="lp-label">
                <span className="lp-label-row">
                  Password
                  <button type="button" className="lp-link">Forgot password?</button>
                </span>
                <div className="lp-pw">
                  <input id="lp-pw" type={showPw ? "text" : "password"} autoComplete="current-password"
                    placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" className="lp-eye" onClick={() => setShowPw(v => !v)}
                    aria-label="Toggle password">
                    {showPw ? <EyeOpen /> : <EyeClosed />}
                  </button>
                </div>
              </label>

              <button type="submit" className="lp-submit" disabled={loading}>
                {loading ? <span className="lp-spin" /> : null}
                {loading ? "Verifying…" : <>Sign In Securely <ArrowRight size={16} style={{ verticalAlign: 'middle' }} /></>}
              </button>
            </form>
          )}

          {/* ── STEP 2: OTP ── */}
          {step === "otp" && (
            <div>
              <div className="lp-otp-icon"><KeyRound size={32} aria-hidden /></div>
              <h1 className="lp-title">Two-step verification</h1>
              <p className="lp-sub">Enter the 6-digit code from your authenticator app for<br /><strong>{email}</strong></p>

              {error && <div className="lp-err" role="alert">{error}</div>}

              <div className="lp-boxes" onPaste={handlePaste}>
                {otp.map((d, i) => (
                  <input key={i} className={`lp-box${d ? " lp-box--on" : ""}`}
                    ref={el => otpRefs.current[i] = el}
                    type="text" inputMode="numeric" maxLength={1} value={d}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKey(i, e)}
                    aria-label={`Digit ${i + 1}`} />
                ))}
              </div>

              <button className="lp-submit" disabled={loading || otp.join("").length < 6}
                onClick={() => submitOtp()}>
                {loading ? <span className="lp-spin" /> : null}
                {loading ? "Verifying…" : "Confirm Code"}
              </button>

              <button className="lp-back" onClick={() => { setStep("creds"); setError(""); setOtp(["", "", "", "", "", ""]); }}>
                <ArrowLeft size={16} style={{ verticalAlign: 'middle' }} /> Back to login
              </button>
            </div>
          )}

          <p className="lp-copy">© {new Date().getFullYear()} HC Solutions · All rights reserved</p>
        </div>
      </main>
    </div>
  );
}
