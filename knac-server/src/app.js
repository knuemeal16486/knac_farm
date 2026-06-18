require('dotenv').config();
const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Basic Auth ────────────────────────────────────────────────────────────────
const VALID_USER = process.env.ADMIN_USER || 'admin';
const VALID_PASS = process.env.ADMIN_PASS || 'changeme';

app.use((req, res, next) => {
  const h = req.headers.authorization;
  if (h && h.startsWith('Basic ')) {
    const [u, p] = Buffer.from(h.slice(6), 'base64').toString().split(':');
    if (u === VALID_USER && p === VALID_PASS) return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="크낙새 농장 관리"');
  res.status(401).send('인증이 필요합니다.');
});

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/orders', require('./routes/orders'));
app.use('/api/bank',   require('./routes/bank'));

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`크낙새 농장 서버 실행 중: http://localhost:${PORT}`);
});

module.exports = app;
