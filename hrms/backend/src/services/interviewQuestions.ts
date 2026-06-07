import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function generateInterviewQuestions(job: {
  title: string;
  description: string;
  skillsRequired: string;
  experienceRequired: string;
}): Promise<string[]> {
  try {
    console.log("Generating interview questions...");

    const prompt = `
You are an expert HR recruiter.

Generate exactly 5 interview questions.

JOB TITLE:
${job.title}

JOB DESCRIPTION:
${job.description}

REQUIRED SKILLS:
${job.skillsRequired}

EXPERIENCE REQUIRED:
${job.experienceRequired}

Rules:
- Questions must match the role
- Start easy then harder
- Include one behavioral question
- Include one project-based question
- Keep questions concise
- Do NOT number questions

Return ONLY valid JSON in this exact format:

{
  "questions": [
    "question1",
    "question2",
    "question3",
    "question4",
    "question5"
  ]
}
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",

      messages: [
        {
          role: "user",

          content: prompt,
        },
      ],

      temperature: 0.4,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No AI response");
    }

    console.log("Raw AI Questions:", content);

    const parsed = JSON.parse(content);

    return parsed.questions ?? [];
  } catch (error) {
    console.error("Question Generation Error:", error);

    /* fallback questions */

    return [
      "Tell me about yourself.",
      "Describe your technical experience.",
      "Tell me about a project you worked on.",
      "How do you solve technical problems?",
      "Why should we hire you?",
    ];
  }
}
