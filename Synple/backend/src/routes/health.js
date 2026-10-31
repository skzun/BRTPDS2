const express = require('express');
const db = require('../db/connection');
const router = express.Router();
router.get('/', async (req, res) => {
  try { await db.query('SELECT 1'); res.json({ status: 'OK', database: { status: 'ONLINE' } }); }
  catch { res.status(503).json({ status: 'DEGRADED', database: { status: 'OFFLINE' } }); }
});
module.exports = router;
