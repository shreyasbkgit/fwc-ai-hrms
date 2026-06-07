import { useEffect, useState } from "react";
import "./AdminDashboard.css";

type PendingUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);

  const loadPendingUsers = async () => {
    try {
      const response = await fetch("/api/admin/pending-users");
      const data = await response.json();
      if (data.success) setPendingUsers(data.users);
    } catch (error) {
      console.error(error);
    }
  };

  const approveUser = async (id: string) => {
    await fetch(`/api/admin/approve/${id}`, { method: "PATCH" });
    loadPendingUsers();
  };

  const rejectUser = async (id: string) => {
    await fetch(`/api/admin/reject/${id}`, { method: "PATCH" });
    loadPendingUsers();
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const roleBadgeClass = (role: string) => {
    if (role === "HR") return "role-badge hr";
    if (role === "ADMIN") return "role-badge admin";
    return "role-badge employee";
  };

  return (
    <div className="dash-page">
      <div className="dash-sidebar">
        <div className="dash-logo">HRMS</div>

        <button
          className={`dash-nav-btn ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          📊 Dashboard
        </button>

        <button
          className={`dash-nav-btn ${activeTab === "approvals" ? "active" : ""}`}
          onClick={() => setActiveTab("approvals")}
        >
          ✅ Approvals
          {pendingUsers.length > 0 && (
            <span
              style={{
                marginLeft: 8,
                background: "#ef4444",
                color: "white",
                borderRadius: "99px",
                fontSize: "11px",
                padding: "1px 7px",
                fontWeight: 700,
              }}
            >
              {pendingUsers.length}
            </span>
          )}
        </button>

        <button className="dash-logout-btn" onClick={logout}>
          🚪 Logout
        </button>
      </div>

      <div className="dash-main">
        <h1 className="dash-heading">Welcome, Admin 👋</h1>
        <p className="dash-subtitle">
          Manage users and approvals across your HRMS system.
        </p>

        {activeTab === "dashboard" && (
          <div className="stats-grid">
            <div className="stat-card amber">
              <div className="stat-icon">⏳</div>
              <div className="stat-label">Pending Approvals</div>
              <div className="stat-value">{pendingUsers.length}</div>
            </div>
            <div className="stat-card blue">
              <div className="stat-icon">🎭</div>
              <div className="stat-label">Active Roles</div>
              <div className="stat-value">4</div>
            </div>
            <div className="stat-card green">
              <div className="stat-icon">🟢</div>
              <div className="stat-label">System Status</div>
              <div className="stat-value" style={{ fontSize: "22px" }}>
                Online
              </div>
            </div>
          </div>
        )}

        {activeTab === "approvals" && (
          <div className="dash-card">
            <h2>Pending Approvals</h2>

            {pendingUsers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🎉</div>
                <p>No pending approvals right now.</p>
              </div>
            ) : (
              pendingUsers.map((user) => (
                <div key={user.id} className="user-card">
                  <div className="user-card-header">
                    <span className="user-name">{user.name}</span>
                    <span className={roleBadgeClass(user.role)}>
                      {user.role}
                    </span>
                  </div>
                  <div className="user-email">{user.email}</div>
                  <div className="action-row">
                    <button
                      className="approve-btn"
                      onClick={() => approveUser(user.id)}
                    >
                      ✓ Approve
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => rejectUser(user.id)}
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
