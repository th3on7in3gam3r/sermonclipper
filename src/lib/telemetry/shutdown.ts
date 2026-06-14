let registered = false;

/** Graceful shutdown for long-running Node deployments (Railway/Fly/Docker). No-op on Vercel serverless. */
export function registerGracefulShutdown() {
  if (registered || process.env.NEXT_RUNTIME !== 'nodejs') return;
  registered = true;

  const shutdown = async (signal: string) => {
    console.log(`[Shutdown] ${signal} received — draining connections…`);

    const timeout = setTimeout(() => {
      console.error('[Shutdown] Forced exit after timeout');
      process.exit(1);
    }, 30_000);

    try {
      const mongoose = (await import('mongoose')).default;
      if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
      }
    } catch {
      /* ignore */
    }

    try {
      const { closePool } = await import('@/lib/postgres');
      await closePool();
    } catch {
      /* ignore */
    }

    clearTimeout(timeout);
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}
