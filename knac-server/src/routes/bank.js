const express = require('express');
const router  = express.Router();
const { pollTransactions } = require('../jobs/pollBank');

// POST /api/bank/poll  — 즉시 입금 조회 트리거
router.post('/poll', async (req, res) => {
  try {
    const matched = await pollTransactions();
    res.json({ ok: true, matched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
