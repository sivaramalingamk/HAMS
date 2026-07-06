const pool = require('../config/db');

exports.submitApplication = async (req, res) => {
  try {
    const data = req.body;
    console.log('📝 Received application submission from:', data.email || 'unknown');
    console.log('   Student Name:', data.nameWithInitial);

    // Validate essential data
    if (!data.nameWithInitial || !data.enrolmentNo) {
      console.warn('⚠️ Missing required fields in submission');
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Check existing applications for this user's account email
    const [existingApps] = await pool.query(
      "SELECT id, status FROM applications WHERE JSON_UNQUOTE(JSON_EXTRACT(formData, '$.email')) = ?",
      [data.email]
    );

    if (existingApps.length >= 3) {
      console.warn('⚠️ Application limit reached for email:', data.email);
      return res.status(400).json({ success: false, message: 'You have reached the maximum limit of 3 applications per account.' });
    }

    const hasPending = existingApps.some(app => app.status === 'Pending');
    if (hasPending) {
      console.warn('⚠️ Pending application exists for email:', data.email);
      return res.status(400).json({ success: false, message: 'You cannot submit a new application while one is still pending review.' });
    }

    const hasApproved = existingApps.some(app => app.status === 'Approved');
    if (hasApproved) {
      console.warn('⚠️ Approved application exists for email:', data.email);
      return res.status(400).json({ success: false, message: 'You already have an approved hostel application and cannot submit another.' });
    }

    const appId = 'APP' + Math.floor(1000 + Math.random() * 9000); // Mock ID generator

    // Convert current date to YYYY-MM-DD
    // Get current date and time in YYYY-MM-DD HH:MM:SS format for MySQL
    const date = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const [result] = await pool.execute(
      'INSERT INTO applications (id, studentName, admissionNo, roomType, date, status, formData) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [appId, data.nameWithInitial, data.enrolmentNo, 'Standard', date, 'Pending', JSON.stringify(data)]
    );

    // If a bed was selected, update its status
    if (data.roomSelection && data.roomSelection.roomId && data.roomSelection.bedId) {
      try {
        const hostelType = data.sex || 'Male';
        await pool.execute(
          'UPDATE beds SET status = ?, studentId = ? WHERE roomId = ? AND bedId = ? AND hostelType = ?',
          ['booked', data.enrolmentNo, data.roomSelection.roomId, data.roomSelection.bedId, hostelType]
        );
      } catch (bedError) {
        console.error('Error updating bed status:', bedError.message);
        // We continue anyway as the application itself is already saved
      }
    }

    res.status(201).json({ success: true, message: 'Application submitted successfully', applicationId: appId });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getAllApplications = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM applications ORDER BY date DESC');
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getApprovedStudents = async (req, res) => {
  try {
    const query = `
      SELECT 
        a.admissionNo as id, 
        a.studentName as name, 
        DATE_FORMAT(a.date, '%Y-%m-%d') as joined,
        JSON_UNQUOTE(JSON_EXTRACT(a.formData, '$.sex')) as gender,
        JSON_UNQUOTE(JSON_EXTRACT(a.formData, '$.handPhone')) as contact,
        b.roomId as room,
        b.bedId as bed
      FROM applications a
      LEFT JOIN beds b ON a.admissionNo = b.studentId
      WHERE a.status = 'Approved'
      ORDER BY a.date DESC
    `;
    const [rows] = await pool.query(query);
    
    // Fallback for formData if needed
    const formattedData = rows.map(row => ({
      ...row,
      gender: row.gender || 'Unknown',
      contact: row.contact || 'N/A',
      room: row.room || 'N/A',
      bed: row.bed || 'N/A'
    }));

    res.status(200).json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Error fetching approved students:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminData } = req.body;

    let query = 'UPDATE applications SET status = ? WHERE id = ?';
    let params = [status, id];

    if (adminData) {
      query = 'UPDATE applications SET status = ?, adminData = ? WHERE id = ?';
      params = [status, JSON.stringify(adminData), id];
    }

    const [result] = await pool.execute(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Insert Notification for the student
    try {
      const [apps] = await pool.query("SELECT JSON_UNQUOTE(JSON_EXTRACT(formData, '$.email')) as email FROM applications WHERE id = ?", [id]);
      if (apps.length > 0 && apps[0].email) {
        const email = apps[0].email;
        let title = '';
        let message = '';
        if (status === 'Approved') {
          title = 'Application Approved 🎉';
          message = `Congratulations! Your hostel application (${id}) has been approved.`;
        } else if (status === 'Rejected') {
          title = 'Application Rejected';
          message = `We regret to inform you that your hostel application (${id}) has been rejected.`;
        }

        if (title) {
          await pool.execute(
            'INSERT INTO notifications (user_email, title, message) VALUES (?, ?, ?)',
            [email, title, message]
          );
        }
      }
    } catch (notifErr) {
      console.error('Error creating notification:', notifErr);
    }

    res.status(200).json({ success: true, message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getStudentApplicationStatus = async (req, res) => {
  try {
    const email = req.params.email;
    console.log('🔍 Fetching status for student:', email);
    const [rows] = await pool.query(
      "SELECT * FROM applications WHERE JSON_UNQUOTE(JSON_EXTRACT(formData, '$.email')) = ? ORDER BY date DESC LIMIT 1",
      [email]
    );

    if (rows.length === 0) {
      console.log('ℹ️ No application found for student:', email);
      return res.status(200).json({ success: true, data: null });
    }

    console.log('✅ Application found for student:', email, 'ID:', rows[0].id);
    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching student status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateStudentApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Check if application exists and is pending
    const [existingApps] = await pool.query('SELECT * FROM applications WHERE id = ?', [id]);

    if (existingApps.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (existingApps[0].status !== 'Rejected') {
      return res.status(400).json({ success: false, message: 'Only rejected applications can be updated and re-submitted.' });
    }

    // Update application in DB and change status back to Pending
    await pool.execute(
      'UPDATE applications SET formData = ?, studentName = ?, admissionNo = ?, status = "Pending" WHERE id = ?',
      [JSON.stringify(data), data.nameWithInitial, data.enrolmentNo, id]
    );

    // If a bed was selected, update its status
    if (data.roomSelection && data.roomSelection.roomId && data.roomSelection.bedId) {
      try {
        // Clear previous booking if any for this student
        await pool.execute('UPDATE beds SET status = "available", studentId = NULL WHERE studentId = ?', [data.enrolmentNo]);

        const hostelType = data.sex || 'Male';
        await pool.execute(
          'UPDATE beds SET status = ?, studentId = ? WHERE roomId = ? AND bedId = ? AND hostelType = ?',
          ['booked', data.enrolmentNo, data.roomSelection.roomId, data.roomSelection.bedId, hostelType]
        );
      } catch (bedError) {
        console.error('Error updating bed status:', bedError.message);
      }
    }

    res.status(200).json({ success: true, message: 'Application updated successfully' });
  } catch (error) {
    console.error('Error updating student application:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
