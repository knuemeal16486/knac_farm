const Database = require('better-sqlite3');
const path = require('path');
const fs   = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/orders.db');

const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    phone      TEXT    NOT NULL,
    items      TEXT    NOT NULL,
    amount     INTEGER NOT NULL,
    address    TEXT    DEFAULT '',
    memo       TEXT    DEFAULT '',
    status     TEXT    DEFAULT 'pending',
    auto_paid  INTEGER DEFAULT 0,
    ordered_at TEXT    DEFAULT (datetime('now','localtime')),
    paid_at    TEXT
  );
`);

module.exports = db;
