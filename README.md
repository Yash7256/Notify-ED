# Notify-ED — Instant multi-channel grade notifications

A full-stack system that uploads semester rosters, captures marks, and notifies students via Email, WhatsApp, and in-app feeds—backed by Supabase.

---

## Overview
Notify-ED is built for faculty and academic admins who need to publish marks quickly and reliably. Professors upload an Excel roster, enter marks, and the app pushes email + WhatsApp alerts while logging delivery status in Supabase. A lightweight in-app notification feed is included for student portals.

---

## Features
- Excel roster upload with email/phone parsing and duplicate-safe upsert to Supabase.
- Marks entry with validation and automatic session tracking.
- Multi-channel notifications: SMTP or custom webhook for email, WATI or webhook for WhatsApp, plus in-app notifications table.
- Delivery logging with retry support.
- Supabase schema and policies for students, subjects, marks, and notifications.
- Dark, editorial homepage and dashboard built with React, Vite, Tailwind, and shadcn/ui.
- Ready for Vercel serverless deployment (frontend + backend projects split by root dir).

---

## Tech Stack
**Frontend:** React 19, Vite, TypeScript, Tailwind CSS, shadcn/ui, React Router, Zustand, React Hook Form, Zod  
**Backend:** Node.js (Express), serverless-http (Vercel), Supabase JS client, Nodemailer, CORS, body-parser, dotenv  
**Database:** Supabase Postgres (see `migration.sql`)  
**Infra/Deploy:** Vercel (two projects: `frontend/` and `backend/`)  
**Data ingest:** Excel via `xlsx`  

---

## Project Structure
```
.
├─ frontend/          # Vite + React app (UI, forms, routing)
│  ├─ src/
│  │  ├─ pages/       # Home hero, Dashboard, History
│  │  ├─ components/  # Layout, UI atoms (shadcn), upload/marks tables
│  │  ├─ lib/         # API client, supabase client
│  │  ├─ store/       # Zustand store for session/marks
│  │  └─ index.css    # Tailwind tokens + fonts + grain overlay
├─ backend/           # Express API wrapped for Vercel
│  ├─ src/index.js    # App bootstrap, health routes, mounts routers
│  ├─ src/routes/     # marks.js, session.js (core endpoints)
│  ├─ src/services/   # supabase client, notifications, in-app service
│  └─ src/utils/      # validation and mark ranges
├─ migration.sql      # Supabase schema & RLS policies
├─ seed.sql           # (empty placeholder)
├─ storage-policy.sql # Storage policies (not detailed here)
├─ assets/            # Shared assets (logo, etc.)
├─ next-app/          # Scratch/unused Vite app (ignored in deploys)
└─ README.md          # You are here
```

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- Supabase project (for Postgres + storage)
- SMTP credentials **or** custom email webhook
- WhatsApp provider: WATI keys **or** custom webhook

### Install
```bash
# Backend
cd backend
npm install
cp .env.example .env   # fill in required values

# Frontend
cd ../frontend
npm install
cp .env.example .env   # set Supabase anon + API base URL
```

### Run locally
```bash
# Terminal 1 - backend
cd backend
npm run dev            # default http://localhost:4000

# Terminal 2 - frontend
cd frontend
npm run dev            # default http://localhost:5173
```
If `VITE_API_BASE` is unset, the frontend falls back to the current origin (helpful in production). Locally, set `VITE_API_BASE=http://localhost:4000`.

---

## Environment Configuration

### Backend `.env`
| Variable | Description | Required | Default |
| --- | --- | --- | --- |
| SUPABASE_URL | Supabase project URL | Yes | — |
| SUPABASE_SERVICE_KEY | Supabase service-role key | Yes | — |
| WATI_API_KEY | WATI API key (if using WATI) | Optional | — |
| WATI_INSTANCE_ID | WATI instance id | Optional | — |
| WATI_TEMPLATE_NAME | WATI template name | Optional | marks_update |
| WATI_BROADCAST_NAME | WATI broadcast name | Optional | Marks Update |
| WATI_TEMPLATE_LANGUAGE | Template language | Optional | en |
| COLLEGE_NAME | Branding in messages | Optional | — |
| CUSTOM_EMAIL_WEBHOOK_URL | Alternative email provider endpoint | Optional | — |
| CUSTOM_EMAIL_WEBHOOK_TOKEN | Bearer token for custom email webhook | Optional | — |
| CUSTOM_WHATSAPP_WEBHOOK_URL | Alternative WhatsApp provider endpoint | Optional | — |
| CUSTOM_WHATSAPP_WEBHOOK_TOKEN | Bearer token for WhatsApp webhook | Optional | — |
| PORT | Express port | Optional | 4000 |
| SMTP_HOST | SMTP host | Optional (if webhook used) | — |
| SMTP_USER | SMTP username | Optional | — |
| SMTP_PASS | SMTP password/app password | Optional | — |
| FROM | From header for email | Optional | `NotifyED <no-reply@notifyed.local>` |

### Frontend `.env`
| Variable | Description | Required | Default |
| --- | --- | --- | --- |
| VITE_SUPABASE_URL | Supabase URL for client | Yes | — |
| VITE_SUPABASE_ANON_KEY | Supabase anon key | Yes | — |
| VITE_API_BASE | Backend base URL | Optional | `http://localhost:4000` (dev) |

---

## Available Scripts

### Backend (from `backend/`)
| Script | Description |
| --- | --- |
| `npm start` | Run Express server (prod) |
| `npm run dev` | Start with nodemon for live reload |

