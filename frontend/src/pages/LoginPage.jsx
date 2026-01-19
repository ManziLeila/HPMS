import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
import useAuth from "../hooks/useAuth.js";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
    mfaCode: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // -------------------------
  // HANDLE FORM INPUT CHANGES
  // -------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  // -------------------------
  // LOGIN SUBMISSION HANDLER
  // -------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { email, password, mfaCode } = formValues;

      // Attempt login via AuthContext
      await login({ email, password, mfaCode });

      // Redirect to dashboard AFTER successful login
      navigate("/dashboard");

    } catch (err) {
      setError(err.message || "Unable to authenticate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        
        <p className="login-card__eyebrow">HC Solutions</p>
        <h1>Admin Access</h1>

        <p className="login-card__subtitle">
          Multi-factor authentication is required for each payroll session.
        </p>

        {error && <p className="login-card__error">{error}</p>}

        {/* Email */}
        <label>
          <span>Email</span>
          <input
            type="email"
            name="email"
            placeholder="admin@hcsolutions.com"
            value={formValues.email}
            onChange={handleChange}
            required
          />
        </label>

        {/* Password */}
        <label>
          <span>Password</span>
          <input
            type="password"
            name="password"
            placeholder="••••••"
            value={formValues.password}
            onChange={handleChange}
            required
          />
        </label>

        {/* MFA Code */}
        <label>
          <span>MFA Code</span>
          <input
            type="text"
            name="mfaCode"
            placeholder="6-digit code"
            pattern="[0-9]{6}"
            inputMode="numeric"
            value={formValues.mfaCode}
            onChange={handleChange}
          />
        </label>

        {/* Submit Button */}
        <button type="submit" disabled={loading}>
          {loading ? "Verifying…" : "Secure Sign In"}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
