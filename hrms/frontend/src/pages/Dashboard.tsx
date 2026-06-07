import AdminDashboard from "./AdminDashboard";
import HRDashboard from "./HRDashboard";
import EmployeeDashboard from "./EmployeeDashboard";
import CandidateDashboard from "./CandidateDashboard";

function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  switch (user.role) {
    case "ADMIN":
      return <AdminDashboard />;

    case "HR":
      return <HRDashboard />;

    case "EMPLOYEE":
      return <EmployeeDashboard />;

    case "CANDIDATE":
      return <CandidateDashboard />;

    default:
      return <h1>Unauthorized</h1>;
  }
}

export default Dashboard;
