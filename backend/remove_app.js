const mysql = require('mysql2/promise');
require('dotenv').config();

async function removeApplication() {
  const studentId = '2021/ICT/59';
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hams_db'
  });

  try {
    // Delete the application
    const [result] = await connection.execute(
      'DELETE FROM applications WHERE admissionNo = ?',
      [studentId]
    );
    console.log(`Deleted ${result.affectedRows} application(s) for student ${studentId}`);

    // Free up any booked beds
    const [bedResult] = await connection.execute(
      'UPDATE beds SET status = "available", studentId = NULL WHERE studentId = ?',
      [studentId]
    );
    console.log(`Freed ${bedResult.affectedRows} bed(s) for student ${studentId}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

removeApplication();
