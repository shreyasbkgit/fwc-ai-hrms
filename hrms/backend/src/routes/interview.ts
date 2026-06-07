import express from "express";
import prisma from "../db";
import Groq from "groq-sdk";

const router = express.Router();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/* -------------------------
   GET INTERVIEW QUESTIONS
-------------------------- */

router.get("/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;

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

    let questions: string[] = [];

    try {
      questions = JSON.parse(job.interviewQuestions || "[]");
    } catch {
      questions = job.interviewQuestions?.split("\n").filter(Boolean) || [];
    }

    return res.json({
      success: true,
      questions,
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
   SUBMIT INTERVIEW
-------------------------- */

router.post("/submit", async (req, res) => {
  try {
    const { applicationId, answers } = req.body;

    const application = await prisma.application.findUnique({
      where: {
        id: applicationId,
      },

      include: {
        job: true,
        user: true,
      },
    });

    if (!application) {
      return res.json({
        success: false,
        message: "Application not found",
      });
    }

    let questions: string[] = [];

    try {
      questions = JSON.parse(application.job.interviewQuestions || "[]");
    } catch {
      questions =
        application.job.interviewQuestions?.split("\n").filter(Boolean) || [];
    }

    console.log("Answers:", answers);

    const prompt = `
You are an expert technical interviewer.

Evaluate these interview answers fairly.

Questions:
${JSON.stringify(questions, null, 2)}

Candidate Answers:
${JSON.stringify(answers, null, 2)}

Return ONLY valid JSON:

{
  "score": 0-100,
  "summary": "short summary"
}

Rules:
- score from 0 to 100
- be fair and practical
- partial knowledge should receive partial credit
- do not give 0 unless answers are completely unrelated
- judge technical accuracy
- judge relevance
- summary must mention strengths and weaknesses
- score generously for correct concepts
- do NOT return markdown
- do NOT explain anything outside JSON
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",

      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],

      temperature: 0.2,
    });

    const content = completion.choices[0]?.message?.content;

    console.log("AI Interview Result:", content);

    /* Extract ONLY JSON */

    const jsonMatch = content?.match(/\{[\s\S]*?\}/);

    if (!jsonMatch) {
      throw new Error("No valid JSON found in AI response");
    }

    const cleanedContent = jsonMatch[0];

    console.log("Cleaned Result:", cleanedContent);

    const parsed = JSON.parse(cleanedContent);

    const interviewScore = parsed.score || 0;

    const resumeScore = application.aiScore || 0;

    const finalScore = resumeScore * 0.4 + interviewScore * 0.6;

    let decision = "REJECT";

    if (finalScore >= 75) {
      decision = "HIRE";
    } else if (finalScore >= 55) {
      decision = "REVIEW";
    }

    /* Convert to employee */

    if (decision === "HIRE") {
      await prisma.user.update({
        where: {
          id: application.userId,
        },

        data: {
          role: "EMPLOYEE",

          status: "APPROVED",
        },
      });
    }

    await prisma.application.update({
      where: {
        id: applicationId,
      },

      data: {
        interviewScore,

        interviewSummary: parsed.summary,

        finalScore,

        decision,

        interviewCompleted: true,

        status: decision,
      },
    });

    return res.json({
      success: true,

      interviewScore,

      finalScore,

      decision,

      message:
        decision === "HIRE"
          ? "Congratulations! You are hired."
          : decision === "REVIEW"
            ? "Your profile is under review."
            : "Unfortunately, you were not selected.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Interview failed",
    });
  }
});

export default router;
