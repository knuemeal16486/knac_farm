const express = require('express');
const router  = express.Router();
const db      = require('../db');

const parse = o => ({ ...o, items: JSON.parse(o.items) });

// GET  /api/orders
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM orders ORDER BY ordered_at DESC').all();
  res.json(rows.map(parse));
});

// POST /api/orders
router.post('/', (req, res) => {
  const { name, phone, items, amount, address, memo } = req.body;
  if (!name || !phone || !items || amount == null)
    return res.status(400).json({ error: '필수 항목이 누락되었습니다.' });

  const stmt = db.prepare(
    'INSERT INTO orders (name,phone,items,amount,address,memo) VALUES (?,?,?,?,?,?)'
  );
  const r = stmt.run(name, phone, JSON.stringify(items), amount, address || '', memo || '');
  const row = db.prepare('SELECT * FROM orders WHERE id=?').get(r.lastInsertRowid);
  res.status(201).json(parse(row));
});

// PATCH /api/orders/:id/paid  — 수동 입금확인
router.patch('/:id/paid', (req, res) => {
  const { id } = req.params;
  const r = db.prepare(
    "UPDATE orders SET status='paid', paid_at=datetime('now','localtime') WHERE id=?"
  ).run(id);
  if (r.changes === 0) return res.status(404).json({ error: '주문을 찾을 수 없습니다.' });
  res.json(parse(db.prepare('SELECT * FROM orders WHERE id=?').get(id)));
});

// PATCH /api/orders/:id/shipped
router.patch('/:id/shipped', (req, res) => {
  const { id } = req.params;
  const r = db.prepare("UPDATE orders SET status='shipped' WHERE id=?").run(id);
  if (r.changes === 0) return res.status(404).json({ error: '주문을 찾을 수 없습니다.' });
  res.json(parse(db.prepare('SELECT * FROM orders WHERE id=?').get(id)));
});

// DELETE /api/orders/:id
router.delete('/:id', (req, res) => {
  const r = db.prepare('DELETE FROM orders WHERE id=?').run(req.params.id);
  if (r.changes === 0) return res.status(404).json({ error: '주문을 찾을 수 없습니다.' });
  res.json({ ok: true });
});

module.exports = router;
