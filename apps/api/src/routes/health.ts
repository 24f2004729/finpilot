import { Router, Request, Response } from 'express';
import { db } from '../db/database';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    // Verify database responsiveness
    const dbCheck = db.prepare('SELECT 1 as healthy').get() as { healthy: number };
    const isDbHealthy = dbCheck && dbCheck.healthy === 1;

    return res.json({
      status: isDbHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'finpilot-api',
      version: '1.0.0',
      uptimeSeconds: Math.floor(process.uptime()),
      memory: {
        rssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
      database: isDbHealthy ? 'connected' : 'unhealthy',
    });
  } catch (err: any) {
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: err.message,
    });
  }
});

export default router;
