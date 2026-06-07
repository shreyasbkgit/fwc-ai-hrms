import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CANDIDATE");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await response.json();
      alert(data.message);
      if (data.success) navigate("/login");
    } catch {
      alert("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-left">
          <div className="auth-logo">HRMS</div>
          <h1 className="auth-hero-title">Create account 🚀</h1>
          <p className="auth-hero-text">
            Join our intelligent HR platform and start your hiring journey
            today.
          </p>
        </div>

        <div className="auth-right">
          <h1 className="auth-title">Register</h1>
          <p className="auth-subtitle">Create your account to get started</p>

          <form onSubmit={handleRegister}>
            <div className="auth-field">
              <label className="auth-label">Full Name</label>
              <input
                className="auth-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
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
            <div className="auth-field">
              <label className="auth-label">Role</label>
              <select
                className="auth-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="CANDIDATE">Candidate</option>
                <option value="HR">HR Recruiter</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="auth-btn">
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <div className="auth-switch">
            Already have an account?{" "}
            <span className="auth-link" onClick={() => navigate("/login")}>
              Sign In
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
