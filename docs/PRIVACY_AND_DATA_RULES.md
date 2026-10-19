# FinPilot · Privacy & Responsible Financial UX Rules

**Specification Chapter:** 19 — Privacy and responsible financial UX  
**Owning Engineer:** Engineer 1 & Engineer 3  
**Status:** Approved & Implemented  

---

## 1. Data Minimization Standard
FinPilot strictly collects only data essential for cash flow calculation and budgeting:
- **Never Requested or Collected:**
  - Online banking login credentials (usernames, passwords, MFA seeds)
  - Government identification numbers (SSN, National ID, Passport)
  - Payment card numbers (PAN, CVV, PIN)
  - Physical home addresses or geolocation tracking
- **Synthetic Data Usage:**
  - Development environments, screenshots, automated tests, and live portfolio demonstrations exclusively use synthetic fictional records labeled `"Demo data"`.

---

## 2. System Log Hygiene
- Passwords, authorization tokens, session cookies, and full transaction descriptions are never logged in plaintext.
- The structured logging layer (`src/middleware/logger.ts`) executes automatic recursive redaction across all request bodies and query parameters.
- Production error monitoring payloads scrub financial values to prevent unintended balance leakage.

---

## 3. Financial Insights & Responsible Communication
- **Objective Framing:** Spending insights compare the selected calendar month against a 3-month historical baseline (e.g. *"Dining spend is $85 higher than your 3-month average of $320.00"*).
- **Non-Judgmental UX:** Insights NEVER label user spending behavior as "wasteful", "irresponsible", "reckless", or "fraudulent".
- **User Agency:** Users retain full control to dismiss any generated insight and inspect the exact source transactions behind the calculation.

---

## 4. User Autonomy & Account Deletion Policy
- **Complete Data Export:** Users can download an uncompressed, complete JSON archive of their user profile, transaction history, and budget configurations at any time via `/api/user/export`.
- **Permanent Account Wipe:** Users can delete their account via `/api/user/account` with an explicit keyword confirmation (`DELETE`).
  - **Cascading Effects:** Cascades immediately and permanently to delete all associated records in `transactions`, `budgets`, `insight_dismissals`, and `audit_logs`.
  - **Backup Transparency:** As required by Chapter 19, we document that records deleted from active databases will age out of cold immutable disaster recovery backups within 30 days per retention policy.
