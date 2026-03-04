# HPMS – Human Payroll Management System (Detailed Overview)

This document describes the **HPMS** system in detail: what it is, how it works, and how it is built. It is intended for technical review, onboarding, or handover.

---

## 1. What is HPMS?

**HPMS (Human Payroll Management System)** is a **Rwanda-focused payroll and HR platform** built for **HC Solutions**. It provides:

- **Payroll computation** – Salaries with Rwandan tax and social contributions (PAYE, RSSB, RAMA, CBHI).
- **Multi-level approval** – Finance Officer → HR → Managing Director before payroll is “sent to bank”.
- **Employee and contract management** – Employees, contracts, contract templates.
- **Payslips** – PDF generation and email delivery, with sensitive data encrypted at rest.
- **Audit and notifications** – Full approval history and in-app notifications for each role.
- **Public marketing site** – Landing page with hero section and “How it works” (then login into the app).

The system is **RSSB-compliant** and **audit-ready**, with role-based access, MFA (optional/required), and encryption for sensitive salary fields.

---

## 2. Technology Stack

| Layer        | Technology |
|-------------|------------|
| **Frontend** | React 19, Vite 7, React Router 7, Lucide React (icons), Recharts (charts), Framer Motion, Lottie |
| **Backend**  | Node.js, Express |
| **Database** | PostgreSQL (schema `hpms_core`) |
| **Auth**     | JWT (secret or RS256 keys), optional MFA (TOTP) |
| **Security** | Encryption at rest for salary-related fields (AES), env-based keys |
| **Email**    | Configurable SMTP (Nodemailer) for payslips and test emails |
| **SMS**      | Optional (e.g. Africa’s Talking) via env |

---

