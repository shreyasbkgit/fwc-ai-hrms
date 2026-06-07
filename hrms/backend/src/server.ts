import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";

import authRoutes from "./routes/auth";
import jobRoutes from "./routes/jobs";
import adminRoutes from "./routes/admin";
import interviewRoutes from "./routes/interview";
import attendanceRoutes from "./routes/attendance";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

/* API Routes */

app.use("/api/auth", authRoutes);

app.use("/api/jobs", jobRoutes);

app.use("/api/admin", adminRoutes);

/* Test Route */

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "API working",
  });
});
app.use("/api/interview", interviewRoutes);
app.use("/api/attendance", attendanceRoutes);
/* Frontend Build */

const frontendPath = path.join(__dirname, "../../frontend/dist");

app.use(express.static(frontendPath));

app.get("/*path", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
