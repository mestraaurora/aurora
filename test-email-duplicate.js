const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('leads.db');

console.log('Testing duplicate email insertion...');

db.serialize(() => {
  // Insert first entry
  db.run(`INSERT INTO leads 
    (nome, email, telefone, sexo, data_nascimento, estado_civil, pergunta, marketing_consent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
    ['Test User 1', 'test@example.com', '123456789', 'masculino', '1990-01-01', 'solteiro', 'Test question 1', 1], 
    function(err) {
      if (err) {
        console.error('First insert error:', err);
      } else {
        console.log('First entry inserted with ID:', this.lastID);
      }
    });
  
  // Insert second entry with same email
  db.run(`INSERT INTO leads 
    (nome, email, telefone, sexo, data_nascimento, estado_civil, pergunta, marketing_consent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
    ['Test User 2', 'test@example.com', '987654321', 'feminino', '1995-05-05', 'casado', 'Test question 2', 0], 
    function(err) {
      if (err) {
        console.error('Second insert error:', err);
      } else {
        console.log('Second entry inserted with ID:', this.lastID);
      }
    });
  
  // Query all entries
  db.all("SELECT * FROM leads", (err, rows) => {
    if (err) {
      console.error('Query error:', err);
    } else {
      console.log('All leads:');
      rows.forEach(row => {
        console.log(`  ID: ${row.id}, Name: ${row.nome}, Email: ${row.email}`);
      });
    }
    
    // Close the database connection
    db.close();
  });
});