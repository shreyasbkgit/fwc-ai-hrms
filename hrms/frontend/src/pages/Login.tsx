import { useState } from "react";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
        const route =
          data.user.role === "ADMIN"
            ? "/admin"
            : data.user.role === "HR"
              ? "/hr"
              : data.user.role === "EMPLOYEE"
                ? "/employee"
                : "/candidate";
        window.location.href = route;
      } else {
        alert(data.message || "Invalid credentials");
      }
    } catch {
      alert("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-left">
          <div className="auth-logo">HRMS</div>
          <h1 className="auth-hero-title">Welcome back 👋</h1>
          <p className="auth-hero-text">
            Manage hiring, employees, and talent acquisition in one modern HR
            platform.
          </p>
        </div>

        <div className="auth-right">
          <h1 className="auth-title">Login</h1>
          <p className="auth-subtitle">Sign in to continue to your dashboard</p>

          <form onSubmit={handleLogin}>
            <div className="auth-field">
              <label className="auth-label">Email</label>
              <input
                className="auth-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>
            <div className="auth-field">
              <label className="auth-label">Password</label>
              <input
                className="auth-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="auth-btn">
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="auth-switch">
            Don't have an account?{" "}
            <span
              className="auth-link"
              onClick={() => (window.location.href = "/register")}
            >
              Sign Up
            </span>
          </div>

          <div className="creds-card">
            <div className="creds-title">Test Credentials</div>
            <div className="cred-row">
              <span className="cred-role">Admin</span>
              <span className="cred-detail">admin@fwc.com / admin123</span>
            </div>
            <div className="cred-row">
              <span className="cred-role">HR</span>
              <span className="cred-detail">hr@fwc.com / hr123</span>
            </div>
            <div className="cred-row">
              <span className="cred-role">Candidate</span>
              <span className="cred-detail">candidate@fwc.com / cand123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