### Frontend (from `frontend/`)
| Script | Description |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check then build for production |
| `npm run preview` | Preview built app |
| `npm run lint` | ESLint |

---

## Application Flow

### Backend
- **Entry:** `src/index.js` configures Express, CORS, parsers, `/health` and `/` pings, mounts:
  - `POST /api/session/create` (`routes/session.js`):  
    - Validates semester/department/academicYear & students list.  
    - Upserts students into `students` via Supabase, creates a `marks_sessions` row, and returns session metadata plus prepared student rows.
  - `POST /api/marks/submit` (`routes/marks.js`):  
    - Validates marks payload (ranges from `utils/validation`).  
    - Upserts marks (by session_id, student_id, subject_id).  
    - Fetches students/subjects, composes messages, sends notifications (email, WhatsApp, in-app) and logs results in `notification_logs`.
  - `POST /api/marks/resend-failed`: retries failed notification log entries.
- **Services:**  
  - `services/supabaseClient.js` creates Supabase service client.  
  - `services/notifications.js` handles email (SMTP or webhook) and WhatsApp (WATI or webhook).  
  - `services/inAppNotificationService.js` writes in-app notifications with retry.
- **Data Model:** see `migration.sql` (students, semester_subjects, marks_sessions, marks, notification_logs, in_app_notifications) with RLS enabled for authenticated role.

### Frontend
- **Entry:** `src/main.tsx` → `App.tsx` (React Router).  
- **Routes:** `Layout` with transparent/dark nav; routes for `/` (Home hero), `/dashboard`, `/history`.  
- **Key screens:**  
  - `Home.tsx`: marketing hero.  
  - `Dashboard.tsx`: session setup + marks entry.  
  - `History.tsx`: reads `notification_logs` via Supabase realtime feed.  
- **State:** `zustand` store (`useDashboardStore`) keeps session info and submitted rows.  
- **API client:** `src/lib/api.ts` calls backend `/api/session/create` and `/api/marks/submit`; falls back to Supabase queries in dev.  
- **Styling:** Tailwind + shadcn/ui components; fonts Fraunces & Space Mono; grain overlay.

---

## API Reference (backend)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Health check JSON |
| GET | `/` | Lightweight status JSON |
| POST | `/api/session/create` | Create a marks session from roster upload (upserts students, returns session + subjects) |
| POST | `/api/marks/submit` | Upsert marks and send notifications |
| POST | `/api/marks/resend-failed` | Retry failed notification logs |

### Example: Create Session
```bash
curl -X POST $API_BASE/api/session/create \
  -H "Content-Type: application/json" \
  -d '{
    "semester": 6,
    "department": "AI & Robotics",
    "academicYear": "2025-26",
    "students": [
      {"name": "Aman Raj", "enrollmentNo": "0206RA231010", "email": "a@b.com", "phone": "9000000000"}
    ]
  }'
```
Returns `{ sessionId, excelUrl, subjects: [...], studentsWithMarks: [...] }`.

### Example: Submit Marks
```bash
curl -X POST $API_BASE/api/marks/submit \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "<session-uuid>",
    "submittedBy": null,
    "marks": [
      {"studentId": "<uuid>", "subjectId": "<subject-uuid>", "midTerm": 25, "endTerm": 40, "assignment": 18, "attendance": 92}
    ]
  }'
```

---

## Database Models (Supabase)
- **students**: id, enrollment_no (unique), name, email, phone, department, batch, created_at  
- **semester_subjects**: subject_code, subject_name, semester, department, credit  
- **marks_sessions**: semester, department, academic_year, excel_file_url, created_by, created_at  
- **marks**: session_id, student_id, subject_id, mid_term, end_term, assignment, attendance, total (generated), submitted_at, unique (session_id, student_id, subject_id)  
- **notification_logs**: student_id, marks_id, channel (email/whatsapp), status (sent/failed/pending), error_message, sent_at  
- **in_app_notifications**: student_id, subject_id, title, body, metadata, seen, created_at  
Row Level Security is enabled on all tables with authenticated-access policies (see `migration.sql`).

---

## Deployment

### Vercel (recommended)
Create **two** Vercel projects from this repo:
- **Frontend:** Root Directory `frontend`; build `npm run build`; output `dist`.
- **Backend:** Root Directory `backend`; build `npm install && npm run build` (or none if using serverless); routes handled by `vercel.json` + `api/index.js`.

Set env vars as per tables above in each project. `.vercelignore` files already prevent cross-bundling (also ignores `next-app/`). After deleting old deployments, redeploy with correct root dirs to avoid frontend/backend swap.

> ⚠️ Needs clarification: No license file present; confirm intended license before public release.

---

## Usage

- Dev: `npm run dev` in both `backend/` and `frontend/`.
- Prod build (frontend): `npm run build` then `npm run preview`.
- Backend serverless on Vercel is auto-wrapped by `api/index.js`; `/health` should respond immediately.

---

## Contributing
1) Fork & clone, create a feature branch.  
2) For frontend changes: `npm run lint && npm run build`.  
   For backend changes: ensure Node 18+, run `npm run dev` and exercise API.  
3) Open a PR with a concise description and testing notes.

Coding style: TypeScript + ESLint on frontend; Node/Express on backend with simple module structure.

---

## Author / Team
- Repository owner: `Yash7256/Notify-ED` (contributors not enumerated here).

---

Badges and license are omitted until clarified.
