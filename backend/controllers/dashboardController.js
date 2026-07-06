const pool = require('../config/db');

exports.getStats = async (req, res) => {
  try {
    const [studentsResult] = await pool.query("SELECT COUNT(*) as count FROM applications WHERE status = 'Approved'");
    const totalStudents = studentsResult[0].count;

    const [availableBedsResult] = await pool.query("SELECT COUNT(*) as count FROM beds WHERE status = 'available'");
    const availableBeds = availableBedsResult[0].count;

    const [occupiedBedsResult] = await pool.query(`
      SELECT COUNT(b.bedId) as count 
      FROM beds b 
      JOIN applications a ON b.studentId = a.admissionNo 
      WHERE b.status = 'booked' AND a.status = 'Approved'
    `);
    const occupiedBeds = occupiedBedsResult[0].count;

    const [pendingAppsResult] = await pool.query("SELECT COUNT(*) as count FROM applications WHERE status = 'Pending'");
    const pendingApplications = pendingAppsResult[0].count;

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        availableBeds,
        occupiedBeds,
        pendingApplications
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
