# FinPilot · Security Threat Model & Control Verification

**Specification Chapter:** 18 — Security threat model  
**Owning Engineer:** Engineer 1 (Auth, Security & Core Platform Architecture)  
**Status:** Approved & Verified via Automated Integration Tests  

---

## 1. Threat Inventory & Implemented Controls

| Threat Vector | Severity | Vulnerability Mechanism | Implemented Institutional Control | Automated Verification |
| :--- | :--- | :--- | :--- | :--- |
| **Credential Stuffing** | High | Automated brute-force guessing of user passwords across accounts. | `express-rate-limit` enforces strict limits on `/api/auth/login` and `/api/auth/register` (max 20 attempts / 15 min / IP). Generic error messages ("Invalid email or password") prevent user enumeration. | `tests/auth_and_isolation.test.ts` asserts generic error copy on invalid password. |
| **Weak JWT Secrets** | High | Brute-forcing signature keys to forge identity tokens. | Enforced environment configuration using Zod requiring high-entropy secret keys. Default development secret is 64 characters long. | `src/config/index.ts` Zod validation check on server boot. |
| **Token Theft & XSS Leakage** | Critical | Client script exfiltrating session tokens from localStorage. | Dual authentication: HTTP-only, `SameSite=Lax`, `Secure` cookies paired with optional Bearer header for programmatic API testing. | Cookie options configured with `httpOnly: true`. |
| **Broken Object-Level Authorization (BOLA/IDOR)** | Critical | User A substitutes User B's transaction/budget ID into an API request to read, modify, or delete records. | Mandatory tenant-scoped repository pattern (`WHERE id = ? AND user_id = ?`). Authenticated `userId` is extracted strictly from verified JWT claims. | `tests/auth_and_isolation.test.ts` simulates cross-user attack and asserts 404/denied on all operations. |
| **Cross-Site Scripting (XSS)** | High | Reflected or stored script payload in transaction notes. | React automatic output escaping; `helmet` security headers configured with strict Content-Security-Policy. | React JSX automatic escaping; HTML injection safety. |
| **SQL / Command Injection** | Critical | User-supplied strings concatenated directly into SQL queries. | 100% parameterized prepared statements via `better-sqlite3` (`db.prepare('...').run(?, ?)`). Zero dynamic string concatenation. | Architecture audit and automated query suite. |
| **Malicious CSV Formula Injection** | High | Spreadsheet formula execution (`=CMD|' /C calc'!A0`) when opening exported ledger files. | Leading formula trigger characters (`=`, `+`, `-`, `@`, `\t`, `\r`) are sanitized by prepending a single quote (`'`). | `tests/security_csv.test.ts` validates payload neutralization. |
| **Secrets Committed to Git** | Critical | API keys and JWT secrets pushed to public version control. | Comprehensive `.gitignore` excluding all `.env`, `.env.*`, `*.sqlite`, and credential files. | Pre-commit git hygiene verification. |
| **Sensitive Data in System Logs** | High | Error logging exposing passwords, full card numbers, or authorization headers. | Request logger automatically redacts `password`, `token`, `authorization`, `cookie`, `secret`, `card`, `cvv` keys. | `src/middleware/logger.ts` redaction middleware. |
| **Dependency Vulnerabilities** | Medium | Outdated npm packages containing published CVEs. | Pinned package versions with zero high-severity vulnerabilities in core production dependencies. | `npm audit` scanning. |

---

## 2. Security Quality Gates

The FinPilot release pipeline enforces the following strict security gates:
- **Gate 1:** No critical or high-severity vulnerabilities without documented, approved mitigation exceptions.
- **Gate 2:** Zero hardcoded secrets in production source files.
- **Gate 3:** Zero public endpoints returning user-owned financial records without authentication.
- **Gate 4:** No deployment running with permissive wildcard CORS (`Access-Control-Allow-Origin: *`) combined with credentials.

---

## 3. Incident Disclosure & Response Runbook

### Secret Rotation Procedure
1. Generate a new high-entropy 256-bit secret string:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Update the environment variable `JWT_SECRET` in the provider secrets manager.
3. Redeploy the API service. All legacy sessions will be safely invalidated, requiring users to authenticate cleanly.

### Account Compromise Response
1. Terminate active sessions by updating the user's password hash in the database, invalidating existing JWT tokens.
2. Review audit logs for unauthorized record access.
3. Provide full JSON ledger export to the user for reconciliation.

---

## 4. Portfolio Disclosure & Disclaimer

> [!NOTE]
> **Specification Disclosure Requirement (Chapter 18):**  
> This version of FinPilot is an advanced institutional-grade portfolio platform demonstrating enterprise security architecture, tenant isolation, and defensive coding. Formal external penetration testing and regulatory compliance certifications (e.g. SOC 2 Type II, PCI-DSS Level 1) have not been performed for this demonstration release.
