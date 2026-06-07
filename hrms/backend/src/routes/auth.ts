import express from "express";
import bcrypt from "bcryptjs";
import prisma from "../db";

const router = express.Router();

/* ---------------- LOGIN ---------------- */

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({
        success: false,
        message: "Invalid password",
      });
    }

    // Approval check

    if (user.status === "PENDING") {
      return res.json({
        success: false,
        message: "Awaiting admin approval",
      });
    }

    if (user.status === "REJECTED") {
      return res.json({
        success: false,
        message: "Account rejected",
      });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* -------------- REGISTER -------------- */

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Candidate auto approval
    // HR/Admin need approval

    const status = role === "CANDIDATE" ? "APPROVED" : "PENDING";

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        status,
      },
    });

    return res.json({
      success: true,
      message:
        role === "CANDIDATE"
          ? "Account created successfully"
          : "Account created. Waiting for admin approval.",
      user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
});

export default router;
