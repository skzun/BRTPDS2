const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// GET /api/health - Monitoramento de saúde e conexão com PostgreSQL
router.get('/', async (req, res) => {
  const start = Date.now();
  try {
    const dbRes = await db.query('SELECT NOW() as current_time, version() as pg_version;');
    const latencyMs = Date.now() - start;

    const subsystemsRes = await db.query('SELECT id, name, status, last_check FROM system_subsystems ORDER BY id;');

    return res.json({
      status: 'OK',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: {
        status: 'ONLINE',
        name: process.env.DB_NAME || 'Banco_synple',
        latencyMs,
        serverTime: dbRes.rows[0].current_time,
        version: dbRes.rows[0].pg_version.split(' ')[0] + ' ' + dbRes.rows[0].pg_version.split(' ')[1],
      },
      subsystems: subsystemsRes.rows,
    });
  } catch (err) {
    return res.status(500).json({
      status: 'DEGRADED',
      database: {
        status: 'OFFLINE',
        error: err.message,
      },
    });
  }
});

module.exports = router;
