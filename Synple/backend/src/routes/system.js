const express = require('express');
const os = require('os');
const fs = require('fs');
const db = require('../db/connection');
const { version } = require('../../package.json');
const { readSystemSession } = require('../services/systemSession');
const router = express.Router();

router.get('/', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const session = readSystemSession((req.get('Authorization') || '').replace(/^Bearer /, ''));
  if (!session) return res.status(401).json({ error: 'Entre novamente como administrador para consultar o servidor.' });
  try {
    const actor = await db.query('SELECT system_role FROM users WHERE id = $1', [session.id]);
    if (actor.rows[0]?.system_role !== 'SYSTEM_ADMIN') return res.status(403).json({ error: 'Acesso exclusivo do administrador do sistema.' });
    let database;
    const start = Date.now();
    try {
      const result = await db.query(`SELECT current_database() AS name,
        current_setting('server_version') AS version, pg_database_size(current_database())::text AS bytes,
        (SELECT count(*)::int FROM pg_stat_activity WHERE datname = current_database()) AS connections,
        (SELECT count(*)::int FROM pg_stat_activity WHERE datname = current_database() AND state = 'active') AS active_queries`);
      database = { status: 'ONLINE', ...result.rows[0], latencyMs: Date.now() - start };
    } catch {
      database = { status: 'INDISPONÍVEL', error: 'Não foi possível consultar as métricas do PostgreSQL.' };
    }
    const memory = process.memoryUsage();
    return res.json({
      timestamp: new Date().toISOString(), name: 'Synple API', version,
      pid: process.pid, hostname: os.hostname(), platform: `${os.type()} ${os.release()} (${os.arch()})`,
      runtime: process.version,
      environment: fs.existsSync('/.dockerenv') ? 'Container Docker' : (process.env.NODE_ENV || 'Node.js local'),
      listening: `0.0.0.0:${process.env.PORT || 3001}`,
      uptimeSeconds: Math.floor(process.uptime()),
      startedAt: new Date(Date.now() - process.uptime() * 1000).toISOString(),
      memory: { totalBytes: os.totalmem(), freeBytes: os.freemem(), processBytes: memory.rss, heapUsedBytes: memory.heapUsed },
      connections: { tcp: req.app.locals.sockets?.size || 0, requests: req.app.locals.activeRequests || 0,
        dbTotal: db.pool.totalCount, dbIdle: db.pool.idleCount, dbWaiting: db.pool.waitingCount },
      uploads: { supported: false, description: 'Não implementado: a API não possui serviço de upload de arquivos.' },
      database,
    });
  } catch {
    return res.status(503).json({ error: 'Não foi possível consultar o servidor ou validar o acesso no banco. Tente novamente.' });
  }
});
module.exports = router;
