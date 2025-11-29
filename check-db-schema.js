const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('leads.db');

console.log('Checking database schema...');

db.serialize(() => {
  db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='leads'", (err, row) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log('Table schema:', row.sql);
    }
    db.close();
  });
});