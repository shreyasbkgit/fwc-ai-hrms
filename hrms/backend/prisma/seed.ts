import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import { generateInterviewQuestions } from "../src/services/interviewQuestions";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10);

  /* -------------------------
     CLEAR OLD DATA
  -------------------------- */

  await prisma.application.deleteMany();

  await prisma.job.deleteMany();

  /* -------------------------
     USERS
  -------------------------- */

  await prisma.user.upsert({
    where: {
      email: "admin@gmail.com",
    },

    update: {},

    create: {
      name: "Admin",

      email: "admin@gmail.com",

      password: hashedPassword,

      role: "ADMIN",

      status: "APPROVED",
    },
  });

  await prisma.user.upsert({
    where: {
      email: "hr@gmail.com",
    },

    update: {},

    create: {
      name: "HR",

      email: "hr@gmail.com",

      password: hashedPassword,

      role: "HR",

      status: "APPROVED",
    },
  });

  await prisma.user.upsert({
    where: {
      email: "employee@gmail.com",
    },

    update: {},

    create: {
      name: "Employee",

      email: "employee@gmail.com",

      password: hashedPassword,

      role: "EMPLOYEE",

      status: "APPROVED",
    },
  });

  await prisma.user.upsert({
    where: {
      email: "candidate@gmail.com",
    },

    update: {},

    create: {
      name: "Candidate",

      email: "candidate@gmail.com",

      password: hashedPassword,

      role: "CANDIDATE",

      status: "APPROVED",
    },
  });

  /* -------------------------
     SAMPLE JOBS
  -------------------------- */

  const jobs = [
    {
      title: "Software Engineer",

      description:
        "Build scalable React + Node applications for enterprise systems.",

      skillsRequired: "React, Node.js, TypeScript, SQL",

      experienceRequired: "2+ Years",

      salaryRange: "8-12 LPA",

      employmentType: "Full-Time",

      openings: 3,

      location: "Bangalore",
    },

    {
      title: "Frontend Developer",

      description: "Develop modern UI using React and TypeScript.",

      skillsRequired: "React, TypeScript, CSS",

      experienceRequired: "1+ Years",

      salaryRange: "6-9 LPA",

      employmentType: "Full-Time",

      openings: 2,

      location: "Remote",
    },

    {
      title: "AI Intern",

      description: "Assist in LLM and AI automation projects.",

      skillsRequired: "Python, AI/ML, APIs",

      experienceRequired: "Fresher",

      salaryRange: "25k/month",

      employmentType: "Internship",

      openings: 5,

      location: "Bangalore",
    },
  ];

  for (const job of jobs) {
    console.log(`Generating questions for ${job.title}...`);

    const questions = await generateInterviewQuestions({
      title: job.title,

      description: job.description,

      skillsRequired: job.skillsRequired,

      experienceRequired: job.experienceRequired,
    });

    await prisma.job.create({
      data: {
        ...job,

        interviewQuestions: JSON.stringify(questions),
      },
    });

    console.log(`Created ${job.title}`);
  }

  console.log("Database seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
