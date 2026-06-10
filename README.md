# FWC AI-HRMS
Demo Link:https://drive.google.com/file/d/1kYstceYP6AZjAftoGHNVScuc6GyEgsAI/view?usp=sharing
An AI-powered Human Resource Management System built for the FWC IT Services hackathon. Automates resume screening, AI interview evaluation, attendance tracking, and role-based dashboards.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, React Router
- **Backend:** Node.js, Express 5, TypeScript, Prisma, SQLite
- **AI:** Groq (Llama 3.1-8b-instant) — resume screening + interview evaluation
- **Storage:** Cloudinary — PDF resume uploads

---

## Prerequisites

- Node.js 18+
- A [Groq API key](https://console.groq.com)
- A [Cloudinary account](https://cloudinary.com) (free tier works)

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/shreyasbkgit/fwc-ai-hrms.git
cd fwc-ai-hrms/hrms
```

### 2. Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```
GROQ_API_KEY=your_groq_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
DATABASE_URL=file:./prisma/dev.db
PORT=5000
```

Apply the database migrations:

```bash
npx prisma migrate deploy
```

Seed the database with demo users and sample jobs:

```bash
npm run seed
```

> Seeding calls Groq to generate interview questions — make sure your API key is set first.

Start the backend:

```bash
npm run dev
```

Backend runs on `http://localhost:5000`

---

### 3. Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and proxies all `/api/*` requests to the backend.

---

## Demo Accounts

All accounts use the password: **`password123`**

| Role | Email |
|---|---|
| Admin | admin@gmail.com |
| HR | hr@gmail.com |
| Employee | employee@gmail.com |
| Candidate | candidate@gmail.com |

---

## Role Workflows

**Candidate** — Register → Browse jobs → Upload resume (AI screened) → If score ≥ 80, take AI interview → Get HIRE/REVIEW/REJECT decision

**HR** — Login → Post jobs (AI generates interview questions) → View applicants with AI scores → View employee attendance

**Admin** — Approve or reject pending HR/Admin registrations

**Employee** — Clock in and clock out daily; attendance visible to HR

---

## Production Build

To run as a single server (backend serves the built frontend):

```bash
# In frontend/
npm run build

# In backend/
npm run dev
```

Visit `http://localhost:5000`

---

## Project Structure

```
hrms/
├── backend/
│   ├── prisma/          # Schema, migrations, seed, SQLite DB
│   ├── src/
│   │   ├── routes/      # auth, jobs, admin, interview, attendance
│   │   └── services/    # AI screening, interview question generation
│   └── .env             # Your API keys (not committed)
└── frontend/
    └── src/pages/       # One page + CSS file per role
```
