# ADR-001: Use Date-Only Occurrence Values for Manually Entered Transactions

## Decision Title
Use ISO 8601 Date-Only occurrence values (`YYYY-MM-DD`) for financial transactions.

## Context
When users log personal transactions, they specify a calendar date (e.g. October 15, 2026). Storing full ISO timestamps with time and UTC offsets (`2026-10-15T00:00:00.000Z`) causes daylight savings drift and timezone boundary shifting when viewed by users in timezones east or west of UTC (e.g., UTC-8 vs UTC+5:30), causing transactions to appear on the wrong day or month.

## Options Considered
1. **Full UTC ISO Timestamp (`TIMESTAMP WITH TIME ZONE`):** High operational complexity for manual expense entries; requires storing client timezone and constantly converting between display and query ranges.
2. **Unix Epoch Milliseconds (`INTEGER`):** Obscures the calendar date in raw database queries and exhibits the same timezone boundary shifting issues.
3. **Date-Only Occurrence String (`VARCHAR(10)` / `TEXT` in `YYYY-MM-DD` format):** Preserves the exact user-intended calendar date deterministically across all client timezones.

## Decision and Rationale
We selected **Option 3: Date-Only Occurrence String (`YYYY-MM-DD`)**.  
- Calendar date integrity is preserved regardless of client timezone.
- Monthly aggregations and prefix queries (e.g. `WHERE occurrence_date LIKE '2026-10%'`) execute with high index efficiency.
- Simpler client form handling without date/time conversion errors.

## Consequences
- Positive: Zero timezone drift across users and reports.
- Positive: Direct lexical ordering matches chronological ordering.
- Trade-off: Exact hour-minute ordering within a single day relies on secondary `created_at` timestamp.

## Ownership
- **Owner:** Engineer 2 (Data Layer & Transactions Engine)
- **Review Date:** October 2026
- **Status:** Approved
