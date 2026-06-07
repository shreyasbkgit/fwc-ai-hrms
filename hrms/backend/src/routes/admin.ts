import express from "express";
import prisma from "../db";

const router = express.Router();

/* -------------------------
   GET PENDING USERS
-------------------------- */

router.get("/pending-users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        status: "PENDING",
      },

      orderBy: {
        createdAt: "desc",
      },

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
});

/* -------------------------
   APPROVE USER
-------------------------- */

router.patch("/approve/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.user.update({
      where: {
        id,
      },

      data: {
        status: "APPROVED",
      },
    });

    return res.json({
      success: true,
      message: "User approved",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Approval failed",
    });
  }
});

/* -------------------------
   REJECT USER
-------------------------- */

router.patch("/reject/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.user.update({
      where: {
        id,
      },

      data: {
        status: "REJECTED",
      },
    });

    return res.json({
      success: true,
      message: "User rejected",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Rejection failed",
    });
  }
});

export default router;
