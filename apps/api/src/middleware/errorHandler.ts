import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // 1. Handle Zod validation errors
  if (err instanceof ZodError || err?.name === 'ZodError') {
    const details: Record<string, string[]> = {};
    for (const issue of err.issues || []) {
      const field = issue.path.join('.') || 'root';
      if (!details[field]) details[field] = [];
      details[field].push(issue.message);
    }

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'The submitted data was incomplete or improperly formatted.',
        details,
      },
    });
  }

  // 2. Handle database UNIQUE constraint violations (e.g. compound unique budget)
  if (err && err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    if (err.message && err.message.includes('budgets')) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'BUDGET_ALREADY_EXISTS',
          message: 'This category already has a budget for this month. Edit the existing budget or choose another category.',
        },
      });
    }
    return res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'A record with this information already exists.',
      },
    });
  }

  // 3. Catch-all unexpected errors
  console.error('Unhandled server exception:', err);
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected issue occurred while processing your request. Please try again.',
    },
  });
}
