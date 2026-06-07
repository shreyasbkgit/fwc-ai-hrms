import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CandidateDashboard.css";

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

function CandidateDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [activeTab, setActiveTab] = useState("jobs");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [eligibleInterviews, setEligibleInterviews] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedResume, setSelectedResume] = useState<File | null>(null);
  const [applying, setApplying] = useState(false);

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
    if (data.success) {
      const mine = data.applications.filter(
        (app: any) => app.user?.email === user.email,
      );
      setAppliedJobs(mine.map((app: any) => app.job.id));
      setEligibleInterviews(
        mine.filter((app: any) => app.aiScore >= 80 && !app.interviewCompleted),
      );
    }
  };

  const applyJob = async () => {
    if (!selectedResume) {
      alert("Please upload a resume PDF");
      return;
    }
    try {
      setApplying(true);
      const formData = new FormData();
      formData.append("userId", user.id);
      formData.append("jobId", selectedJobId!);
      formData.append("resume", selectedResume);

      const response = await fetch("/api/jobs/apply", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      alert(data.message);
      if (data.success) {
        setSelectedJobId(null);
        setSelectedResume(null);
        loadApplications();
      }
    } catch {
      alert("Application failed");
    } finally {
      setApplying(false);
    }
  };

  useEffect(() => {
    loadJobs();
    loadApplications();
  }, []);

  const filteredJobs =
    activeTab === "applied"
      ? jobs.filter((job) => appliedJobs.includes(job.id))
      : jobs.filter((job) => !appliedJobs.includes(job.id));

  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  return (
    <div className="dash-page">
      <div className="dash-sidebar">
        <div className="dash-logo">HRMS</div>

        <button
          className={`dash-nav-btn ${activeTab === "jobs" ? "active" : ""}`}
          onClick={() => setActiveTab("jobs")}
        >
          💼 Available Jobs
        </button>
        <button
          className={`dash-nav-btn ${activeTab === "applied" ? "active" : ""}`}
          onClick={() => setActiveTab("applied")}
        >
          📄 Applied
          {appliedJobs.length > 0 && (
            <span
              style={{
                marginLeft: 8,
                background: "#2563eb",
                color: "white",
                borderRadius: "99px",
                fontSize: "11px",
                padding: "1px 7px",
                fontWeight: 700,
              }}
            >
              {appliedJobs.length}
            </span>
          )}
        </button>
        <button
          className={`dash-nav-btn ${activeTab === "interviews" ? "active" : ""}`}
          onClick={() => setActiveTab("interviews")}
        >
          🎤 Interviews
          {eligibleInterviews.length > 0 && (
            <span
              style={{
                marginLeft: 8,
                background: "#22c55e",
                color: "white",
                borderRadius: "99px",
                fontSize: "11px",
                padding: "1px 7px",
                fontWeight: 700,
              }}
            >
              {eligibleInterviews.length}
            </span>
          )}
        </button>

        <button className="dash-logout-btn" onClick={logout}>
          🚪 Logout
        </button>
      </div>

      <div className="dash-main">
        <h1 className="dash-heading">
          Welcome back, {user.name || "Candidate"} 👋
        </h1>
        <p className="dash-subtitle">
          {activeTab === "jobs" && "Browse and apply for open positions."}
          {activeTab === "applied" && "Jobs you've applied to."}
          {activeTab === "interviews" && "Interviews you're eligible for."}
        </p>

        <div className="dash-card">
          <h2>
            {activeTab === "jobs" && `Available Jobs (${filteredJobs.length})`}
            {activeTab === "applied" && `Applied Jobs (${filteredJobs.length})`}
            {activeTab === "interviews" &&
              `Eligible Interviews (${eligibleInterviews.length})`}
          </h2>

          {/* Interviews tab */}
          {activeTab === "interviews" &&
            (eligibleInterviews.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🎤</div>
                <p>
                  No interviews available. Apply to jobs and score ≥ 80 on
                  resume screening.
                </p>
              </div>
            ) : (
              eligibleInterviews.map((app: any) => (
                <div key={app.id} className="interview-card">
                  <h3>{app.job.title}</h3>
                  <p>
                    Your resume scored <strong>{app.aiScore}/100</strong> —
                    you're eligible for the interview!
                  </p>
                  <button
                    className="start-interview-btn"
                    onClick={() => navigate(`/interview/${app.id}`)}
                  >
                    Start Interview →
                  </button>
                </div>
              ))
            ))}

          {/* Jobs / Applied tabs */}
          {activeTab !== "interviews" &&
            (filteredJobs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  {activeTab === "jobs" ? "💼" : "📄"}
                </div>
                <p>
                  {activeTab === "jobs"
                    ? "No available jobs right now."
                    : "You haven't applied to any jobs yet."}
                </p>
              </div>
            ) : (
              filteredJobs.map((job) => (
                <div key={job.id} className="job-card">
                  <h3>{job.title}</h3>
                  <p className="job-card-desc">{job.description}</p>
                  <div className="job-meta">
                    <span className="job-tag blue">
                      🧠 {job.skillsRequired}
                    </span>
                    <span className="job-tag green">
                      📈 {job.experienceRequired}
                    </span>
                    <span className="job-tag amber">💰 {job.salaryRange}</span>
                    <span className="job-tag purple">
                      💼 {job.employmentType}
                    </span>
                    <span className="job-tag blue">
                      👥 {job.openings} openings
                    </span>
                    <span className="job-tag green">📍 {job.location}</span>
                  </div>
                  {activeTab === "jobs" && (
                    <button
                      className="apply-btn"
                      onClick={() => setSelectedJobId(job.id)}
                    >
                      Apply Now →
                    </button>
                  )}
                </div>
              ))
            ))}
        </div>
      </div>

      {/* Upload modal */}
      {selectedJobId && (
        <div className="modal-overlay" onClick={() => setSelectedJobId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Apply for Role</h2>
            <p className="modal-sub">{selectedJob?.title}</p>

            <label className="file-input-wrap">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setSelectedResume(e.target.files?.[0] || null)}
              />
              <span className="file-input-label">
                <div className="file-icon">📄</div>
                <strong>Click to upload your resume</strong>
                <div className="file-hint">PDF only, max 5 MB</div>
                {selectedResume && (
                  <div className="file-selected">✓ {selectedResume.name}</div>
                )}
              </span>
            </label>

            <div className="modal-btns">
              <button
                className="modal-cancel-btn"
                onClick={() => setSelectedJobId(null)}
              >
                Cancel
              </button>
              <button
                className="modal-submit-btn"
                onClick={applyJob}
                disabled={applying || !selectedResume}
              >
                {applying ? "Submitting…" : "Submit Application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CandidateDashboard;
