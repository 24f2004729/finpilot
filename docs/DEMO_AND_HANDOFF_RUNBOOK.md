# FinPilot · Demo & Engineering Handoff Runbook

**Specification Reference:** Appendix E — Demo and handoff checklist  
**Auditing Principal:** Principal Engineer & Technical Architect  
**Audience:** Hiring Managers, Technical Reviewers & Full-Stack Engineers  

---

## 1. Pre-Demo Checklist (Verified)
- [x] **Deterministic Fixtures Seeded:** Demo workspace seeded with 3 months of realistic financial records (August, September, October 2026).
- [x] **Verified Demo Account:** Instant 1-click access via `"Launch Live Demo Workspace"` or `demo@finpilot.dev` credentials.
- [x] **Automated Test Suite Clean:** 32 of 32 tests passing across financial math, formula injection defense, and BOLA cross-user isolation.
- [x] **Clean Screenshots & Presentation:** All secrets excluded; environment variables documented.

---

## 2. Interactive Live Demonstration Script

### Act 1 — The Executive Overview
1. Open the application. Note the clean institutional design tokens (slate-950 background, crisp typography, tabular figures).
2. Point out the prominent amber **`DEMO DATA`** badge adhering to Chapter 08 sample data policies.
3. Review the 4 KPI cards:
   - **Total Income:** $7,900.00
   - **Total Expenses:** $3,695.00
   - **Net Cash Flow:** +$4,205.00 (emerald indicator)
   - **Savings Rate:** 53.2% with explicit formula tooltip: `(Net Cash Flow / Total Income) × 100%`.
4. Point out the **Non-Moralizing Spending Insights**:
   - Explain how FinPilot compares current spending against a 3-month rolling baseline without shaming.
   - Click the **Dismiss (`✕`)** button to demonstrate client-side and persistent dismissal.

### Act 2 — Visual Clamping & Mathematical Integrity
1. Navigate to the **Budget Targets** card.
2. Observe the **Food & Dining** budget:
   - Target limit: $500.00
   - Spent: $700.00 (140.0% utilization)
   - Status badge: `"Over budget"` in rose.
   - Remaining: `-$200.00 over`
   - Notice the visual progress bar is **clamped at 100%** fill, while the actual numeric data remains exact and uncorrupted!
3. Click **Set Budget** and attempt to add another budget for **Food & Dining** in October.
   - Observe the calm, actionable validation feedback:
     *"This category already has a budget for October. Edit the existing budget or choose another category."*

### Act 3 — Ledger Integrity & Query Invalidation
1. Click **New Entry** in the Recent Activity widget.
2. Enter an expense: `$100.00` in **Utilities**.
3. Save the transaction.
4. **Instant Invalidation Verification:** Observe how the Total Expenses card, Net Cash Flow card, Utilities budget bar, and Category breakdown chart update simultaneously without requiring a page refresh!

### Act 4 — Security & Data Sovereignty
1. Navigate to the **Ledger & Transactions** tab.
2. Click **Export CSV**: Observe the downloaded file. Inspect the text to verify that formula trigger characters are escaped with a leading single quote (`'`), eliminating CSV formula injection attacks (CWE-1236).
3. Navigate to **Privacy & Data Control**:
   - Review the data minimization policy (zero bank logins or card numbers collected).
   - Click **Export JSON Archive** to download the portable complete financial history.

---

## 3. Plain Language Architecture Summary
FinPilot is structured as a type-safe TypeScript monorepo:
- **Presentation Layer (`apps/web`):** Built with React 18 and Vite for sub-second hot reload. Uses Tailwind CSS for custom dark-mode fintech components and Lucide icons for visual affordance.
- **Service Layer (`apps/api`):** Built with Node.js 22 and Express. Every endpoint is protected by Helmet, rate limiting, and owner-scoped database prepared statements.
- **Domain Precision (`packages/shared`):** Monetary amounts are stored strictly as integer cents (`amount_cents`), eliminating floating-point rounding errors across all aggregations.
- **Data Persistence:** Relational database running SQLite with WAL (Write-Ahead Logging) mode and foreign key cascades, ready for managed PostgreSQL migration.

---

## 4. Known Limitations & Future Roadmap
1. **Single-Currency Workspace:** Currency is currently configured per user account (USD, EUR, GBP, INR, etc.). Multi-currency conversions with dynamic FX rate feeds will be delivered in v1.1.
2. **Offline-First Sync:** The application gracefully detects network loss; full background service worker offline synchronization is planned for v1.2.
