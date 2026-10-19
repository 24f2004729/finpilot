# ADR-002: Integer-Cent Currency Representation for Precision

## Decision Title
Store all monetary balances, transaction amounts, and budget limits as 64-bit integer cents.

## Context
Standard IEEE 754 floating-point numbers in JavaScript and SQL databases introduce binary rounding errors (e.g. `0.1 + 0.2 = 0.30000000000000004`). In institutional fintech platforms, floating-point drift can accumulate over thousands of ledger entries, violating audit standards and causing reconciliation mismatches.

## Options Considered
1. **IEEE 754 Double Precision Floats (`FLOAT` / `REAL`):** Subject to rounding anomalies and display inconsistencies.
2. **Fixed-Point Strings (`VARCHAR` / `DECIMAL(12, 2)`):** Requires heavy runtime string parsing and specialized arithmetic libraries (e.g. `bignumber.js`).
3. **Integer Cents (`INTEGER` / `BIGINT`):** $1.00 is stored as 100, $0.99 is stored as 99. Native integer arithmetic is exact and fast.

## Decision and Rationale
We selected **Option 3: Integer Cents**.  
- 100% exact math across sum, subtract, and net cash flow operations.
- Native integer support across SQLite, PostgreSQL, and JavaScript engines.
- Formatting to localized currency strings occurs only at the presentation boundary.

## Consequences
- Positive: Zero floating point accumulation error.
- Positive: Instant aggregation in SQL (`SUM(amount_cents)`).
- Trade-off: External inputs (dollars) must pass through `dollarsToCents()` and outputs through `centsToDollars()`.

## Ownership
- **Owner:** Engineer 2 & Engineer 3 (Data Layer & Analytics)
- **Review Date:** October 2026
- **Status:** Approved
