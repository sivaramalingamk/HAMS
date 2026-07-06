const pool = require('./config/db');

async function migrate() {
  try {
    console.log('Starting DB migration...');

    // 1. Drop existing primary keys if needed, but it's easier to just recreate tables if they are simple
    // Let's get the current structure
    const [roomsKeys] = await pool.query("SHOW KEYS FROM rooms WHERE Key_name = 'PRIMARY'");
    const [bedsKeys] = await pool.query("SHOW KEYS FROM beds WHERE Key_name = 'PRIMARY'");

    console.log("Rooms PK:", roomsKeys.map(k => k.Column_name));
    console.log("Beds PK:", bedsKeys.map(k => k.Column_name));
    
    // We need to alter rooms to have composite PK (id, hostelType)
    // First, add hostelType column
    try {
      await pool.query("ALTER TABLE rooms ADD COLUMN hostelType ENUM('Male', 'Female') NOT NULL DEFAULT 'Male'");
    } catch(e) { console.log('Column hostelType may already exist in rooms', e.message); }

    try {
      await pool.query("ALTER TABLE beds ADD COLUMN hostelType ENUM('Male', 'Female') NOT NULL DEFAULT 'Male'");
    } catch(e) { console.log('Column hostelType may already exist in beds', e.message); }

    // Drop PK and add new composite PK for rooms
    try {
      await pool.query("ALTER TABLE rooms DROP PRIMARY KEY, ADD PRIMARY KEY (id, hostelType)");
    } catch(e) { console.log('Error updating rooms PK', e.message); }

    // For beds, the PK might be (roomId, bedId). Now it needs to be (roomId, bedId, hostelType)
    try {
      await pool.query("ALTER TABLE beds DROP PRIMARY KEY, ADD PRIMARY KEY (roomId, bedId, hostelType)");
    } catch(e) { console.log('Error updating beds PK', e.message); }

    // Duplicate rooms for Female
    const [rooms] = await pool.query("SELECT * FROM rooms WHERE hostelType = 'Male'");
    for (const r of rooms) {
      try {
        await pool.query("INSERT IGNORE INTO rooms (id, capacity, hostelType) VALUES (?, ?, 'Female')", [r.id, r.capacity]);
      } catch(e) {}
    }

    // Duplicate beds for Female
    const [beds] = await pool.query("SELECT * FROM beds WHERE hostelType = 'Male'");
    for (const b of beds) {
      try {
        await pool.query("INSERT IGNORE INTO beds (roomId, bedId, status, studentId, hostelType) VALUES (?, ?, 'available', NULL, 'Female')", [b.roomId, b.bedId]);
      } catch(e) {}
    }

    // Fix existing occupied beds to be Female if the student is female
    const [occupiedBeds] = await pool.query(`
      SELECT b.roomId, b.bedId, b.studentId, JSON_UNQUOTE(JSON_EXTRACT(a.formData, '$.sex')) as gender
      FROM beds b
      JOIN applications a ON b.studentId = a.admissionNo
      WHERE b.status = 'booked' AND b.hostelType = 'Male'
    `);

    for (const ob of occupiedBeds) {
      if (ob.gender === 'Female') {
        // Move booking to Female hostel
        await pool.query("UPDATE beds SET status = 'booked', studentId = ? WHERE roomId = ? AND bedId = ? AND hostelType = 'Female'", [ob.studentId, ob.roomId, ob.bedId]);
        // Free up the Male hostel bed
        await pool.query("UPDATE beds SET status = 'available', studentId = NULL WHERE roomId = ? AND bedId = ? AND hostelType = 'Male'", [ob.roomId, ob.bedId]);
      }
    }

    console.log('Migration completed successfully.');
    process.exit();
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
