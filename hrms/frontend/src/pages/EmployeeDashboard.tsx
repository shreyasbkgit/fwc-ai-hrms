import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./EmployeeDashboard.css";

type AttendanceRecord = {
  id: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
};

function EmployeeDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [elapsed, setElapsed] = useState("");
  const [loading, setLoading] = useState(false);

  const loadToday = async () => {
    const res = await fetch(`/api/attendance/today/${user.id}`);
    const data = await res.json();
    if (data.success) setRecord(data.record);
  };

  useEffect(() => {
    loadToday();
  }, []);

  useEffect(() => {
    if (!record || record.clockOut) {
      setElapsed("");
      return;
    }
    const tick = () => {
      const diff = Date.now() - new Date(record.clockIn).getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [record]);

  const clockIn = async () => {
    setLoading(true);
    const res = await fetch("/api/attendance/clockin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    const data = await res.json();
    if (data.success) setRecord(data.record);
    else alert(data.message);
    setLoading(false);
  };

  const clockOut = async () => {
    setLoading(true);
    const res = await fetch("/api/attendance/clockout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    const data = await res.json();
    if (data.success) setRecord(data.record);
    else alert(data.message);
    setLoading(false);
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const totalTime = (r: AttendanceRecord) => {
    if (!r.clockOut) return null;
    const diff = new Date(r.clockOut).getTime() - new Date(r.clockIn).getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  return (
    <div className="dash-page">
      <div className="dash-sidebar">
        <div className="dash-logo">HRMS</div>
        <button className="dash-logout-btn" onClick={logout}>
          🚪 Logout
        </button>
      </div>

      <div className="dash-main">
        <h1 className="dash-heading">Welcome, {user.name || "Employee"} 👋</h1>
        <p className="dash-subtitle">Track your attendance for today.</p>

        <div className="attendance-card">
          <h2>Today's Attendance</h2>

          {!record ? (
            <>
              <p className="not-clocked-text">
                You haven't clocked in yet today.
              </p>
              <button
                className="clock-btn in"
                onClick={clockIn}
                disabled={loading}
              >
                ● Clock In
              </button>
            </>
          ) : (
            <>
              <p className="clock-in-time">
                <strong>Clocked in:</strong> {fmt(record.clockIn)}
              </p>

              {record.clockOut ? (
                <>
                  <p className="clock-in-time">
                    <strong>Clocked out:</strong> {fmt(record.clockOut)}
                  </p>
                  <p className="total-time">
                    <strong>Total time:</strong> {totalTime(record)}
                  </p>
                  <div className="recorded-banner">
                    ✓ Attendance recorded for today
                  </div>
                </>
              ) : (
                <>
                  <div className="elapsed-timer">{elapsed}</div>
                  <button
                    className="clock-btn out"
                    onClick={clockOut}
                    disabled={loading}
                  >
                    ■ Clock Out
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmployeeDashboard;
