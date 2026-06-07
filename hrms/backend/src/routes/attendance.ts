import express from "express";
import prisma from "../db";

const router = express.Router();

/* GET today's record for an employee */
router.get("/today/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().slice(0, 10);

    const record = await prisma.attendance.findFirst({
      where: { userId, date: today },
    });

    return res.json({ success: true, record });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/* Clock in */
router.post("/clockin", async (req, res) => {
  try {
    const { userId } = req.body;
    const today = new Date().toISOString().slice(0, 10);

    const existing = await prisma.attendance.findFirst({
      where: { userId, date: today },
    });

    if (existing) {
      return res.json({ success: false, message: "Already clocked in today" });
    }

    const record = await prisma.attendance.create({
      data: { userId, date: today, clockIn: new Date() },
    });

    return res.json({ success: true, record });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/* Clock out */
router.post("/clockout", async (req, res) => {
  try {
    const { userId } = req.body;
    const today = new Date().toISOString().slice(0, 10);

    const record = await prisma.attendance.findFirst({
      where: { userId, date: today, clockOut: null },
    });

    if (!record) {
      return res.json({ success: false, message: "No active clock-in found" });
    }

    const updated = await prisma.attendance.update({
      where: { id: record.id },
      data: { clockOut: new Date() },
    });

    return res.json({ success: true, record: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/* All attendance records (for HR) */
router.get("/all", async (req, res) => {
  try {
    const records = await prisma.attendance.findMany({
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { clockIn: "desc" },
    });

    return res.json({ success: true, records });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
