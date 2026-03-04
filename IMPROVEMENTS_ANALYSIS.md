# HPMS – System analysis and improvement suggestions

This document summarizes findings from a codebase review and suggests concrete improvements for security, reliability, UX, and maintainability.

---

## 1. Security

### 1.1 Login / auth

| Area | Current state | Recommendation |
|------|----------------|----------------|
| **Rate limiting** | No rate limiting on `/auth/login` or `/auth/mfa`. | Add rate limiting (e.g. `express-rate-limit`) for login and MFA endpoints to reduce brute-force and credential stuffing risk. |
| **MFA when disabled** | When `MFA_REQUIRED=false`, tokens are issued with `mfa: true` so they pass `authenticate`. | Already correct; no change needed. |
| **JWT storage** | Token stored in `localStorage` (`hpms_admin_token`). | Prefer `httpOnly` cookies for the token so XSS cannot steal it. If you keep localStorage, ensure no sensitive data is rendered from unsanitized input. |

### 1.2 Backend

| Area | Current state | Recommendation |
|------|----------------|----------------|
| **Role checks** | Some routes use inline role checks (e.g. `req.user.role !== ROLES.FINANCE_OFFICER`). | Use `requireRole([...])` middleware consistently so permission logic lives in one place and is easier to audit. |
| **Validation errors** | Controllers use Zod (`schema.parse(req.body)`). Zod errors are not mapped in the global error handler. | In the global error handler, detect Zod errors (`err.name === 'ZodError'`) and respond with **400** and a sanitized list of field errors (e.g. `err.errors` or `err.flatten()`). Otherwise validation failures can surface as 500 and hide messages in production. |

---

## 2. API and frontend integration

### 2.1 Auth token on requests

| Area | Current state | Recommendation |
|------|----------------|----------------|
| **Token passing** | Every call passes `{ token }` from `useAuth()` (e.g. `apiClient.get('/path', { token })`). | Add a single place that attaches the token (e.g. wrapper around `apiClient` that reads from AuthContext, or an interceptor). Then pages call `api.get('/path')` and 401 handling can be centralized. |

### 2.2 401 handling

| Area | Current state | Recommendation |
|------|----------------|----------------|
| **Session expiry** | ProtectedRoute only checks `isAuthenticated` (token presence). If the token is expired, API calls return 401 but there is no global handler. | In the API client (or a wrapper), on **401** clear token, clear user, redirect to `/login`, and optionally show a “Session expired” message. That way any expired or invalid token is handled in one place. |

---

## 3. Configuration and ops

### 3.1 Environment and docs

| Area | Current state | Recommendation |
|------|----------------|----------------|
| **Root `.env.example`** | Uses old names (`DB_NAME`, `DB_USER`, `BACKEND_PORT`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY`, `EMAIL_*`). | Align with `backend/src/config/env.js`: e.g. `DATABASE_URL`, `PORT`, `JWT_SECRET`, `ENCRYPTION_MASTER_KEY`, `SMTP_*`, etc. So new devs copy one file and get the right variables. |
| **Backend `.env.example`** | Not present in backend folder. | Add `backend/.env.example` with all vars used by `env.js` (and optional ones) so setup is documented next to the code. |

### 3.2 Database

| Area | Current state | Recommendation |
|------|----------------|----------------|
| **Migrations** | Migrations exist; restore flow is documented (e.g. RESTORE_LATEST.md, SHARED_DATABASE_SETUP.md). | Keep a single “source of truth” migration list (e.g. in QUICK_START or SETUP_GUIDE) so new clones know the order to run. |
| **Postgres version** | Co-dev uses Postgres 17; you use 17 for restore. | Document in SETUP or README that the app targets Postgres 15+ (or 17 if you rely on 17-only features) to avoid version mismatches. |

---

## 4. Testing

| Area | Current state | Recommendation |
|------|----------------|----------------|
| **Backend** | `npm run test` runs Jest; there are ad‑hoc scripts (`test-paye.js`, `test-encryption.js`, etc.) but no structured test suite in a `tests/` or `__tests__/` directory. | Add a small suite of integration tests (e.g. Jest + supertest) for critical paths: login (and optional MFA), `/auth/me`, one protected route, and one payroll/batch endpoint. That guards against regressions when changing auth or validation. |
| **Frontend** | No frontend test runner or tests found. | Optional: add Vitest (or React Testing Library) and test at least login flow and one protected page (e.g. dashboard loading). |
| **E2E** | No E2E mentioned. | Optional: later add one E2E flow (e.g. Playwright) for “login → open dashboard → run payroll” to catch full-stack breakage. |

---

## 5. Error handling and logging

| Area | Current state | Recommendation |
|------|----------------|----------------|
| **Zod in error handler** | Unhandled Zod errors end up as 500 and in production with a generic message. | In `errorHandler.js`, if `err.name === 'ZodError'`, set status 400 and body from `err.flatten()` or a safe subset of `err.errors`. |
| **Correlation ID** | `req.id` / correlationId are used in logs and responses. | Ensure `req.id` is set early (e.g. in requestLogger or first middleware) for every request so all logs and error responses can be correlated. |
| **Client errors** | 4xx are logged with `logger.warn`. | Consider not logging full request bodies on 4xx to avoid leaking credentials in logs; keep correlationId and path. |

---

## 6. Frontend UX and consistency

| Area | Current state | Recommendation |
|------|----------------|----------------|
| **Loading states** | Dashboard and others use local `loading` state. | Reuse a small set of patterns (e.g. skeleton screens or a shared `<PageLoading />`) so loading UX is consistent. |
| **Error states** | Pages handle errors locally (e.g. set error state, show message). | Add a simple global or layout-level error boundary for React errors, and optionally a toast or banner for API errors so the user always gets feedback. |
| **Empty states** | Dashboard has empty states for expiring contracts and recent activity. | Apply the same idea to other list views (employees, contracts, batches) so empty data shows a clear message and optional CTA instead of a blank table. |
| **Language** | LanguageContext exists; some copy may still be hardcoded. | Audit remaining strings and move them into the language context so EN/Kinyarwanda (or future locales) are complete. |

---

## 7. Code quality and maintainability

| Area | Current state | Recommendation |
|------|----------------|----------------|
| **Validation** | Zod is used in many controllers with good schemas. | Extract shared schemas (e.g. pagination, date range, ids) into a `schemas/` or `validators/` module to avoid duplication and keep validation consistent. |
| **Role permissions** | `roles.js` has `ROLE_PERMISSIONS`, `hasPermission`, `getRolesForAction`. | Use these helpers in both backend (middleware or controller) and frontend (route visibility, button visibility) so permission changes are in one place. |
| **API client** | Single `api/client.js` with `apiClient.get/post/put/patch/delete`. | Optional: add a thin layer that injects token and handles 401 (see 2.1 and 2.2) so pages do not repeat token and logout logic. |

---

## 8. Summary – quick wins

1. **Error handler**: Map Zod errors to 400 and a structured body.
2. **Rate limiting**: Add rate limit middleware for `/auth/login` and `/auth/mfa`.
3. **401 handling**: In the API layer, on 401 clear auth and redirect to login (and optionally show “Session expired”).
4. **Env docs**: Align root `.env.example` with backend config; add `backend/.env.example`.
5. **Tests**: Add a few Jest+supertest tests for auth and one payroll/batch flow.

These give the largest benefit for relatively small changes. The rest of the items above can be scheduled as follow-up improvements.
