# FinPilot · Requirements Traceability Matrix (RTM)

| Req ID | Specification Requirement | Implemented Architecture | Verification Evidence | Status |
| :--- | :--- | :--- | :--- | :--- |
| **REQ-08-01** | Income & Expense Metric Semantics | `calculateNetCashFlow()`, `getMonthlySummary()` | Unit tests in `calculations.test.ts` & live API verification | ✅ Verified |
| **REQ-08-02** | Savings Rate Formula & Zero-Income Edge Case | Formula: $((\text{Income} - \text{Expenses}) / \text{Income}) \times 100\%$. Displays `—` if income $\le 0$. | Unit tests with 0 and negative income in `calculations.test.ts` | ✅ Verified |
| **REQ-08-03** | Category Expense Chart | Sorted deterministically descending; accessible table toggle; empty state illustration. | `CategoryExpenseChart.tsx` | ✅ Verified |
| **REQ-08-04** | Budget Progress & Clamping | Visual bar clamped at 100%; preserves exact negative remaining and "Over budget" status. | `calculateBudgetUtilization()`, `BudgetProgressSection.tsx` | ✅ Verified |
| **REQ-08-05** | Refresh Behavior | `invalidateQueries()` refetches summary, categories, budgets, and transactions on mutations. | `FinancialContext.tsx` mutation triggers | ✅ Verified |
| **REQ-08-06** | Sample Data Policy | Pre-seeded demo account labeled `"Demo data"` badge; zero conflation with real analytics. | `seed.ts`, `AppShell.tsx` amber badge | ✅ Verified |
| **REQ-18-01** | Identity & Password Hashing | `bcryptjs` (work factor 10); rate-limited auth endpoints; generic auth errors. | `tests/auth_and_isolation.test.ts` | ✅ Verified |
| **REQ-18-02** | BOLA / IDOR Defense | 100% of queries owner-scoped (`WHERE user_id = ?`). Zero client-supplied owner authority. | Cross-user attack test in `tests/auth_and_isolation.test.ts` | ✅ Verified |
| **REQ-18-03** | Malicious CSV Injection Defense | Prepend single quote (`'`) to cells starting with `=`, `+`, `-`, `@`, `\t`, `\r`. | `tests/security_csv.test.ts` payload test | ✅ Verified |
| **REQ-19-01** | Financial Data Minimization | No bank credentials, payment cards, or SSNs collected. Synthetic demo data. | Schema audit and `PrivacySettings.tsx` | ✅ Verified |
| **REQ-19-02** | Non-Moralizing Spending Insights | Comparison against 3-month baseline; calm non-judgmental wording; dismissible. | `AnalyticsService.getSpendingInsights()`, `SpendingInsightsCard.tsx` | ✅ Verified |
| **REQ-19-03** | User Autonomy & Account Deletion | Full JSON export and cascading account deletion with keyword confirmation (`DELETE`). | `UserService.deleteAccount()`, integration test | ✅ Verified |
| **REQ-29-01** | Service Topology & CORS | Monorepo with independent frontend and backend; narrow CORS allowlist. | `app.ts` CORS configuration | ✅ Verified |
| **REQ-29-02** | Health Probes & Operations | `/api/health` returning system uptime, database responsiveness, memory RSS. | `tests/auth_and_isolation.test.ts` health test | ✅ Verified |
| **REQ-40-01** | Calm UX Writing & Content Rules | Currency format with 2 decimals; explicit placeholders; actionable error copy. | `UX_WRITING_GUIDELINES.md`, error handlers | ✅ Verified |
