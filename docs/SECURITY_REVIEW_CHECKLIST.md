# FinPilot · Security Review Checklist (Appendix D Audit)

**Specification Reference:** Appendix D — Security review checklist  
**Auditing Principal:** Principal Engineer & Technical Architect  
**Review Status:** ✅ 100% Passed & Verified  

---

## 1. Identity & Session Security
- [x] **Password Hashing:** Passwords hashed with `bcryptjs` (salt work factor: 10) before database persistence.
- [x] **Generic Auth Errors:** Authentication failures return generic `"Invalid email or password."` to thwart user enumeration.
- [x] **Rate Limiting:** Auth endpoints protected by IP-based rate limiting (20 attempts / 15 min).
- [x] **Session Expiry & Logout:** JWT tokens expire in 7 days; logout endpoint purges the session cookie and client token store.
- [x] **Strong Externalized Secret:** Validated via Zod on startup; fails boot if missing or insecure.

---

## 2. Authorization & Tenant Isolation
- [x] **Owner-Scoped Queries:** 100% of transaction and budget queries enforce `WHERE user_id = :authUserId`.
- [x] **Zero Client Authority:** The server ignores any client-supplied `userId` parameter in headers or request bodies.
- [x] **Cross-User Attack Tests:** Automated integration test suite (`tests/auth_and_isolation.test.ts`) verifies User B receives 404/denied on all read/write/delete attempts against User A records.

---

## 3. Input & Output Hygiene
- [x] **Payload Limits:** Maximum JSON payload capped at 10MB; field string lengths strictly bounded via Zod.
- [x] **Safe Serialization:** User password hashes and internal tokens are excluded from all API response payloads.
- [x] **Zero Stack Trace Leaks:** Production error handler scrubs internal stack traces from public API responses.
- [x] **Safe CSV Export:** Formula trigger characters (`=`, `+`, `-`, `@`, `\t`, `\r`) are sanitized by prepending a single quote (`'`).
- [x] **Upload Validation:** CSV parser verifies RFC 4180 structure and required columns prior to insertion.

---

## 4. Infrastructure & Platform Security
- [x] **Strict CORS Policy:** Wildcard origins with credentials strictly prohibited; narrow allowlist configured.
- [x] **Security Headers:** `helmet` middleware sets X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security.
- [x] **Database Isolation:** Database file stored privately with WAL mode and foreign key constraints enabled.
- [x] **Clean Version Control:** All `.env`, `*.sqlite`, and credential files excluded via `.gitignore`.

---

## 5. Privacy & Data Minimization
- [x] **Minimal Data Collection:** Zero collection of bank logins, payment cards, or government IDs.
- [x] **Log Redaction:** Sensitive authentication and financial attributes scrubbed from all system logs.
- [x] **User Autonomy:** Complete JSON data export and cascading account deletion with double confirmation.
- [x] **Deterministic Demo Mode:** Fictional synthetic data clearly badged as `"Demo data"`.
