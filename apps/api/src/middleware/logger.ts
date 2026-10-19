import { Request, Response, NextFunction } from 'express';

const SENSITIVE_FIELDS = ['password', 'token', 'authorization', 'cookie', 'secret', 'card', 'cvv'];

function redactSensitiveData(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redactSensitiveData);

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      sanitized[key] = redactSensitiveData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, url } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    // Redact query parameters that might carry sensitive tokens
    const sanitizedQuery = redactSensitiveData(req.query);

    // Only log in non-test environments
    if (process.env.NODE_ENV !== 'test') {
      console.log(
        `[${new Date().toISOString()}] ${method} ${url} -> ${statusCode} (${duration}ms)`
      );
    }
  });

  next();
}
