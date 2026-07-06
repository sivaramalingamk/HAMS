const pool = require('./config/db');

async function showTables() {
  const [tables] = await pool.query('SHOW TABLES');
  console.log('Tables:');
  for (const row of tables) {
    const tableName = Object.values(row)[0];
    console.log(`\nTable: ${tableName}`);
    const [columns] = await pool.query(`SHOW COLUMNS FROM ${tableName}`);
    columns.forEach(col => console.log(`  ${col.Field} - ${col.Type}`));
  }
  process.exit();
}

showTables();
