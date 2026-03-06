# NotifyED Backend

Node.js + Express REST API for sending student marks notifications via email (Resend) and WhatsApp (WATI). Uses Supabase for data storage.

## Quick start
1. `cd backend`
2. Copy env: `cp .env.example .env` and fill values for Supabase, Resend, and WATI.
3. Install deps: `npm install`
4. Run dev server: `npm run dev` (defaults to port 4000)

## Environment variables
- SUPABASE_URL
- SUPABASE_SERVICE_KEY (service-role)
- RESEND_API_KEY
- WATI_API_KEY
- WATI_INSTANCE_ID
- PORT (optional)

## Endpoints
### POST /api/marks/submit
Upserts marks, sends notifications in parallel per student, and logs every attempt.
```json
{
  "subjectId": "uuid-of-subject",
  "submittedBy": "uuid-of-professor",
  "marks": [
    {"studentId": "uuid", "midTerm": 25, "endTerm": 42, "assignment": 18, "attendance": 92}
  ]
}
```
Response: `{ "success": true, "notified": { "email": 1, "whatsapp": 1 }, "failed": [] }`

### POST /api/marks/resend-failed
Retries failed notifications by `notification_logs.id`.
```json
{ "ids": ["uuid-of-notification-log"] }
```
Response: `{ "success": true, "retried": { "email": 1, "whatsapp": 0 }, "failed": [] }`

## Notes
- Marks are validated against configured ranges (midTerm 0-30, endTerm 0-50, assignment 0-20, attendance 0-100).
- Each submission creates a `marks_sessions` row to satisfy schema and ensure referential integrity.
- Notification attempts are logged to `notification_logs` with status `sent` or `failed`.
