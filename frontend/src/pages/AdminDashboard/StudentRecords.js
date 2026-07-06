import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import axios from 'axios';

const StudentRecords = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        const response = await axios.get('http://localhost:5000/api/applications/approved', config);
        if (response.data.success) {
          setStudents(response.data.data);
        } else {
          setError('Failed to fetch records');
        }
      } catch (err) {
        console.error('Error fetching student records:', err);
        setError('An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  return (
    <div>
      <header className="main-header">
        <h2>Student Records</h2>
        <div className="user-profile">Admin User</div>
      </header>
      
      <section className="table-section" style={{ marginTop: '30px' }}>
        <div className="section-header">
          <h3>Registered Hostel Residents</h3>
        </div>
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Registration No</th>
                <th>Student Name</th>
                <th>Gender</th>
                <th>Allocation (Room/Bed)</th>
                <th>Contact Number</th>
                <th>Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="6" style={{ textAlign: 'center' }}>Loading...</td></tr>}
              {error && <tr><td colSpan="6" style={{ textAlign: 'center', color: 'red' }}>{error}</td></tr>}
              {!loading && !error && students.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center' }}>No approved students found.</td></tr>}
              {!loading && !error && students.map((std, index) => (
                <tr key={std.id || index} className="table-row-interactive">
                  <td><span className="mono-text">{std.id}</span></td>
                  <td>
                    <div className="student-name-cell">
                      <div className="avatar-placeholder" style={{ background: std.gender === 'Female' ? 'linear-gradient(135deg, #fbcfe8 0%, #f9a8d4 100%)' : undefined, color: std.gender === 'Female' ? '#be185d' : undefined }}>
                        {std.name.charAt(0)}
                      </div>
                      <span>{std.name}</span>
                    </div>
                  </td>
                  <td>{std.gender}</td>
                  <td><strong>Room {std.room}</strong> - Bed {std.bed}</td>
                  <td>{std.contact}</td>
                  <td>{std.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
export default StudentRecords;
