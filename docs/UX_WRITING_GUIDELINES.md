# FinPilot · UX Writing & Content Standards

**Specification Chapter:** 40 — UX writing and content rules  
**Owning Engineer:** Engineer 4 (Frontend UI/UX & Design System)  
**Status:** Approved & Enforced in UI Components  

---

## 1. Tone and Demeanor
- **Calm, Plain, and Empowering:** Never shame or patronize users for spending.
- **Fact-Based Warnings:** When a budget target is reached or exceeded, state the numbers plainly and provide actionable next steps rather than alarmist or moralizing statements.
  - *Discouraged:* "Warning! You are dangerously overspending your budget!"
  - *Standard:* "Spending in Food & Dining is $200.00 over your $500.00 target limit for October. You can adjust this budget limit or review individual transactions below."

---

## 2. Formatting Numbers and Currencies
- **Strict Currency Labels:** Always display the currency symbol and 2 decimal places (`$1,250.00`).
- **Reporting Period:** Every summary card and table explicitly states the active reporting month (`October 2026`).
- **Clear Separation of Terms:** Never confuse `spent`, `limit`, and `remaining`.
- **Explicit Placeholders:** If a mathematical calculation is not possible (e.g. Savings Rate when income is $0), display the explicit placeholder `—` accompanied by an informative tooltip rather than displaying misleading percentages.

---

## 3. Actionable Error Messages
Error banners must state what happened, why, and how to resolve it:

| Scenario | Anti-Pattern | FinPilot Standard Message |
| :--- | :--- | :--- |
| **Duplicate Monthly Budget** | `409 Conflict` | *"This category already has a budget for October. Edit the existing budget or choose another category."* |
| **Invalid Authentication** | `User not found` | *"Invalid email or password. Please verify your credentials."* |
| **Malformed CSV File** | `Upload parse error` | *"CSV file is missing required columns. Ensure your file includes Date (YYYY-MM-DD), Description, and Amount."* |
| **Zero Income Savings Rate** | `NaN%` or `0.0%` | `—` with tooltip: *"Savings rate is hidden because no income was logged this month."* |

---

## 4. Demo Credibility Standard
- The pre-seeded workspace is conspicuously badged with **`DEMO DATA`** in amber.
- Fictional records are never conflated with live observed analytics.
- Zero fabricated customer testimonials, user counts, or unrealistic claims.
