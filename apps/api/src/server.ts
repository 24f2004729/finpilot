import { app } from './app';
import { config } from './config';
import { seedDemoWorkspace } from './db/seed';

// Automatically ensure demo workspace is seeded on boot
try {
  seedDemoWorkspace();
  console.log('💎 FinPilot Demo Workspace verified and ready.');
} catch (err) {
  console.error('Warning: Failed to auto-seed demo workspace:', err);
}

const server = app.listen(config.PORT, () => {
  console.log(`🚀 FinPilot Institutional API active on http://localhost:${config.PORT}`);
  console.log(`🔒 Environment: ${config.NODE_ENV} | Database: SQLite WAL`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing HTTP server gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});
