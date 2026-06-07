import express from "express";
import prisma from "../db";

import upload from "../multer";
import cloudinary from "../cloudinary";

import { screenResume } from "../services/aiScreening";

import { generateInterviewQuestions } from "../services/interviewQuestions";

import streamifier from "streamifier";

const router = express.Router();

/* -------------------------
   CREATE JOB
-------------------------- */

router.post("/", async (req, res) => {
  try {
    const {
      title,
      description,
      skillsRequired,
      experienceRequired,
      salaryRange,
      employmentType,
      openings,
      location,
    } = req.body;

    /* Generate Questions */

    const questions = await generateInterviewQuestions({
      title,
      description,
      skillsRequired,
      experienceRequired,
    });

    console.log("Generated Questions:", questions);

    /* Create Job */

    const job = await prisma.job.create({
      data: {
        title,
        description,
        skillsRequired,
        experienceRequired,
        salaryRange,
        employmentType,

        openings: Number(openings),

        location,

        interviewQuestions: JSON.stringify(questions),
      },
    });

    return res.json({
      success: true,
      job,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create job",
    });
  }
});

/* -------------------------
   GET JOBS
-------------------------- */

router.get("/", async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      jobs,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
    });
  }
});

/* -------------------------
   APPLY JOB + RESUME
-------------------------- */

router.post("/apply", upload.single("resume"), async (req, res) => {
  try {
    const { userId, jobId } = req.body;

    /* Check duplicate */

    const existing = await prisma.application.findFirst({
      where: {
        userId,
        jobId,
      },
    });

    if (existing) {
      return res.json({
        success: false,

        message: "Already applied",
      });
    }

    /* Resume required */

    if (!req.file) {
      return res.json({
        success: false,

        message: "Resume PDF required",
      });
    }

    /* Upload Resume */

    const uploadToCloudinary = () =>
      new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: "auto",

            folder: "hrms-resumes",

            public_id: `${userId}_${Date.now()}`,
          },

          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          },
        );

        streamifier.createReadStream(req.file!.buffer).pipe(stream);
      });

    const result = await uploadToCloudinary();

    /* Get Job */

    const job = await prisma.job.findUnique({
      where: {
        id: jobId,
      },
    });

    if (!job) {
      return res.json({
        success: false,

        message: "Job not found",
      });
    }

    /* AI Screening */

    console.log("Starting AI screening...");

    const aiResult = await screenResume(result.secure_url, {
      title: job.title,

      description: job.description,

      skillsRequired: job.skillsRequired,

      experienceRequired: job.experienceRequired,
    });

    console.log("AI Result:", aiResult);

    /* Save Application */

    const application = await prisma.application.create({
      data: {
        userId,
        jobId,

        resumeUrl: result.secure_url,

        aiScore: aiResult.score,

        aiSummary: aiResult.summary,

        status: "UNDER_REVIEW",
      },
    });

    return res.json({
      success: true,

      message: "Applied Successfully",

      application,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* -------------------------
   GET APPLICATIONS
-------------------------- */

router.get("/applications", async (req, res) => {
  try {
    const applications = await prisma.application.findMany({
      include: {
        user: true,

        job: true,
      },

      orderBy: {
        appliedAt: "desc",
      },
    });

    return res.json({
      success: true,
      applications,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

export default router;