## 3. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Browser                                                                 │
│  ├── Public:  /  (Landing: Hero + How it works + Features)              │
│  ├── Public:  /login  (Sign in, MFA step if enabled)                     │
│  └── Protected (ShellLayout + Sidebar):                                  │
│        /dashboard, /employees, /payroll-run, /hr-review, /md-approval,  │
│        /contracts, /contract-templates, /reports, /bulk-upload,          │
│        /my-batches, /email-settings, /settings                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP/REST (Bearer JWT)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Backend (Express)  –  /api                                              │
│  ├── /auth           (login, mfa, logout, me, change-password)          │
│  ├── /dashboard/stats                                                    │
│  ├── /employees                                                          │
│  ├── /salaries       (CRUD, reports, HR review, payslip, bulk)           │
│  ├── /payroll-batches (create, pending-hr, pending-md, hr-review,        │
│  │                     md-review, send-to-bank, my-batches, stats)     │
│  ├── /notifications  (list, unread-count, mark read)                    │
│  ├── /contracts      (list, create, expiring, stats)                     │
│  ├── /contract-templates (+ PDF preview/download)                       │
│  └── /email/*        (status, test, preview)                             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  PostgreSQL (hpms_core)                                                  │
│  Core: employees, salaries, payroll_batches, approval_history,          │
│        notifications, contracts, contract_templates, audits              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Roles and Permissions

There are **five roles** (stored in `hpms_core.employees.role`):

| Role                | Purpose |
|---------------------|--------|
| **Admin**           | Full access; can do everything any other role can do. |
| **FinanceOfficer**  | Creates employees/salaries, bulk upload, payroll run, creates batches, submits for approval, sends to bank after full approval. Cannot approve batches or manage MFA. |
| **HR**              | Reviews and approves/rejects payroll (HR step), manages employees, contract templates, MFA (generate/reset), email settings. Cannot send to bank. |
| **ManagingDirector**| Final approval/rejection of batches, authorises payroll; view-focused for financial summary and audit. |
| **Employee**        | Limited to viewing own data (e.g. dashboard/reports as implemented). |

**Permission model** is defined in `backend/src/constants/roles.js` (`ROLE_PERMISSIONS`, `hasPermission`, `getRolesForAction`). Frontend uses the same role (from JWT / `/auth/me`) to show/hide sidebar links and pages (e.g. HR Review, MD Approval).

---

## 5. Multi-Level Approval Workflow

Payroll is paid only after a **three-step** process:

```
  Finance Officer                    HR Manager                 Managing Director
        │                                  │                              │
        │ 1. Create salaries               │                              │
        │ 2. Group into batch              │                              │
        │ 3. Submit batch                  │                              │
        │ ──────────────────────────────► │                              │
        │                                  │ 4. Review (approve/reject)   │
        │                                  │ 5. Add comments             │
        │                                  │ ───────────────────────────► │
        │                                  │                              │ 6. Final approve/reject
        │                                  │                              │ 7. (Optional) PIN confirm
        │                                  │                              │
        │ 8. Send to bank (after MD ok)    │                              │
        │ ◄────────────────────────────────────────────────────────────── │
        │                                  │                              │
        │  Status: SENT_TO_BANK            │                              │
```

**Batch statuses** (in `payroll_batches.status`):

- `PENDING` – Waiting for HR.
- `HR_APPROVED` – Waiting for MD.
- `MD_APPROVED` – Ready to send to bank.
- `REJECTED` – Rejected by HR or MD.
- `SENT_TO_BANK` – Completed.

Each state change is recorded in **approval_history** (who, when, action type, comments, IP, user agent). **Notifications** are created automatically (e.g. HR when batch submitted, MD when HR approves, Finance Officer when HR/MD review).

---

## 6. Payroll Calculation (Rwanda Rules)

Payroll is computed in **backend** (`payrollService.js`, `utils/paye.js`). Logic is **RSSB-compliant** and includes:

**Earnings**

- Basic salary, transport, housing, variable, performance allowances.
- **Gross salary** = basic + allowances.

**PAYE (income tax)** – Progressive brackets (RWF):

- 0–60,000: 0%
- 60,001–100,000: 10%
- 100,001–200,000: 20%
- Above 200,000: 30%

**Employee deductions**

- **RSSB pension**: 6% of gross.
- **RSSB maternity**: 0.3% of basic.
- **RAMA** (medical): 7.5% of basic (can be turned off per calculation).
- **CBHI**: 0.5% of net before CBHI.
- **Advance**: Optional deduction (e.g. salary advance).

**Employer contributions** (stored for cost reporting)

- RSSB employer pension 6%, maternity 0.3%, RAMA 7.5% (if medical included), occupational hazard 2%.

**Net pay** = Gross − PAYE − RSSB (employee) − RAMA − CBHI − Advance.

Sensitive fields (e.g. base salary, allowances, net paid) can be **encrypted at rest**; the backend uses `ENCRYPTION_MASTER_KEY` and decrypts when building payslips or API responses. A **payroll_snapshot** (full breakdown) is stored for each salary record and used for PDF generation.

---

## 7. Main Backend Areas

| Area | Purpose |
|------|--------|
| **Auth** | Login, JWT issue, MFA verify, logout, `/me`, change-password. MFA can be required via env. |
| **Employees** | CRUD, list, search; role stored in DB. |
| **Salaries** | Create (with calculation), list by period/employee, get detail (decrypted), HR approve/reject single or bulk, payslip PDF download, send payslip email. |
| **Bulk salaries** | Excel upload, validate, create many salary records, optional notifications. |
| **Payroll batches** | Create batch from salary IDs, pending-hr / pending-md, hr-review, md-review, send-to-bank, my-batches, stats. |
| **Notifications** | List, unread count, mark read / read-all, delete. |
| **Contracts** | CRUD, list by employee, expiring (e.g. next 14 days), stats. Used by dashboard “Upcoming dates”. |
| **Contract templates** | CRUD, placeholders (e.g. `{{full_name}}`), preview with sample data, PDF download. |
| **Dashboard** | `/dashboard/stats`: employee count, current-month payroll stats, **all-time** chart data (monthly gross/net) for “Payroll at a glance” and trend chart. |
| **Email** | Status, test send, preview (e.g. for payslip body). |

Database schema lives under **hpms_core** (employees, salaries, payroll_batches, approval_history, notifications, contracts, contract_templates, audits, etc.). Migrations are in `backend/migrations/` (e.g. `001_multi_level_approval_system.sql`, contracts, optional columns).

---

## 8. Main Frontend Areas

| Route / area | Purpose |
|--------------|--------|
| **/** | Landing: nav, HeroSection (carousel of feature cards), HowItWorks, feature cards. All use Lucide icons; no backend call. |
| **/login** | Email/password then optional MFA step; redirect by role (e.g. HR → /hr-review, MD → /md-approval, others → /dashboard). |
| **/dashboard** | Stats from `/dashboard/stats`, all-time chart; upcoming from `/contracts/expiring`; recent activity from `/notifications`. No static mock data. |
| **/employees** | List/search employees, link to add/edit. |
| **/employees/new** | Create employee form. |
| **/payroll-run** | Payroll run / batch creation and management (Finance Officer flow). |
| **/hr-review** | HR: individual salary records and payroll batches; approve/reject with comments; send payslip emails. |
| **/md-approval** | MD: list batches pending final approval; approve/reject (optional PIN modal); view summary. |
| **/contracts** | List/filter contracts, create/edit, link to templates. |
| **/contract-templates** | List templates, create/edit, placeholders, live preview, PDF preview. |
| **/reports** | Payroll reports (e.g. monthly), export. |
| **/bulk-upload** | Bulk employee/salary upload (Excel). |
| **/my-batches** | Finance Officer’s batches. |
| **/email-settings** | Configure email (e.g. for payslips). |
| **/settings** | User settings (e.g. change password). |

