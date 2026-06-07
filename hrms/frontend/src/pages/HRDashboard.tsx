import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HRDashboard.css";

type Job = {
  id: string;
  title: string;
  description: string;
  skillsRequired: string;
  experienceRequired: string;
  salaryRange: string;
  employmentType: string;
  openings: number;
  location: string;
};

type Application = {
  id: string;
  resumeUrl?: string;
  aiScore?: number;
  aiSummary?: string;
  interviewScore?: number;
  finalScore?: number;
  decision?: string;
  user: { name: string; email: string };
  job: { id: string; title: string };
};

type AttendanceRecord = {
  id: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
  user: { name: string; email: string };
};

function HRDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("jobs");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    skillsRequired: "",
    experienceRequired: "",
    salaryRange: "",
    employmentType: "Full-Time",
    openings: "",
    location: "",
  });

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const loadJobs = async () => {
    const res = await fetch("/api/jobs");
    const data = await res.json();
    if (data.success) setJobs(data.jobs);
  };

  const loadApplications = async () => {
    const res = await fetch("/api/jobs/applications");
    const data = await res.json();
    if (data.success) setApplications(data.applications);
  };

  const loadAttendance = async () => {
    const res = await fetch("/api/attendance/all");
    const data = await res.json();
    if (data.success) setAttendance(data.records);
  };

  const createJob = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    if (data.success) {
      alert("Job created successfully");
      setForm({
        title: "",
        description: "",
        skillsRequired: "",
        experienceRequired: "",
        salaryRange: "",
        employmentType: "Full-Time",
        openings: "",
        location: "",
      });
      loadJobs();
    }
  };

  useEffect(() => {
    loadJobs();
    loadApplications();
    loadAttendance();
  }, []);

  const groupedApplications = jobs
    .map((job) => ({
      ...job,
      applicants: applications
        .filter((app) => app.job.id === job.id)
        .sort((a, b) => (b.aiScore ?? 0) - (a.aiScore ?? 0)),
    }))
    .filter((job) => job.applicants.length > 0);

  const scoreClass = (score?: number | null) => {
    if (score == null) return "low";
    if (score >= 75) return "high";
    if (score >= 55) return "medium";
    return "low";
  };

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const fmtTotal = (r: AttendanceRecord) => {
    if (!r.clockOut) return null;
    const ms = new Date(r.clockOut).getTime() - new Date(r.clockIn).getTime();
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
  };

  const formFields = [
    { key: "title", placeholder: "Job Title" },
    { key: "description", placeholder: "Description" },
    { key: "skillsRequired", placeholder: "Skills Required" },
    { key: "experienceRequired", placeholder: "Experience Required" },
    { key: "salaryRange", placeholder: "Salary Range" },
    { key: "openings", placeholder: "Openings" },
    { key: "location", placeholder: "Location" },
  ];

  return (
    <div className="dash-page">
      <div className="dash-sidebar">
        <div className="dash-logo">HRMS</div>

        <button
          className={`dash-nav-btn ${activeTab === "jobs" ? "active" : ""}`}
          onClick={() => setActiveTab("jobs")}
        >
          📋 Jobs
        </button>
        <button
          className={`dash-nav-btn ${activeTab === "applicants" ? "active" : ""}`}
          onClick={() => setActiveTab("applicants")}
        >
          👥 Applicants
        </button>
        <button
          className={`dash-nav-btn ${activeTab === "attendance" ? "active" : ""}`}
          onClick={() => setActiveTab("attendance")}
        >
          🕐 Attendance
        </button>

        <button className="dash-logout-btn" onClick={logout}>
          🚪 Logout
        </button>
      </div>

      <div className="dash-main">
        <h1 className="dash-heading">Welcome back, HR 👋</h1>
        <p className="dash-subtitle">
          Manage hiring and recruitment efficiently.
        </p>

        {/* ── Jobs tab ── */}
        {activeTab === "jobs" && (
          <div className="jobs-grid">
            <div className="dash-card">
              <h2>Post a Job</h2>
              <form className="job-form" onSubmit={createJob}>
                {formFields.map(({ key, placeholder }) => (
                  <input
                    key={key}
                    placeholder={placeholder}
                    value={form[key as keyof typeof form]}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                    required
                  />
                ))}
                <select
                  value={form.employmentType}
                  onChange={(e) =>
                    setForm({ ...form, employmentType: e.target.value })
                  }
                >
                  <option>Full-Time</option>
                  <option>Internship</option>
                  <option>Contract</option>
                </select>
                <button type="submit" className="job-form-btn">
                  ✦ Create Job
                </button>
              </form>
            </div>

            <div className="dash-card">
              <h2>Active Jobs ({jobs.length})</h2>
              {jobs.length === 0 ? (
                <p
                  style={{
                    color: "#9ca3af",
                    textAlign: "center",
                    padding: "32px 0",
                  }}
                >
                  No jobs posted yet.
                </p>
              ) : (
                jobs.map((job) => (
                  <div key={job.id} className="job-card">
                    <h3>{job.title}</h3>
                    <p
                      className="job-card p"
                      style={{
                        color: "#6b7280",
                        fontSize: "13px",
                        marginBottom: "10px",
                      }}
                    >
                      {job.description}
                    </p>
                    <div className="job-meta">
                      <span className="job-tag blue">
                        🧠 {job.skillsRequired}
                      </span>
                      <span className="job-tag green">
                        📈 {job.experienceRequired}
                      </span>
                      <span className="job-tag amber">
                        💰 {job.salaryRange}
                      </span>
                      <span className="job-tag purple">
                        💼 {job.employmentType}
                      </span>
                      <span className="job-tag blue">
                        👥 {job.openings} openings
                      </span>
                      <span className="job-tag green">📍 {job.location}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── Applicants tab ── */}
        {activeTab === "applicants" && (
          <div className="dash-card">
            <h2>Applicants by Job</h2>
            {groupedApplications.length === 0 ? (
              <p
                style={{
                  color: "#9ca3af",
                  textAlign: "center",
                  padding: "32px 0",
                }}
              >
                No applications received yet.
              </p>
            ) : (
              groupedApplications.map((job) => (
                <div key={job.id} className="applicant-group">
                  <h3>
                    {job.title}{" "}
                    <span
                      style={{
                        fontWeight: 400,
                        color: "#9ca3af",
                        fontSize: "14px",
                      }}
                    >
                      ({job.applicants.length})
                    </span>
                  </h3>
                  {job.applicants.map((app) => {
                    const cls = scoreClass(app.aiScore);
                    const resumeUrl = app.resumeUrl;
                    return (
                      <div key={app.id} className="applicant-card">
                        <div className="applicant-header">
                          <div>
                            <div className="applicant-name">
                              {app.user.name}
                            </div>
                            <div className="applicant-email">
                              {app.user.email}
                            </div>
                          </div>
                          {app.aiScore != null && (
                            <div className={`score-badge ${cls}`}>
                              AI {app.aiScore}/100
                            </div>
                          )}
                        </div>

                        {app.aiScore != null && (
                          <div className="score-bar-wrap">
                            <div
                              className={`score-bar ${cls}`}
                              style={{ width: `${app.aiScore}%` }}
                            />
                          </div>
                        )}

                        {app.aiSummary && (
                          <p className="ai-summary">{app.aiSummary}</p>
                        )}

                        {app.finalScore != null && (
                          <p
                            style={{
                              fontSize: "13px",
                              color: "#374151",
                              marginTop: "6px",
                            }}
                          >
                            <strong>Final Score:</strong>{" "}
                            {app.finalScore.toFixed(1)} —{" "}
                            <span
                              style={{
                                fontWeight: 700,
                                color:
                                  app.decision === "HIRE"
                                    ? "#16a34a"
                                    : app.decision === "REVIEW"
                                      ? "#d97706"
                                      : "#dc2626",
                              }}
                            >
                              {app.decision}
                            </span>
                          </p>
                        )}

                        {resumeUrl && (
                          <div className="resume-btns">
                            <button
                              className="resume-btn view"
                              onClick={() => window.open(resumeUrl, "_blank")}
                            >
                              📄 View Resume
                            </button>
                            <a
                              href={resumeUrl}
                              target="_blank"
                              rel="noreferrer"
                              download
                              style={{ textDecoration: "none" }}
                            >
                              <button className="resume-btn dl">
                                ⬇ Download
                              </button>
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Attendance tab ── */}
        {activeTab === "attendance" && (
          <div className="dash-card">
            <h2>Employee Attendance</h2>
            {attendance.length === 0 ? (
              <p
                style={{
                  color: "#9ca3af",
                  textAlign: "center",
                  padding: "32px 0",
                }}
              >
                No attendance records yet.
              </p>
            ) : (
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Clock In</th>
                    <th>Clock Out</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div className="att-name">{r.user.name}</div>
                        <div className="att-email">{r.user.email}</div>
                      </td>
                      <td>{r.date}</td>
                      <td>{fmtTime(r.clockIn)}</td>
                      <td>
                        {r.clockOut ? (
                          fmtTime(r.clockOut)
                        ) : (
                          <span className="att-active">● Active</span>
                        )}
                      </td>
                      <td>{fmtTotal(r) ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default HRDashboard;
