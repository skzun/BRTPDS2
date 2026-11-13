const express = require('express');
const os = require('node:os');
const fs = require('node:fs');
const db = require('../db/connection');
const { adminOnly, startedAt } = require('../services/security');
const pkg = require('../../package.json');
const router = express.Router();

// Onde o processo está rodando: container Docker ou máquina local.
function runtimeLocation() {
  if (fs.existsSync('/.dockerenv') || process.env.container) return 'Container Docker';
  return 'Máquina local';
}

router.get('/', adminOnly, async (req, res, next) => {
  try {
    const start = Date.now();
    const result = await db.query('SELECT NOW() AS time, version() AS version, current_database() AS name');
    const latencyMs = Date.now() - start;
    const metadata = await db.query('SELECT initialized_at FROM system_metadata WHERE id = TRUE');
    const sessions = await db.query('SELECT COUNT(*)::int AS count FROM auth_sessions WHERE expires_at > NOW()');
    const uploads = await db.query('SELECT COUNT(*)::int AS count, COALESCE(SUM(octet_length(content)), 0)::bigint AS bytes FROM meeting_attachments');
    // pg_stat_activity pode ser restrito em alguns provedores; nesse caso a informação fica ausente.
    const dbConnections = await db.query('SELECT COUNT(*)::int AS count FROM pg_stat_activity WHERE datname = current_database()')
      .then(r => r.rows[0].count).catch(() => null);
    const memory = process.memoryUsage();
    const pool = db.pool || {};
    res.json({
      name: 'Synple API', packageName: pkg.name, version: pkg.version, nodeVersion: process.version,
      startedAt, initializedAt: metadata.rows[0].initialized_at, uptime: process.uptime(),
      process: { pid: process.pid, platform: process.platform, arch: process.arch, runningIn: runtimeLocation(),
        environment: process.env.NODE_ENV || 'development', port: Number(process.env.PORT || 3001) },
      host: { hostname: os.hostname(), totalMemoryBytes: os.totalmem(), freeMemoryBytes: os.freemem(), cpus: os.cpus().length },
      memory: { rssBytes: memory.rss, heapUsedBytes: memory.heapUsed, heapTotalBytes: memory.heapTotal },
      connections: { activeSessions: sessions.rows[0].count, databaseConnections: dbConnections,
        poolTotal: pool.totalCount ?? null, poolIdle: pool.idleCount ?? null, poolWaiting: pool.waitingCount ?? null },
      uploads: { count: uploads.rows[0].count, totalBytes: Number(uploads.rows[0].bytes) },
      database: { status: 'ONLINE', name: result.rows[0].name, latencyMs, version: result.rows[0].version, serverTime: result.rows[0].time },
    });
  } catch (error) { next(error); }
});
module.exports = router;