**ShellLayout** provides the app shell: sidebar (role-based nav), header (title, language, notifications, user, logout), session-expiry warning, and main content area. Layout is full viewport (sidebar flush left, content to right edge). Mobile: hamburger + overlay + drawer sidebar.

---

## 9. Security and Configuration

- **JWT**: Issued after login (and MFA if required). Can be HMAC (JWT_SECRET) or RS256 (public/private key paths). Used as `Authorization: Bearer <token>`.
- **MFA**: TOTP (e.g. Google Authenticator). HR/Admin can generate/reset MFA for users. Config: `MFA_REQUIRED`, `MFA_ISSUER`.
- **Encryption**: `ENCRYPTION_MASTER_KEY` (min 32 chars) for salary-related encrypted columns and payroll snapshot.
- **CORS**: Allowed origins from env (`CORS_ORIGINS`).
- **Database**: Connection via `DATABASE_URL`; optional SSL (`DATABASE_SSL`).

All of this is validated and loaded from **backend/src/config/env.js** (using dotenv and zod).

---

## 10. Key Documentation Files in the Repo

| File | Content |
|------|--------|
| **QUICK_START.md** | Short setup: migration, create users, test workflow. |
| **SETUP_GUIDE.md** | Full setup: migration, test users, API examples, troubleshooting. |
| **BUILD_PROGRESS.md** | What’s built (DB, services, routes) and remaining tasks. |
| **ROLE_PERMISSIONS.md** | HR vs Finance Officer vs Employee permissions. |
| **CHANGES_FOR_REVIEW.md** | Recent changes (layout, dashboard live data, icons, all-time chart) for supervisor review. |
| **backend/EMAIL_SYSTEM_OVERVIEW.md** | Email and payslip sending. |
| **MFA_ENABLE_INSTRUCTIONS.md** | How to enable/use MFA. |

---

## 11. Summary

**HPMS** is a full-stack **Rwanda payroll and approval system**: React + Vite frontend, Express backend, PostgreSQL, with PAYE/RSSB/RAMA/CBHI calculations, three-level approval (Finance Officer → HR → MD), encrypted payslips, contract and template management, and role-based UI and API. The **public site** (hero and other screens) is separate from the **protected app**; the app uses live API data (dashboard, notifications, expiring contracts) and Lucide icons throughout. This document gives your supervisor (or any reviewer) a single place to understand the system in detail.
