const pool = require('./config/db');

async function checkStats() {
  try {
    const [students] = await pool.query("SELECT * FROM users WHERE role = 'student'");
    console.log(`Total student users: ${students.length}`);

    const [approvedApps] = await pool.query("SELECT * FROM applications WHERE status = 'Approved'");
    console.log(`Total Approved Applications: ${approvedApps.length}`);

    const [allApps] = await pool.query("SELECT id, status, admissionNo, roomType FROM applications");
    console.log(`Total Applications: ${allApps.length}`);
    allApps.forEach(a => console.log(`  App: ${a.id}, Status: ${a.status}, admissionNo: ${a.admissionNo}`));

    const [beds] = await pool.query("SELECT * FROM beds WHERE status = 'booked'");
    console.log(`Total Booked Beds: ${beds.length}`);
    beds.forEach(b => console.log(`  Bed: Room ${b.roomId}, Bed ${b.bedId}, studentId: ${b.studentId}`));
    
    process.exit();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkStats();
