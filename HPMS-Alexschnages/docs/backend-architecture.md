# HC Solutions Payroll — Backend Architecture Plan

## 1. Runtime & Tooling
- **Language**: Node.js 20 LTS
- **Framework**: Express 5.x
- **Package Manager**: npm
- **Containerization**: Docker (multi-stage build, distroless runtime)
- **Testing**: Jest + Supertest
- **Linting**: ESLint (Airbnb base) + Prettier

## 2. Folder Structure
```
backend/
  src/
    server.js            # Express bootstrap
    config/
      env.js             # Environment parsing & validation
      logger.js          # Winston/Pino logger with audit hooks
    middleware/
      cors.js
      requestLogger.js
      authMiddleware.js  # JWT + MFA + RBAC
      errorHandler.js
    services/
      encryptionService.js
      authService.js
      auditService.js
      payrollService.js
      userService.js
    controllers/
      authController.js
      employeeController.js
      salaryController.js
    repositories/
      db.js              # pg Pool wrapper
      employeeRepo.js
      salaryRepo.js
      auditRepo.js
    routes/
      authRoutes.js
      employeeRoutes.js
      salaryRoutes.js
      index.js
    utils/
      crypto.js          # HKDF helpers, random IDs
      paye.js            # Progressive tax calculator (shared with frontend for parity tests)
    jobs/
      keyRotationJob.js
      payrollReportJob.js
  tests/
    integration/
    unit/
  prisma/ or migrations/
Dockerfile
docker-compose.yml (local dev)
```

## 3. Security Flow (SRDS Requirements)
1. **Inbound TLS** terminates at Cloudflare → API Gateway (JWT validation + rate limiting) → Express service.
2. **Audit logging**: every request flows through `requestLogger` which attaches `correlationId`. Controller success/failure is reported to `auditService` before response.
3. **Authentication**
   - `authController.login`: validates credentials → issues short-lived `preMfaToken`.
   - `authController.verifyMfa`: validates TOTP → issues signed JWT (RS256). Token contains `role`, `sessionId`, `mfa=true`.
   - `authMiddleware`: checks Bearer token, validates MFA flag, verifies role (Admin only for payroll endpoints).
4. **Authorization**
   - RBAC matrix stored in config: `Admin` → CRUD employees/salaries; `Employee` → READ self (future self-service).
   - Middleware denies by default, logs `UNAUTHORIZED_ACCESS` to audit table.
5. **Data-at-Rest Encryption**
   - `encryptionService` pulls AES-256 master key from KMS during boot.
   - Provides `encryptField(column, value)` and `decryptField(column, ciphertext)` with per-column IV/HKDF labels.
   - Called by repositories only; controllers never see raw key.
6. **Input Validation**
   - `zod` schemas in controllers to guard payloads (salary inputs, employee creation).
   - Sanitization of string inputs (trim, whitelist).
7. **Error Handling**
   - Central `errorHandler` normalizes responses (no stack traces in prod).
   - Unexpected errors automatically alert via logger → Cloud Monitoring.

## 4. Express Bootstrap (server.js)
```js
import express from 'express';
import helmet from 'helmet';
import cors from './config/cors.js';
import routes from './routes/index.js';
import requestLogger from './middleware/requestLogger.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();
app.use(helmet());
app.use(cors);
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);
app.use('/api', routes);
app.use(errorHandler);

export default app;
```
- `server.js` also wires graceful shutdown + health endpoints `/health/live`, `/health/ready` (used by Kubernetes).

## 5. Controller Responsibilities
### `employeeController`
- `createEmployee`: validate payload → call `employeeService.create` → audit `CREATE_EMPLOYEE`.
- `getEmployeeById`: RBAC check ensures Admin or self.
- `listEmployees`: pagination, optional search (by decrypted name/email?). Use deterministic encryption or search on plain columns only.

### `salaryController`
- `computePayrollPreview`: accepts compensation inputs → reuses `payrollService.calculate` (mirrors frontend logic) for server-side verification.
- `createSalaryRecord`: 
  1. Validate inputs.
  2. Compute statutory deductions (ensures parity with client).
  3. Encrypt sensitive fields.
  4. Insert via repository inside transaction.
  5. Emit audit trail `CREATE_SALARY`.
- `downloadPayslip`: ensures RBAC, decrypts required fields, streams PDF (generated via `pdfmake`).

### `authController`
- `login` & `mfa` flows as described; logs every step (`LOGIN_REQUEST`, `MFA_CHALLENGE`, `ACCESS_GRANTED`).

## 6. Services
- `payrollService.calculate(inputs)` returns same structure as frontend’s `calculatePayroll` (with shared tests). Keeps logic centralized.
- `encryptionService` interface:
  ```js
  export const encrypt = (columnName, plaintext) => { ... };
  export const decrypt = (columnName, ciphertext) => { ... };
  ```
  Maintains internal map of column salts + versions.
- `auditService.log(userId, actionType, details, ip)` inserts into `audit_logs`.

## 7. Middleware Highlights
- `authMiddleware` pipeline:
  1. Extract Bearer token.
  2. Verify signature (public key cached via JWKS).
  3. Ensure `claims.mfa === true`.
  4. Check role vs route metadata (attached via `route.meta.roles`).
  5. Attach `req.user`.
- `requestLogger`: adds `correlationId` header if missing, pushes structured logs.
- `errorHandler`: ensures 4xx/5xx responses follow `{ error: { code, message, correlationId } }`.

## 8. Local Development & Testing
- `docker-compose.yml` brings up PostgreSQL with pgcrypto enabled.
- Seed script creates an `Admin` user with hashed password + MFA secret.
- Integration tests spin up Express server with in-memory pg or test container.
- CI pipeline: lint → unit tests → integration tests → docker build → deploy.

## 9. Deployment & Ops
- Build pipeline produces container signed in Artifact Registry.
- Deploy behind API Gateway (JWT) + Cloudflare (DDoS + SSL termination).
- Use horizontal pod autoscaling triggered by CPU + request latency.
- App logs stream to Cloud Logging with audit entries flagged.

---
This plan satisfies SRDS 2 mandates for security, auditability, and Rwanda payroll compliance while keeping the implementation roadmap clear for subsequent backend development.

