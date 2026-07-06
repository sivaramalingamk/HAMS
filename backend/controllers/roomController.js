const pool = require('../config/db');

exports.bookBed = async (req, res) => {
  try {
    const { roomId, bedId, studentId, hostelType = 'Male' } = req.body;

    // Check if bed exists and is available
    const [beds] = await pool.query('SELECT status FROM beds WHERE roomId = ? AND bedId = ? AND hostelType = ?', [roomId, bedId, hostelType]);

    if (beds.length === 0) {
      // Ensure the room exists first to satisfy foreign key constraints
      await pool.execute('INSERT IGNORE INTO rooms (id, capacity, hostelType) VALUES (?, 4, ?)', [roomId, hostelType]);

      // For resilience, if we haven't seeded all 40 beds but logic dictates they exist, we just insert it.
      await pool.execute('INSERT INTO beds (roomId, bedId, status, studentId, hostelType) VALUES (?, ?, "booked", ?, ?)', [roomId, bedId, studentId, hostelType]);
      return res.status(200).json({ success: true, message: 'Bed successfully booked' });
    }

    if (beds[0].status === 'booked') {
      return res.status(400).json({ success: false, message: 'Bed is already booked by someone else' });
    }

    // Update bed
    await pool.execute('UPDATE beds SET status = "booked", studentId = ? WHERE roomId = ? AND bedId = ? AND hostelType = ?', [studentId, roomId, bedId, hostelType]);

    res.status(200).json({ success: true, message: 'Bed successfully booked' });

  } catch (error) {
    console.error('Room Booking Error:', error);
    res.status(500).json({ success: false, message: 'Server error during room booking' });
  }
};

exports.getAvailableRooms = async (req, res) => {
  try {
    const hostelType = req.query.gender || 'Male'; // Default to Male if not provided

    const [rooms] = await pool.query('SELECT * FROM rooms WHERE hostelType = ?', [hostelType]);
    const [beds] = await pool.query('SELECT * FROM beds WHERE status = "available" AND hostelType = ?', [hostelType]);

    // Group beds by room and filter to only include rooms with available beds
    const availableRooms = rooms.map(room => {
      return {
        ...room,
        beds: beds.filter(b => b.roomId === room.id)
      };
    }).filter(room => room.beds.length > 0);

    res.status(200).json({ success: true, data: availableRooms });
  } catch (error) {
    console.error('Error fetching available rooms:', error);
    res.status(500).json({ success: false, message: 'Server error fetching available rooms' });
  }
};

exports.getRoomOccupancy = async (req, res) => {
  try {
    const [rooms] = await pool.query('SELECT * FROM rooms');
    // Fetch beds with student gender from applications
    const [beds] = await pool.query(`
      SELECT 
        b.roomId, 
        b.bedId, 
        b.status, 
        b.studentId, 
        b.hostelType,
        JSON_UNQUOTE(JSON_EXTRACT(a.formData, '$.sex')) as gender
      FROM beds b
      LEFT JOIN applications a ON b.studentId = a.admissionNo AND a.status = 'Approved'
    `);

    // Group beds by room (and hostelType)
    const roomsWithBeds = rooms.map(room => {
      const roomBeds = beds.filter(b => b.roomId === room.id && b.hostelType === room.hostelType);

      return {
        ...room,
        category: room.hostelType,
        beds: roomBeds
      };
    });

    res.status(200).json({ success: true, data: roomsWithBeds });
  } catch (error) {
    console.error('Error fetching room occupancy:', error);
    res.status(500).json({ success: false, message: 'Server error fetching room occupancy' });
  }
};
