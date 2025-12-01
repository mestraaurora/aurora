const { Pool } = require('pg');

// Test database connection with the corrected URL format and SSL configuration
const pool = new Pool({
  connectionString: 'postgresql://mestraaurora_user:g3S0BXkKABLP2A9A6Yf630F5Um6CbY42@dpg-d4mmh0fdiees739br8u0-a.oregon-postgres.render.com/mestraaurora',
  ssl: {
    rejectUnauthorized: false // For testing purposes only
  }
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('Connection string:', 'postgresql://mestraaurora_user:***@dpg-d4mmh0fdiees739br8u0-a.oregon-postgres.render.com/mestraaurora');
    
    // Get a client from the pool
    const client = await pool.connect();
    console.log('✅ Connected to database successfully');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Simple query executed successfully:', result.rows[0]);
    
    // Test leads table creation
    console.log('Testing leads table creation...');
    const createTableResult = await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT NOT NULL,
        telefone TEXT,
        sexo TEXT NOT NULL,
        data_nascimento TEXT NOT NULL,
        estado_civil TEXT,
        pergunta TEXT,
        marketing_consent BOOLEAN,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Leads table creation check completed');
    
    // Test inserting a sample record
    console.log('Testing sample record insertion...');
    const insertResult = await client.query(`
      INSERT INTO leads 
      (nome, email, telefone, sexo, data_nascimento, estado_civil, pergunta, marketing_consent)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, [
      'Test User',
      'test@example.com',
      '123456789',
      'feminino',
      '1990-01-01',
      'solteiro',
      'Test question?',
      true
    ]);
    console.log('✅ Sample record inserted with ID:', insertResult.rows[0].id);
    
    // Test querying the record
    console.log('Testing record query...');
    const queryResult = await client.query('SELECT * FROM leads WHERE email = $1', ['test@example.com']);
    console.log('✅ Record query completed, found', queryResult.rows.length, 'records');
    
    // Clean up test record
    console.log('Cleaning up test record...');
    await client.query('DELETE FROM leads WHERE email = $1', ['test@example.com']);
    console.log('✅ Test record cleaned up');
    
    client.release();
    
    console.log('🎉 All database tests passed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error details:', error);
    
    // Try to get more specific error information
    if (error.code === 'ENOTFOUND') {
      console.error('🔍 This error typically means the database hostname cannot be resolved.');
      console.error('🔍 Please check if the database URL is correct and if the database is accessible.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔍 This error typically means the database is not accepting connections.');
    } else if (error.code === '28000') {
      console.error('🔍 This error typically means authentication failed.');
    } else if (error.code === '23505') {
      console.error('🔍 This error typically means a unique constraint violation.');
    } else if (error.code === 'ECONNRESET') {
      console.error('🔍 This error typically means the connection was reset by the server.');
      console.error('🔍 This could be due to network issues, firewall restrictions, or SSL configuration problems.');
    } else if (error.code === 'EPROTO') {
      console.error('🔍 This error typically means there is an SSL/TLS protocol error.');
      console.error('🔍 Try adding ssl: { rejectUnauthorized: false } to your connection configuration.');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection();