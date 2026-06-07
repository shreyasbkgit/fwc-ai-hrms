# FWC HRMS — Project Context

## What This Is

An AI-powered **Human Resource Management System (HRMS)** built for the FWC IT Services hackathon. Full-stack: React + TypeScript frontend, Node.js + Express + Prisma backend, SQLite database. External integrations: Groq LLM (Llama 3.1-8b-instant) for AI features and Cloudinary for PDF resume storage.

---

## Directory Structure

```
FWC/
└── hrms/
    ├── frontend/               # React + TypeScript SPA
    │   └── src/
    │       ├── main.tsx        # Entry point
    │       ├── App.tsx         # Route definitions
    │       └── pages/          # One file + one CSS file per page
    │           ├── Login.tsx / Login.css
    │           ├── Register.tsx / Register.css
    │           ├── AdminDashboard.tsx / AdminDashboard.css
    │           ├── HRDashboard.tsx / HRDashboard.css
    │           ├── EmployeeDashboard.tsx / EmployeeDashboard.css
    │           ├── CandidateDashboard.tsx / CandidateDashboard.css
    │           └── InterviewPage.tsx / InterviewPage.css
    └── backend/
        ├── src/
        │   ├── server.ts       # Express server + static serving
        │   ├── db.ts           # Prisma client singleton
        │   ├── cloudinary.ts   # Cloudinary config
        │   ├── multer.ts       # Multer memory storage middleware
        │   ├── routes/
        │   │   ├── auth.ts       # Login / register
        │   │   ├── jobs.ts       # Job CRUD + resume upload + apply
        │   │   ├── admin.ts      # User approval / rejection
        │   │   ├── interview.ts  # Questions fetch + answer submission
        │   │   └── attendance.ts # Clock-in / clock-out + HR view
        │   └── services/
        │       ├── aiScreening.ts        # Resume PDF → Groq score
        │       └── interviewQuestions.ts # Job → Groq-generated questions
        └── prisma/
            ├── schema.prisma   # Source of truth for DB schema
            ├── seed.ts         # 4 demo users + 3 jobs
            └── dev.db          # SQLite file
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript 6, Vite 8, React Router 7 |
| Backend | Node.js, Express 5, TypeScript 6 |
| ORM / DB | Prisma 6, SQLite |
| AI | Groq SDK (Llama 3.1-8b-instant) |
| File Storage | Cloudinary (PDF resumes) |
| Auth | bcryptjs (hashing); JWT installed but unused |
| File Upload | Multer (memory storage → Cloudinary stream) |
| PDF Parsing | pdf-parse-fork (12 KB text cap) |

---

## Database Schema

### User
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) PK | |
| name | String | |
| email | String unique | |
| password | String | bcrypt hash |
| role | String | "ADMIN", "HR", "EMPLOYEE", "CANDIDATE" (strings, not enforced enum) |
| status | String | "PENDING", "APPROVED", "REJECTED" — default "APPROVED" |
| createdAt | DateTime | |
| applications | Application[] | relation |
| attendances | Attendance[] | relation |

> Note: A `Role` enum is declared at the bottom of schema.prisma but the `role` field on User is `String`, not `Role`. This is a schema inconsistency — the enum is unused.

### Job
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) PK | |
| title, description | String | |
| skillsRequired | String | comma-separated |
| experienceRequired | String | |
| salaryRange | String | |
| employmentType | String | "Full-Time", "Internship", "Contract" |
| openings | Int | |
| location | String | |
| interviewQuestions | String? | JSON array of 5 AI-generated questions, stored at job creation |
| createdAt | DateTime | |

### Application
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) PK | |
| userId, jobId | String FK | |
| resumeUrl | String? | Cloudinary URL |
| aiScore | Float? | Resume screening score 0–100; **null until screened** |
| aiSummary | String? | AI explanation text |
| interviewScore | Float? | Interview evaluation score 0–100; **null until submitted** |
| interviewSummary | String? | AI explanation |
| finalScore | Float? | Weighted composite; **null until interview done** |
| decision | String? | "HIRE", "REVIEW", "REJECT"; **null until interview done** |
| interviewCompleted | Boolean | default false |
| status | String | default "UNDER_REVIEW" |
| appliedAt | DateTime | |

> **Important:** Prisma Float? fields return `null` in JSON responses, never `undefined`. All null-checks must use `!= null` (loose equality), not `!== undefined`.

### Attendance
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) PK | |
| userId | String FK | |
| date | String | "YYYY-MM-DD" format |
| clockIn | DateTime | |
| clockOut | DateTime? | null while employee is still clocked in |
| user | User | relation |

---

## Role-Based Workflows

### CANDIDATE
1. Register → auto-approved (status = APPROVED immediately)
2. Browse jobs on `CandidateDashboard` — Available Jobs tab
3. Apply → upload PDF resume → Cloudinary upload → AI screening runs synchronously
4. If aiScore ≥ 80: eligible for interview (shown in Interviews tab)
5. Take text interview on `InterviewPage/:applicationId`
6. On HIRE decision: user role promoted from CANDIDATE → EMPLOYEE in DB

### HR
1. Register → awaits ADMIN approval
2. Create job postings on `HRDashboard` Jobs tab → AI generates 5 interview questions at creation
3. View all applicants in Applicants tab — grouped by job, sorted by aiScore desc
4. View employee clock-in/out records in Attendance tab

### ADMIN
1. Approve or reject PENDING users (HR / ADMIN registrations)
2. Dashboard tab shows stats: pending count, active roles, system status

### EMPLOYEE
1. Promoted from CANDIDATE when interview decision is HIRE
2. `EmployeeDashboard`: clock in at start of day, clock out at end
3. Live elapsed-time timer (HH:MM:SS) while clocked in

---

## AI Pipeline

### Resume Screening (`services/aiScreening.ts`)
- Downloads PDF from Cloudinary URL
- Extracts text via pdf-parse-fork (capped at 12 KB)
- Sends to Groq (Llama 3.1-8b-instant) with job description context
- Returns: `score` (0–100) + `summary` string
- Fallback: score of 50 if Groq unavailable

### Interview Question Generation (`services/interviewQuestions.ts`)
- Called when HR creates a job
- Prompt includes job title, description, skills required
- Returns 5 questions stored as JSON string on the Job record
- Mix of easy, behavioral, and project-based questions

### Interview Evaluation (`routes/interview.ts`)
- Candidate submits array of text answers to 5 questions
- Groq evaluates each answer for technical accuracy and relevance
- Returns `interviewScore` (0–100) + `interviewSummary`
- JSON parsed from Groq response using regex `/\{[\s\S]*\}/` (greedy)

### Final Decision Logic
```
finalScore = (aiScore × 0.4) + (interviewScore × 0.6)

