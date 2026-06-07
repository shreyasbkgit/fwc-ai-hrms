import axios from "axios";
import Groq from "groq-sdk";

const pdfParse = require("pdf-parse-fork");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

type ScreeningResult = {
  score: number;
  summary: string;
};

export async function screenResume(
  resumeUrl: string,
  job: {
    title: string;
    description: string;
    skillsRequired: string;
    experienceRequired: string;
  },
): Promise<ScreeningResult> {
  try {
    console.log("Starting AI screening...");

    /* ------------------------
       Download Resume PDF
    ------------------------ */

    const pdfResponse = await axios.get(resumeUrl, {
      responseType: "arraybuffer",
    });

    const buffer = Buffer.from(pdfResponse.data);

    /* ------------------------
       Extract Resume Text
    ------------------------ */

    const pdfData = await pdfParse(buffer);

    const resumeText = pdfData.text?.trim().slice(0, 12000);

    if (!resumeText) {
      throw new Error("Resume text empty");
    }

    console.log("Resume extracted");

    /* ------------------------
       ATS Prompt
    ------------------------ */

    const prompt = `
You are an ATS (Applicant Tracking System).

Evaluate how well the resume matches the job.

Scoring Criteria:
- Required skills match
- Relevant experience
- Education relevance
- Overall job fit

JOB TITLE:
${job.title}

JOB DESCRIPTION:
${job.description}

REQUIRED SKILLS:
${job.skillsRequired}

EXPERIENCE REQUIRED:
${job.experienceRequired}

RESUME:
${resumeText}

IMPORTANT RULES:

1. Return ONLY valid JSON
2. No markdown
3. No explanations
4. No extra text

Format:

{
  "score": 84,
  "summary": "Strong React and TypeScript fit. Missing AWS experience."
}

Score must be between 0 and 100.
`;

    /* ------------------------
       Groq Call
    ------------------------ */

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",

      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],

      temperature: 0.1,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No AI response");
    }

    console.log("Raw AI response:", content);

    /* ------------------------
       Clean JSON
    ------------------------ */

    const cleanContent = content.trim().replace(/```json|```/g, "");

    let parsed;

    try {
      parsed = JSON.parse(cleanContent);
    } catch {
      throw new Error("Invalid JSON from AI");
    }

    /* ------------------------
       Final Result
    ------------------------ */

    const result = {
      score: Number(parsed.score) || 0,

      summary: parsed.summary || "No summary generated",
    };

    console.log("AI Result:", result);

    return result;
  } catch (error) {
    console.error("AI Screening Error:", error);

    return {
      score: 50,
      summary: "AI screening unavailable",
    };
  }
}
