# ADR-003: Formula Injection Protection in CSV Export and Import

## Decision Title
Implement sanitization against CSV Formula Injection (CWE-1236) on all spreadsheet exports and imports.

## Context
When financial ledgers are exported to CSV and opened in Microsoft Excel, LibreOffice Calc, or Google Sheets, cell values beginning with formula trigger characters (`=`, `+`, `-`, `@`, `\t`, `\r`) can execute arbitrary spreadsheet macros, launch external processes (DDE command execution), or exfiltrate sensitive token data.

## Options Considered
1. **Unsanitized CSV Export:** Leaves users vulnerable to code execution when viewing records containing special characters.
2. **Stripping Special Characters:** Modifies the user's intended description destructively (e.g., negative numbers or equations lose meaning).
3. **Leading Single-Quote Escaping (RFC 4180 + Prefixing):** If a cell begins with a trigger character, prepend a single quotation mark `'`. Spreadsheet programs render the cell as literal text without executing formulas.

## Decision and Rationale
We selected **Option 3: Leading Single-Quote Escaping**.  
- Neutralizes remote command execution in desktop spreadsheet tools.
- Preserves the textual meaning of the financial entry.
- Complies directly with OWASP CSV Injection prevention guidelines.

## Consequences
- Positive: Institutional-grade defense against CSV payload attacks.
- Positive: Safe handling of imported and exported financial data.
- Trade-off: Opening the CSV in raw text editors reveals the prepended single quote on trigger values.

## Ownership
- **Owner:** Engineer 2 (Data Layer & CSV Processing)
- **Review Date:** October 2026
- **Status:** Approved
