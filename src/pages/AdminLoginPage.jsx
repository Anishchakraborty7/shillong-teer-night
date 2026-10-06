import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../components/Logo";
import { useAuth } from "../hooks/useAuth";

export function AdminLoginPage() {
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { isAuthenticated, loading, login } = useAuth();
  const navigate = useNavigate();

  // Redirect to /admin if already logged in
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/admin", { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!adminId.trim() || !password) {
      setErrorMsg("Please enter both Admin ID and Password.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      await login(adminId.trim(), password);
      navigate("/admin");
    } catch (err) {
      console.error("Login failed:", err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setErrorMsg("Invalid Admin ID or Password. Please try again.");
      } else if (err.code === "auth/too-many-requests") {
        setErrorMsg("Too many unsuccessful attempts. Please try again later.");
      } else {
        setErrorMsg(err.message || "Authentication failed. Please verify your credentials.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page-container">
        <div className="admin-card auth-card">
          <p className="admin-status-text">Checking authorization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      <div className="admin-card auth-card">
        <div className="auth-logo-center">
          <Logo size={44} showText={false} />
          <h2 className="auth-brand-name">SHILLONG TEER NIGHT</h2>
          <span className="auth-card-title">ADMIN LOGIN</span>
        </div>

        {errorMsg && (
          <div className="admin-alert error-alert" role="alert">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label htmlFor="adminId" className="form-label">
              Admin ID
            </label>
            <input
              id="adminId"
              type="text"
              className="form-input"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              placeholder="e.g. admin or admin@shillongteernight.com"
              autoComplete="username"
              required
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter administrator password"
              autoComplete="current-password"
              required
              disabled={submitting}
            />
          </div>

          <button
            type="submit"
            className="admin-btn primary-btn submit-btn"
            disabled={submitting}
          >
            {submitting ? "VERIFYING..." : "LOGIN"}
          </button>
        </form>

        <div className="auth-card-footer">
          <Link to="/" className="back-home-link">
            &larr; Return to Public Results
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminLoginPage;
