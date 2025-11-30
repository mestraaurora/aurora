53c0.....6666666666666666onst sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('leads.db');

console.log('Testing database connection...');

db.serialize(() => {
  // Check if leads table exists
  db.each("SELECT name FROM sqlite_master WHERE type='table' AND name='leads'", (err, row) => {
    if (err) {
      console.error('Error:', err);
    } else if (row) {
      console.log('Leads table exists:', row);
    } else {
      console.log('Leads table does not exist');
    }
  });
  
  // Insert a test lead
  const stmt = db.prepare(`INSERT OR IGNORE INTO leads 
    (nome, email, telefone, sexo, data_nascimento, estado_civil, pergunta, marketing_consent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  
  stmt.run([
    'Test User',
    'test@example.com',
    '123456789',
    'masculino',
    '1990-01-01',
    'solteiro',
    'Test question',
    1
  ], function(err) {
    if (err) {
      console.error('Insert error:', err);
    } else {
      console.log('Test lead inserted with ID:', this.lastID);
    }
  });
  
  stmt.finalize();
  
  // Query the leads
  db.each("SELECT * FROM leads", (err, row) => {
    if (err) {
      console.error('Query error:', err);
    } else {
      console.log('Lead:', row);
    }
  });
});

// Close the database connection
db.close((err) => {
  if (err) {
    console.error('Error closing database:', err);
  } else {
    console.log('Database connection closed');
  }
});