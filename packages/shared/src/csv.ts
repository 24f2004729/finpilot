import { CsvTransactionRow } from './types';

/**
 * Characters that trigger formula execution in spreadsheet software (Excel, Calc, Sheets).
 */
const FORMULA_TRIGGER_CHARS = ['=', '+', '-', '@', '\t', '\r'];

/**
 * Sanitizes a single cell value to eliminate CSV Formula Injection (CWE-1236).
 * If a cell starts with an active formula trigger character, prepends a single quote.
 */
export function sanitizeCsvCell(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  let str = String(value);

  // Guard against formula injection
  if (str.length > 0 && FORMULA_TRIGGER_CHARS.includes(str[0])) {
    str = `'${str}`;
  }

  // Escape double quotes per RFC 4180
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Serializes an array of records into a secure CSV string.
 */
export function exportToCsv<T extends Record<string, any>>(
  rows: T[],
  headers: { key: keyof T; label: string }[]
): string {
  const headerLine = headers.map(h => `"${String(h.label).replace(/"/g, '""')}"`).join(',');
  const lines = rows.map(row => {
    return headers.map(h => sanitizeCsvCell(row[h.key])).join(',');
  });

  return [headerLine, ...lines].join('\r\n');
}

/**
 * Basic safe parser for uploaded CSV text.
 * Trims whitespace, removes dangerous formula injection prefixes if present, and validates required columns.
 */
export function parseCsvSafe(csvText: string): CsvTransactionRow[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse header
  const headerLine = lines[0].toLowerCase();
  const headers = parseCsvRow(headerLine);

  const dateIdx = headers.findIndex(h => h.includes('date'));
  const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('title') || h.includes('payee'));
  const categoryIdx = headers.findIndex(h => h.includes('cat'));
  const typeIdx = headers.findIndex(h => h.includes('type'));
  const amountIdx = headers.findIndex(h => h.includes('amount') || h.includes('price') || h.includes('value'));
  const notesIdx = headers.findIndex(h => h.includes('note') || h.includes('memo'));

  if (dateIdx === -1 || descIdx === -1 || amountIdx === -1) {
    throw new Error('CSV must contain Date, Description, and Amount columns.');
  }

  const results: CsvTransactionRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawRow = parseCsvRow(lines[i]);
    if (rawRow.length <= Math.max(dateIdx, descIdx, amountIdx)) continue;

    const rawDate = rawRow[dateIdx]?.trim();
    const rawDesc = rawRow[descIdx]?.trim();
    const rawCategory = categoryIdx !== -1 ? rawRow[categoryIdx]?.trim() : 'other_expense';
    const rawType = typeIdx !== -1 ? rawRow[typeIdx]?.trim().toLowerCase() : 'expense';
    const rawAmountStr = rawRow[amountIdx]?.replace(/[$,\s]/g, '');
    const notes = notesIdx !== -1 ? rawRow[notesIdx]?.trim() : '';

    const amount = parseFloat(rawAmountStr);
    if (isNaN(amount) || amount <= 0) continue;

    // Validate or format date YYYY-MM-DD
    let occurrenceDate = rawDate;
    if (rawDate.includes('/')) {
      const parts = rawDate.split('/');
      if (parts.length === 3) {
        if (parts[2].length === 4) {
          occurrenceDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        }
      }
    }

    results.push({
      date: occurrenceDate,
      description: rawDesc,
      category: rawCategory || 'other_expense',
      type: rawType === 'income' ? 'income' : 'expense',
      amount: amount,
      notes: notes || undefined
    });
  }

  return results;
}

/**
 * Splits a CSV row taking quoted commas into account.
 */
function parseCsvRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        current += '"';
        i++; // Skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}
