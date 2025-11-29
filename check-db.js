const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('leads.db');

console.log('Checking database contents...');

// Check if leads table exists and get all entries
db.serialize(() => {
  db.each("SELECT name FROM sqlite_master WHERE type='table' AND name='leads'", (err, row) => {
    if (err) {
      console.error('Error checking table:', err);
    } else if (row) {
      console.log('✅ Leads table exists');
    } else {
      console.log('❌ Leads table does not exist');
    }
  });
  
  // Count entries in leads table
  db.get("SELECT COUNT(*) as count FROM leads", (err, row) => {
    if (err) {
      console.error('Error counting entries:', err);
    } else {
      console.log(`📊 Total leads in database: ${row.count}`);
    }
  });
  
  // Get all entries
  db.each("SELECT * FROM leads", (err, row) => {
    if (err) {
      console.error('Error querying leads:', err);
    } else {
      console.log('📄 Lead entry:', row);
    }
  });
});

// Close the database connection
setTimeout(() => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('🔒 Database connection closed');
    }
  });
}, 1000);