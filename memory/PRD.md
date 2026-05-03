# AstroVedic AI — PRD

## Original Problem Statement
Add "Apply as Astrologer" feature to AstroVedic AI:
1. Public application form at `/apply-astrologer`
2. Admin can manage applications (list + detail + approve/reject) and view all documents
3. Approved applicants automatically become astrologers
4. Source: github.com/akshitsharmab-spec/aastro-finalnot

## What's Implemented (Feb 2026)
- Backend: `astrologer_applications` MongoDB collection with full schema (id, personal info, professional details, base64 documents, social links, status, admin notes, timestamps).
- Backend endpoints:
  - `POST /api/apply-astrologer` (public, JSON, validates required + agreement + 100-char about)
  - `GET /api/admin/astrologer-applications` (filter/search + counts)
  - `GET /api/admin/astrologer-applications/{id}` (detail)
  - `PATCH /api/admin/astrologer-applications/{id}` (approve/reject + admin notes; on approve auto-creates astrologer)
- Frontend public page `/apply-astrologer` with 5 sections (Personal, Professional, Documents, Social, Agreement), file uploads as base64 (max 5MB docs, 2MB photo), success card with reference ID.
- Admin List page `/admin/astrologer-applications`: stats row, search, status filter, table with photo/quick approve/quick reject.
- Admin Detail modal: personal info + photo, professional pills, About box, **Documents card with View Document links** (Aadhaar masked XXXX XXXX 9012, PAN full, base64 docs open in new tab), social links, sticky Admin Action panel with notes + approve/reject (reject requires reason).
- Sidebar: "Astrologer Applications" menu item with red pending count badge (auto-refreshing every 30s).
- Footer: "Apply as Astrologer" link under "For Professionals".
- Astrologers page: bottom CTA banner linking to apply page.
- Fixed admin login: `akshatsharma7730@gmail.com` / `akshatastro800`.

## E2E Verification (Feb 2026)
- Submitted test application via API → 200 OK, reference ID generated.
- Admin list page → stats, table render correctly.
- Admin detail modal → all sections including Documents (Aadhaar Front/Back, PAN, Profile Photo, Certificate) with View links visible.
- PATCH approve → status updated, astrologer auto-created in `astrologers` collection.

## Test Credentials
See `/app/memory/test_credentials.md`.

## Backlog (P1/P2)
- P1: Email notification on approve/reject (currently in-app only).
- P1: Object Storage migration for documents (currently base64 in Mongo).
- P2: Rate limit + captcha on public submit endpoint.
- P2: Re-apply flow if rejected (currently no client-facing rejection viewer).
