import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { TransactionService } from '../services/transactionService';
import {
  CreateTransactionSchema,
  UpdateTransactionSchema,
  TransactionFilterSchema,
  parseCsvSafe
} from '@finpilot/shared';

const router = Router();
router.use(requireAuth);

// List transactions with filtering & pagination
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = TransactionFilterSchema.parse(req.query);
    const result = TransactionService.listTransactions(req.user!.id, filters);
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// Create new transaction
router.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = CreateTransactionSchema.parse(req.body);
    const transaction = TransactionService.create(req.user!.id, validated);
    return res.status(201).json({ success: true, data: { transaction } });
  } catch (err) {
    next(err);
  }
});

// Export CSV (Sanitized for formula injection prevention)
router.get('/export', (req: Request, res: Response) => {
  const monthKey = req.query.monthKey as string | undefined;
  const csvContent = TransactionService.exportCsv(req.user!.id, monthKey);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=finpilot-transactions-${monthKey || 'all'}.csv`);
  return res.send(csvContent);
});

// Import CSV
router.post('/import', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { csvText } = req.body;
    if (!csvText || typeof csvText !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_CSV', message: 'Please provide CSV file content.' },
      });
    }

    const rows = parseCsvSafe(csvText);
    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'EMPTY_CSV', message: 'No valid transaction rows found in the CSV file.' },
      });
    }

    const result = TransactionService.importCsv(req.user!.id, rows);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: { code: 'CSV_PARSING_FAILED', message: err.message || 'Failed to parse CSV file.' },
    });
  }
});

// Get single transaction
router.get('/:id', (req: Request, res: Response) => {
  const tx = TransactionService.getById(req.user!.id, req.params.id);
  if (!tx) {
    return res.status(404).json({
      success: false,
      error: { code: 'TRANSACTION_NOT_FOUND', message: 'Transaction not found.' },
    });
  }
  return res.json({ success: true, data: { transaction: tx } });
});

// Update transaction
router.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = UpdateTransactionSchema.parse(req.body);
    const transaction = TransactionService.update(req.user!.id, req.params.id, validated);
    return res.json({ success: true, data: { transaction } });
  } catch (err: any) {
    if (err.message && err.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: { code: 'TRANSACTION_NOT_FOUND', message: err.message },
      });
    }
    next(err);
  }
});

// Delete transaction
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    TransactionService.delete(req.user!.id, req.params.id);
    return res.json({ success: true, data: { message: 'Transaction deleted successfully.' } });
  } catch (err: any) {
    if (err.message && err.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: { code: 'TRANSACTION_NOT_FOUND', message: err.message },
      });
    }
    next(err);
  }
});

export default router;