HIRE   → finalScore >= 75  → user.role updated to "EMPLOYEE"
REVIEW → 55 <= finalScore < 75
REJECT → finalScore < 55
```
If `aiScore` is null when interview is submitted, it is treated as 0 in the formula.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | /api/auth/login | Authenticate user; returns `{ id, name, email, role }` |
| POST | /api/auth/register | Create account |
| GET | /api/jobs | List all jobs |
| POST | /api/jobs | Create job (HR); triggers AI question generation |
| POST | /api/jobs/apply | Apply with resume upload; triggers AI screening |
| GET | /api/jobs/applications | All applications with user + job info |
| GET | /api/admin/pending-users | List users with status PENDING |
| PATCH | /api/admin/approve/:id | Set user status APPROVED |
| PATCH | /api/admin/reject/:id | Set user status REJECTED |
| GET | /api/interview/:jobId | Fetch interview questions for a job |
| POST | /api/interview/submit | Submit answers; AI evaluates; stores decision |
| GET | /api/attendance/today/:userId | Today's attendance record for an employee |
| POST | /api/attendance/clockin | Create attendance record (blocks duplicate per day) |
| POST | /api/attendance/clockout | Fill clockOut on open record |
| GET | /api/attendance/all | All records with user info (for HR) |

---

## Frontend Routes

| Path | Component | Access |
|---|---|---|
| / | → /login redirect | — |
| /login | Login | Public |
| /register | Register | Public |
| /admin | AdminDashboard | ADMIN |
| /hr | HRDashboard | HR |
| /employee | EmployeeDashboard | EMPLOYEE |
| /candidate | CandidateDashboard | CANDIDATE |
| /interview/:id | InterviewPage | CANDIDATE |

Route protection is client-side via `localStorage` (no JWT middleware on the backend API).

---

## CSS / Styling Architecture

Each page has its own dedicated CSS file (no shared stylesheet, no CSS framework):

- `Login.css` / `Register.css` — split-panel auth layout; blue gradient left panel; responsive single-column at ≤768px
- `AdminDashboard.css` — stats grid (3-col), role badge pills, approve/reject button styles
- `HRDashboard.css` — jobs grid (2-col desktop / 1-col ≤1024px), score bars, attendance table
- `EmployeeDashboard.css` — attendance card, elapsed timer (tabular-nums), green/red clock buttons
- `CandidateDashboard.css` — job cards with tag pills, modal overlay with blur, file upload dashed border
- `InterviewPage.css` — progress bar, question cards, answer textarea

**Mobile responsiveness:** All dashboards use a sidebar that collapses to a horizontal scrollable top nav at `max-width: 768px` via CSS `flex-direction` change — no JS state.

---

## localStorage User Object

Stored at login, cleared at logout:
```json
{ "id": "cuid...", "name": "Alice", "email": "alice@example.com", "role": "HR" }
```

Used by all frontend pages to identify the current user and render role-appropriate UI.

---

## Environment Variables (backend `.env`)

```
GROQ_API_KEY
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
DATABASE_URL          # default: file:./prisma/dev.db
PORT                  # default: 5000
```

---

## Dev Scripts

**Backend** (`hrms/backend/`):
```bash
npm run dev    # ts-node-dev with auto-restart
npm run seed   # seed DB with 3 jobs + 4 demo users
npx prisma migrate dev --name <name>  # apply schema changes + regenerate client
```

**Frontend** (`hrms/frontend/`):
```bash
npm run dev    # Vite dev server (proxies /api/* to backend :5000)
npm run build  # tsc -b && vite build → dist/
npm run lint   # ESLint
```

Backend serves the built frontend from `../frontend/dist` in production.

---

## Known Gaps / Noteworthy Details

- **No JWT API auth**: Sessions stored in `localStorage`; backend routes have no token verification — any request can hit any endpoint.
- **Prisma null vs undefined**: All optional Float? fields return `null` from Prisma, not `undefined`. Always check `!= null` not `!== undefined`.
- **Resume file limit**: PDF only, max 5 MB via Multer; text extraction capped at 12 KB by pdf-parse-fork.
- **Interview re-submission not blocked**: `interviewCompleted` flag is never checked on submit — a candidate could submit answers multiple times.
- **aiScore=null in finalScore**: If resume screening failed and `aiScore` is null, the formula silently uses 0 as its value.
- **Interview format**: Text Q&A only — no audio/video/proctoring.
- **Unused Role enum**: `schema.prisma` declares `enum Role` but the `role` field on User is `String`.
- **Single database file**: SQLite `dev.db` — not suitable for multi-instance deployment.
- **No payroll module**: Not yet implemented (required for full HRMS).
- **No performance tracking**: Not yet implemented (required for full HRMS).
- **No Senior Manager role**: Hackathon JD specifies 4 roles; currently only 4 roles exist but "Senior Manager" maps loosely to ADMIN.
