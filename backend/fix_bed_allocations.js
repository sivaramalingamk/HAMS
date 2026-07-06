const pool = require('./config/db');

async function fixBedAllocations() {
  try {
    console.log("Starting bed allocation fix...");

    // 1. Reset all beds
    const [resetResult] = await pool.query("UPDATE beds SET status = 'available', studentId = NULL");
    console.log(`Reset ${resetResult.affectedRows} beds to available.`);

    // 2. Fetch all approved applications
    const [approvedApps] = await pool.query("SELECT * FROM applications WHERE status = 'Approved'");
    console.log(`Found ${approvedApps.length} approved applications.`);

    // 3. Fetch all available beds
    const [availableBeds] = await pool.query("SELECT * FROM beds WHERE status = 'available'");
    console.log(`Found ${availableBeds.length} available beds to assign.`);

    if (availableBeds.length < approvedApps.length) {
      console.warn("WARNING: Not enough beds for all approved applications!");
    }

    // 4. Assign unique beds to each approved application
    let assignedCount = 0;
    for (let i = 0; i < approvedApps.length; i++) {
      if (i < availableBeds.length) {
        const app = approvedApps[i];
        const bed = availableBeds[i];
        
        await pool.query("UPDATE beds SET status = 'booked', studentId = ? WHERE roomId = ? AND bedId = ?", 
          [app.admissionNo, bed.roomId, bed.bedId]
        );
        assignedCount++;
        console.log(`Assigned Student ${app.admissionNo} to Room ${bed.roomId}, Bed ${bed.bedId}`);
      }
    }
    
    console.log(`Successfully reassigned ${assignedCount} beds.`);
    process.exit();
  } catch (error) {
    console.error("Error during bed allocation fix:", error);
    process.exit(1);
  }
}

fixBedAllocations();
