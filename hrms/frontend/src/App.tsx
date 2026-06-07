import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

import AdminDashboard from "./pages/AdminDashboard";
import HRDashboard from "./pages/HRDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import CandidateDashboard from "./pages/CandidateDashboard";
import InterviewPage from "./pages/InterviewPage";
function ProtectedRoute({
  user,
  role,
  children,
}: {
  user: any;
  role: string;
  children: React.ReactNode;
}) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  return (
    <Routes>
      {/* Root */}

      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Auth */}

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      {/* Admin */}

      <Route
        path="/admin"
        element={
          <ProtectedRoute user={user} role="ADMIN">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* HR */}

      <Route
        path="/hr"
        element={
          <ProtectedRoute user={user} role="HR">
            <HRDashboard />
          </ProtectedRoute>
        }
      />

      {/* Employee */}

      <Route
        path="/employee"
        element={
          <ProtectedRoute user={user} role="EMPLOYEE">
            <EmployeeDashboard />
          </ProtectedRoute>
        }
      />

      {/* Candidate */}

      <Route
        path="/candidate"
        element={
          <ProtectedRoute user={user} role="CANDIDATE">
            <CandidateDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="/interview/:id" element={<InterviewPage />} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
