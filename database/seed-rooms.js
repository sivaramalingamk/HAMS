const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

async function seedRooms() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hams_db'
    });

    console.log('Connected to hams_db for seeding.');

    // Clear existing rooms and beds for a fresh seed
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE beds');
    await connection.query('TRUNCATE TABLE rooms');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    const rooms = [];
    for (let floor = 1; floor <= 4; floor++) {
      for (let i = 1; i <= 10; i++) {
        rooms.push(floor * 100 + i);
      }
    }
    const beds = ['A', 'B', 'C', 'D'];

    for (const roomId of rooms) {
      await connection.execute('INSERT INTO rooms (id, capacity) VALUES (?, 4)', [roomId]);
      for (const bedId of beds) {
        await connection.execute(
          'INSERT INTO beds (roomId, bedId, status) VALUES (?, ?, ?)',
          [roomId, bedId, 'available']
        );
      }
    }

    console.log('Successfully seeded 10 rooms with 4 beds each.');
    await connection.end();
  } catch (err) {
    console.error('Error seeding rooms:', err.message);
  }
}

seedRooms();
