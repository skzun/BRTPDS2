const express = require('express');
const db = require('../db/connection');
const { adminOnly, startedAt } = require('../services/security');
const router = express.Router();
router.get('/', adminOnly, async (req, res, next) => {
  try {
    const start = Date.now();
    const result = await db.query('SELECT NOW() AS time, version() AS version');
    const metadata = await db.query('SELECT initialized_at FROM system_metadata WHERE id = TRUE');
    res.json({ startedAt, initializedAt: metadata.rows[0].initialized_at, uptime: process.uptime(),
      version: require('../../package.json').version, nodeVersion: process.version,
      database: { status: 'ONLINE', latencyMs: Date.now() - start, version: result.rows[0].version, serverTime: result.rows[0].time } });
  } catch (error) { next(error); }
});
module.exports = router;
