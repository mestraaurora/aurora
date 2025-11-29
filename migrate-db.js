const sqlite3 = require('sqlite3').verbose();

// Connect to the database
const db = new sqlite3.Database('leads.db');

console.log('Starting database migration...');

db.serialize(() => {
  // Check if the table has the UNIQUE constraint on email
  db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='leads'", (err, row) => {
    if (err) {
      console.error('Error checking table schema:', err);
      return;
    }
    
    if (row && row.sql.includes('email TEXT NOT NULL UNIQUE')) {
      console.log('UNIQUE constraint found on email. Starting migration...');
      
      // Begin transaction
      db.run('BEGIN TRANSACTION');
      
      // 1. Rename the existing table
      db.run('ALTER TABLE leads RENAME TO leads_old', (err) => {
        if (err) {
          console.error('Error renaming table:', err);
          return;
        }
        
        console.log('Renamed existing table to leads_old');
        
        // 2. Create new table without UNIQUE constraint
        db.run(`CREATE TABLE leads (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          email TEXT NOT NULL,
          telefone TEXT,
          sexo TEXT NOT NULL,
          data_nascimento TEXT NOT NULL,
          estado_civil TEXT,
          pergunta TEXT,
          marketing_consent BOOLEAN,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
          if (err) {
            console.error('Error creating new table:', err);
            return;
          }
          
          console.log('Created new leads table without UNIQUE constraint on email');
          
          // 3. Copy data from old table to new table
          db.run(`INSERT INTO leads 
            (id, nome, email, telefone, sexo, data_nascimento, estado_civil, pergunta, marketing_consent, created_at)
            SELECT id, nome, email, telefone, sexo, data_nascimento, estado_civil, pergunta, marketing_consent, created_at
            FROM leads_old`, (err) => {
            if (err) {
              console.error('Error copying data:', err);
              return;
            }
            
            console.log('Copied data to new table');
            
            // 4. Drop the old table
            db.run('DROP TABLE leads_old', (err) => {
              if (err) {
                console.error('Error dropping old table:', err);
                return;
              }
              
              console.log('Dropped old table');
              console.log('✅ Database migration completed successfully!');
              
              // Close the database connection
              db.close();
            });
          });
        });
      });
    } else {
      console.log('No UNIQUE constraint found on email or table does not exist. No migration needed.');
      
      // Check if table exists, if not create it
      db.run(`CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT NOT NULL,
        telefone TEXT,
        sexo TEXT NOT NULL,
        data_nascimento TEXT NOT NULL,
        estado_civil TEXT,
        pergunta TEXT,
        marketing_consent BOOLEAN,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          console.error('Error creating table:', err);
        } else {
          console.log('Leads table ensured to exist with correct schema');
        }
        
        // Close the database connection
        db.close();
      });
    }
  });
});